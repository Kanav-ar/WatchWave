import mongoose, { isValidObjectId } from "mongoose";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { wrapAsync } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const createPost = wrapAsync(async (req, res) => {
  // create Post
  const { content } = req.body;

  if (!content || content.length < 5) {
    throw new ApiError(400, "Content can't be too short");
  }

  const postImageLocalPath = req.file?.path;

  const postData = {
    content,
    owner: req.user._id,
  };

  let postImage;

  if (postImageLocalPath) {
    postImage = await uploadOnCloudinary(postImageLocalPath);
  }

  if (postImage) {
    postData.postImage = {
      url: postImage.url,
      publicId: postImage.public_id,
    };
  }

  const post = await Post.create(postData);

  return res.status(200).json(new Response(200, { post }, "New post created"));
});

const getUserPosts = wrapAsync(async (req, res) => {
  // get user Posts
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const userPosts = await Post.find({ owner: req.user._id })
    .populate("owner", "username avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(10);

  return res
    .status(200)
    .json(new ApiResponse(200, userPosts, "User Posts fetched successfully"));
});

const updatePost = wrapAsync(async (req, res) => {
  // update Post

  const { postId } = req.params;

  const { content } = req.body;

  if (!mongoose.isValidObjectId(postId)) {
    throw new ApiError(400, "Not a valid post id");
  }

  const post = await Post.findById(postId);

  // owner check
  if (req.user._id.toString() !== post.owner.toString()) {
    throw new ApiError(403, "You are not the owner of this post");
  }

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const updates = {};

  // content update
  if (content?.trim()) {
    post.content = content.trim();
    updates.content = "Content edited successfully";
  }

  // Delete from cloudinary
  if (post.postImage?.publicId) {
    await deleteFromCloudinary(post.postImage.publicId);
  }
  // image update
  const postImageLocalPath = req.file?.path;
  if (postImageLocalPath) {
    // upload to cloud
    const updatedPostImage = await uploadOnCloudinary(postImageLocalPath);
    if (!updatedPostImage) {
      throw new ApiError(500, "Something went wrong while updating the post");
    }

    post.postImage = {
      url: updatedPostImage.url,
      publicId: updatedPostImage.public_id,
    };
    updates.image = "Post image updated!";
  }

  if (Object.keys(updates).length > 0) {
    await post.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { updates, post }, "Post updated successfully"));
});

const deletePost = wrapAsync(async (req, res) => {
  // delete Post
  const { postId } = req.params;
  if (!mongoose.isValidObjectId(postId)) {
    throw new ApiError(400, "Not a valid post id");
  }

  // find the post
  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // check the owner
  if (!post.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not the publisher of this post");
  }

  // delete it from cloud and db

  if(post.postImage?.publicId){
    await deleteFromCloudinary(post.postImage.publicId);
  }

  await post.deleteOne();



  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Post deleted successfully"));
});

export { createPost, getUserPosts, updatePost, deletePost };
