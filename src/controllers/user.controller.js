import { wrapAsync } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const registerUser = wrapAsync(async (req, res) => {
  // take data from frontend - username, fullname, password, email
  const { username, fullname, email, password } = req.body;
  let userDetails = { username, fullname, email, password };
  res.status(200).json(userDetails);
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
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

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

export { registerUser };
