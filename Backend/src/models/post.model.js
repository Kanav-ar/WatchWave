import mongoose, { Schema } from "mongoose";

const postSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      min: 5,
    },
    postImage: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    
  },
  { timestamps: true },
);

export const Post = mongoose.model("Post", postSchema);
