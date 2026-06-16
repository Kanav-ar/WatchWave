import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { wrapAsync } from "../utils/asyncHandler.js";
import { monitorEventLoopDelay } from "perf_hooks";
import { User } from "../models/user.model.js";

const getChannelStats = wrapAsync(async (req, res) => {
  //  Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const channelStats = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "videos",
        let: { ownerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$owner", "$$ownerId"],
              },
            },
          },
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "likesOnVideo",
            },
          },
          {
            $addFields: {
              likesCount: {
                $size: "$likesOnVideo",
              },
            },
          },
          {
            $group: {
              _id: null,
              totalViews: { $sum: "$views" }, // COunt total views
              totalVideos: { $sum: 1 }, // count total videos
              totalLikes: { $sum: "$likesCount" },
            },
          },
          {
            $project: {
              totalVideos: 1,
              totalViews: 1,
              totalLikes: 1,
            },
          },
        ],
        as: "videosStats",
      },
    },
    {
      // for finding total subscribers
      $lookup: {
        from: "subscriptions",
        let: { channelId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$channel", "$$channelId"],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalSubscribers: { $sum: 1 },
            },
          },
          {
            $project: {
              totalSubscribers: 1,
            },
          },
        ],
        as: "subscriberStats",
      },
    },
    {
      $addFields: {
        videosStats: {
          $arrayElemAt: ["$videosStats", 0],
        },
        subscriberStats: {
          $arrayElemAt: ["$subscriberStats", 0],
        },
      },
    },
    {
      $project: {
        username: 1,
        avatar: 1,
        totalViews: "$videosStats.totalViews",
        totalVideos: "$videosStats.totalVideos",
        totalLikes: "$videosStats.totalLikes",
        totalSubscribers: "$subscriberStats.totalSubscribers",
      },
    },
  ]);

  if (!channelStats.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelStats[0],
        "Channel stats fetched successfully",
      ),
    );
});

const getChannelVideos = wrapAsync(async (req, res) => {
  //  Get all the videos uploaded by the channel
  const { channelId } = req.params;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const skip = (page - 1) * limit;
  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel Id not valid");
  }

  const videos = await Video.find({ owner: channelId })
    .populate("owner", "username avatar")
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });

  const totalVideos = await Video.countDocuments({
    owner: channelId,
  });

  const totalPages = Math.ceil(totalVideos / limit);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videos,
        totalVideos,
        totalPages,
        videos.length > 0 ? "Videos fetched" : "No videos found",
      ),
    );
});

export { getChannelStats, getChannelVideos };
