import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { wrapAsync } from "../utils/asyncHandler.js";

const toggleVideoLike = wrapAsync(async (req, res) => {
  const { videoId } = req.params;
  //toggle like on video

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Please provide a valid video id");
  }

  const deletedLike = await Like.findOneAndDelete({
    video: videoId,
    likedBy: req.user._id,
  });

  let message = "Video unliked";
  if (!deletedLike) {
    await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    message = "Video liked";
  }

  return res.status(200).json(new ApiResponse(200, {}, message));
});

const toggleCommentLike = wrapAsync(async (req, res) => {
  const { commentId } = req.params;
  //toggle like on comment
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Please provide a valid comment id");
  }

  const deletedLike = await Like.findOneAndDelete({
    comment: commentId,
    likedBy: req.user._id,
  });

  let message = "comment unliked";
  if (!deletedLike) {
    await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    message = "comment liked";
  }

  return res.status(200).json(new ApiResponse(200, {}, message));
});

const togglePostLike = wrapAsync(async (req, res) => {
  const { postId } = req.params;
  //toggle like on post
  if (!mongoose.isValidObjectId(postId)) {
    throw new ApiError(400, "Please provide a valid post id");
  }

  const deletedLike = await Like.findOneAndDelete({
    post: postId,
    likedBy: req.user._id,
  });

  let message = "post unliked";
  if (!deletedLike) {
    await Like.create({
      post: postId,
      likedBy: req.user._id,
    });
    message = "post liked";
  }

  return res.status(200).json(new ApiResponse(200, {}, message));
});

const getLikedVideos = wrapAsync(async (req, res) => {
  //get all liked videos

  const likedVideos = await Like.find({
    likedBy: req.user._id,
    video: { $exists: true },
  }).populate("video");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { likedVideos },
        "Liked videos fetched successfully",
      ),
    );
});

export { toggleCommentLike, togglePostLike, toggleVideoLike, getLikedVideos };
