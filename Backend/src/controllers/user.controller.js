import { wrapAsync } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { Schema } from "mongoose";

const generateAccessAndRefreshTokens = async function (userId) {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
};

// SIGNUP / REGISTER controller
const registerUser = wrapAsync(async (req, res) => {
  // take data from frontend - username, fullname, password, email
  const { username, fullname, email, password } = req.body;

  // validate - done by zod
  // check username and email - must be unique
  const existingUser = await User.findOne({
    $or: [{ username: username }, { email: email }],
  });

  if (existingUser) {
    if (existingUser.username === username) {
      throw new ApiError(409, "Username already exists");
    }

    if (existingUser.email === email) {
      throw new ApiError(409, "Email already exists");
    }
  }

  // check images - cover and avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath = null;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  // upload to cloudinary, get the url of avatar and cover image if uploaded
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // make an object of user details to store it into db
  const newUser = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    fullname,
    password,
    avatar: { url: avatar.url, public_id: avatar.public_id },
    coverImage: {
      url: coverImage?.url || "",
      public_id: coverImage?.public_id || "",
    },
  });

  // check if the user exists in db before sending it to frontend
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // response to frontend
  res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User registered successfully!"));
});

// LOGIN controller
const loginUser = wrapAsync(async (req, res) => {
  // recieve username and password
  const { email = null, username = null, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // compare both with the username and password in db
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // if correct - generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  // send these tokens to frontend via cookies
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In successfully",
      ),
    );
});

// LOGOUT controller
const logoutUser = wrapAsync(async (req, res) => {
  const userId = req.user._id;

  await User.findByIdAndUpdate(
    userId,
    { $unset: { refreshToken: 1 } },
    { new: true },
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// REFRESH controller
const refreshAccessToken = wrapAsync(async (req, res) => {
  const incomingToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = jwt.verify(
    incomingToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  const user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (user?.refreshToken !== incomingToken) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  console.log(refreshToken);
  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          newRefreshToken: refreshToken,
        },
        "Access token refreshed",
      ),
    );
});

// To change password when user is logged in
const changePassword = wrapAsync(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  console.log("oldpass:", oldPassword);
  console.log("newpass:", newPassword);
  console.log("confpass:", confirmPassword);

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirm password doesn't match");
  }

  const user = await User.findById(req.user?._id);
  console.log(user);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(
      400,
      "The password you entered is not correct, Try again!",
    );
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

// Forgot password without log in

// const forgotPassword = wrapAsync(async (req, res) => {
//   const { email } = req.body;

//   const user = await User.findOne({ email });

//   if (!user) {
//     throw new ApiError(404, "Invalid email");
//   }

//   // Yet to implement

// });

// Get current user
const getCurrentUser = wrapAsync(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// Update user details
const updateUserDetails = wrapAsync(async (req, res) => {
  const { username, email, fullname } = req.body;

  const user = await User.findById(req.user._id).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const now = Date.now();

  const updates = {};
  const errors = {};

  // Username update
  if (username && username !== user.username) {
    const thrityDays = 30 * 24 * 60 * 60 * 1000;

    if (!user.usernameLastChangedAt) {
      user.usernameLastChangedAt = new Date(0);
    }
    const diff = now - user.usernameLastChangedAt.getTime();

    if (diff >= thrityDays) {
      user.username = username;
      user.usernameLastChangedAt = new Date();

      updates.username = "Updated successfully";
    } else {
      errors.username = "Username can only be changed once every 60 days";
    }
  }

  // Email
  if (email && email !== user.email) {
    const sixtyDays = 60 * 24 * 60 * 60 * 1000;

    if (!user.emailLastChangedAt) {
      user.emailLastChangedAt = new Date(0);
    }
    const diff = now - user.emailLastChangedAt.getTime();

    if (diff >= sixtyDays) {
      user.email = email;
      user.emailLastChangedAt = new Date();

      updates.email = "Updated successfully";
    } else {
      errors.email = "Email can only be changed once every 30 days";
    }
  }

  // Fullname
  if (fullname && fullname !== user.fullname) {
    user.fullname = fullname;
    updates.fullname = "Updated successfully";
  }

  // Save only if something changed
  if (Object.keys(updates).length > 0) {
    await user.save();
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedFields: updates, failedFields: errors, user },
        "Updated successfully",
      ),
    );
});

// Update Avatar
const updateUserAvatar = wrapAsync(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Provide a file to update");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new ApiError(500, "Failed to update avatar try again later");
  }

  const user = await User.findById(req.user._id).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // To delete the url of old image from the cloud server
  if (user.avatar?.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  user.avatar.url = avatar.secure_url;
  user.avatar.public_id = avatar.public_id;
  await user.save({ validateBeforeSave: false });


  res
    .status(200)
    .json(new ApiResponse(200, { user }, "Avatar updated successfully"));
});

// Update Cover image
const updateUserCoverImage = wrapAsync(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(404, "File not found");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage?.url) {
    throw new ApiError(
      500,
      "Something went wrong while updating the cover image",
    );
  }

  const user = await User.findById(req.user._id).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // To delete the url of old image from the cloud server
  if (user.coverImage?.public_id) {
    await deleteFromCloudinary(user.coverImage.public_id);
  }

  user.coverImage.url = coverImage.secure_url;
  user.coverImage.public_id = coverImage.public_id;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, user, "Cover Image updated"));
});

// Get channel information
const getUserChannelProfile = wrapAsync(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Invalid username");
  }

  const channel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        fullname: 1,
        subscriberCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel doesn't exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched"));
});

// Update user's watch history
const updateUserWatchHistory = wrapAsync(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!videoId) {
    throw new ApiError(400, "Missing video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Invalid video id");
  }

  await User.findByIdAndUpdate(userId, {
    $pull: { watchHistory: videoId },
  });

  await User.findByIdAndUpdate(userId, {
    $push: { watchHistory: { $each: [videoId], $position: 0 } },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Watch history updated successfully"));
});

// Get user's Watch history
const getUserWatchHistory = wrapAsync(async (req, res) => {
  const userWatchHistory = await User.aggregate([
    {
      $match: {
        _id: Schema.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userWatchHistory[0].watchHistory,
        "Watch history fetched successfully",
      ),
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  updateUserWatchHistory,
  getUserWatchHistory,
};
