import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { wrapAsync } from "../utils/asyncHandler.js";

const getVideoComments = wrapAsync(async (req, res) => {
  // get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
});

const addComment = wrapAsync(async (req, res) => {
  //  add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  // Check if the video exist in the db
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(
      404,
      "The video you are trying to comment on doesn't exist!",
    );
  }

  if (!content?.trim()) {
    throw new ApiError(400, "You can't post an empty comment!");
  }

  const comment = await Comment.create({
    content: content,
    video,
    owner: req.user._id,
  });

  return res.status(200).json(new ApiResponse(200, comment, "Comment posted"));
});

const updateComment = wrapAsync(async (req, res) => {
  //  update a comment
  const { commentId } = req.params;
  const { contentToEdit } = req.body;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (!comment.owner.equals(req.user._id)) {
    throw new ApiError(403, "You have not published this comment");
  }

  if (!contentToEdit?.trim()) {
    throw new ApiError(400, "Updation can't be empty");
  }

  if (comment.content === contentToEdit.trim()) {
    throw new ApiError(
      400,
      "New content must be different from existing content",
    );
  }

  comment.content = contentToEdit.trim();
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { comment }, "Comment edited successfully"));
});

const deleteComment = wrapAsync(async (req, res) => {
  //  delete a comment
  const { commentId } = req.params;
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user._id,
  });

  if (!deletedComment) {
    throw new ApiError(404, "Comment not found or unauthorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {deleteComment}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
