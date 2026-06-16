import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { wrapAsync } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = wrapAsync(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  // get all videos based on query, sort, pagination

  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  const skip = (pageNumber - 1) * limitNumber;

  const filter = {
    isPublished: true,
  };

  const sort = {};

  // If user if exist check its validity
  if (userId) {
    if (!mongoose.isValidObjectId(userId)) {
      throw new ApiError(400, "Not a valid user id");
    }
    filter.owner = userId;
  }

  if (query?.trim()) {
    const escapedSearch = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      {
        title: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        description: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  if (sortType && sortBy) {
    const sortOrder = sortType.trim() === "asc" ? 1 : -1;
    const sortField = sortBy.trim();

    sort[sortField] = sortOrder;
  } else {
    // Default sorting
    sort.createdAt = -1;
  }

  const videos = await Video.find(filter)
    .populate("owner","username avatar")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalVideos = await Video.countDocuments(filter);
  const totalPages = Math.ceil(totalVideos / limitNumber);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        page: pageNumber,
        limit: limitNumber,
        totalVideos,
        totalPages,
      },
      "Videos fetched successfully",
    ),
  );
});

const publishAVideo = wrapAsync(async (req, res) => {
  const { title, description } = req.body;
  //  get video, upload to cloudinary, create video

  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "You must be logged in to upload a video");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "No video found, please upload a video");
  }

  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail can't be empty");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  if (!videoFile) {
    throw new ApiError(500, "Video upload failed");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(500, "Thumbnail upload failed");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: { url: videoFile?.url, public_id: videoFile?.public_id },
    thumbnail: { url: thumbnail?.url, public_id: thumbnail?.public_id },
    duration: videoFile?.duration,
    owner: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video uploaded successfully"));
});

const getVideoById = wrapAsync(async (req, res) => {
  // get video by id
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id format");
  }

  const video = await Video.findById(videoId).populate("owner");

  if (!video) {
    throw new ApiError(404, "Invalid video id");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = wrapAsync(async (req, res) => {
  // update video details like title, description, thumbnail
  const { videoId } = req.params;

  const { title, description } = req.body;

  const updates = {};

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id format");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Check if the request is from the owner
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  // Title
  if (title) {
    video.title = title;
    updates.title = "Title updated!";
  }
  // Description
  if (description) {
    video.description = description;
    updates.description = "Description updated!";
  }
  // Thumbnail
  const thumbnailLocalPath = req.file?.path;

  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    // delete old thumbnail from cloudinary
    if (thumbnail) {
      if (video.thumbnail?.public_id) {
        await deleteFromCloudinary(video.thumbnail?.public_id);
      }

      updates.thumbnail = "Thumbnail updated!";
      video.thumbnail.url = thumbnail.url;
      video.thumbnail.public_id = thumbnail.public_id;
    }
  }
  // Save the document only when something is updated
  if (Object.keys(updates).length > 0) {
    await video.save();
  } else {
    throw new ApiError(400, "No updates provided");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updates, video },
        "Video details updated successfully",
      ),
    );
});

const deleteVideo = wrapAsync(async (req, res) => {
  const { videoId } = req.params;
  // delete video

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Something went wrong");
  }

  // Check owner before deletion
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      401,
      "Unauthorized request! You are not the publisher of this video",
    );
  }

  // Delete video and thumbnail from cloudinary
  if (video.videoFile?.public_id) {
    await deleteFromCloudinary(video.videoFile.public_id);
  }

  if (video.thumbnail?.public_id) {
    await deleteFromCloudinary(video.thumbnail.public_id);
  }

  // Delete from DB
  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video Deleted successfully"));
});

const togglePublishStatus = wrapAsync(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "Unauthorized request! You are not the publisher of this video",
    );
  }

  video.isPublished = !video.isPublished;
  await video.save();

  const status = video.isPublished
    ? "Video is published"
    : "Video is now private";

  res
    .status(200)
    .json(
      new ApiResponse(200, { isPublished: video.isPublished }, `${status}`),
    );
});

const incrementVideoView = wrapAsync(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: true,
    }
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        views: video.views,
      },
      "View counted successfully"
    )
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  incrementVideoView
};
