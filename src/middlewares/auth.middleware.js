import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import ApiError from "../utils/ApiError";
import { wrapAsync } from "../utils/asyncHandler";


export const authenticateUser = wrapAsync(async function (req, _, next) {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      throw new ApiError(400, "Invalid access token");
    }

    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw new ApiError(401, "Token not valid");
    }

    req.user = user;
    next();

  } catch (error) {
    throw new ApiError(401, error?.message || "Token expired or invalid");
  }
});
