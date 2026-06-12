import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { wrapAsync } from "../utils/asyncHandler.js";

const toggleSubscription = wrapAsync(async (req, res) => {
  const { channelId } = req.params;
  //  toggle subscription
  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(404, "Invalid channel id");
  }

  const userId = req.user._id;
  if (userId.toString() === channelId) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const deletedSubscription = await Subscription.findOneAndDelete({
    subscriber: userId,
    channel: channelId,
  });

  let isSubscribed;

  if (!deletedSubscription) {
    await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    isSubscribed = true;
  } else {
    isSubscribed = false;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isSubscribed,
      },
      isSubscribed ? "Subscribed successfully" : "Unsubscribed successfully",
    ),
  );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = wrapAsync(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(404, "Invalid channel id");
  }

  const channelSubs = await Subscription.aggregate([
    { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
      },
    },
    {
      $unwind: "$subscriberDetails",
    },
    {
      $project: {
        _id: "$subscriberDetails._id",
        username: "$subscriberDetails.username",
        avatar: "$subscriberDetails.avatar",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscribers: channelSubs },
        "Subscribers fetched successfully",
      ),
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = wrapAsync(async (req, res) => {
  const { subscriberId } = req.params;
  if (!mongoose.isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber id");
  }

  const channelsSubscribedTo = await Subscription.aggregate([
    { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
      },
    },
    {
      $unwind: "$channelDetails",
    },
    {
      $project: {
        _id: "$channelDetails._id",
        username: "$channelDetails.username",
        fullName: "$channelDetails.fullname",
        avatar: "$channelDetails.avatar",
      },
    },
  ]);
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
