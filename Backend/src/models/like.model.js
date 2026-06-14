import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

likeSchema.index(
  { video: 1, likedBy: 1 },
  {
    unique: true,
    partialFilterExpression: {
      video: { $exists: true },
    },
  },
);

// Like a comment only once
likeSchema.index(
  { comment: 1, likedBy: 1 },
  {
    unique: true,
    partialFilterExpression: {
      comment: { $exists: true },
    },
  },
);

// Like a post only once
likeSchema.index(
  { post: 1, likedBy: 1 },
  {
    unique: true,
    partialFilterExpression: {
      post: { $exists: true },
    },
  },
);

export const Like = mongoose.model("Like", likeSchema);
