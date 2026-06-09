import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  changePassword,
  getCurrentUser,
  getUserChannelProfile,
  getUserWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateUserAvatar,
  updateUserCoverImage,
  updateUserDetails,
  updateUserWatchHistory,
} from "../controllers/user.controller.js";
import { z } from "zod";
import validateRegister from "../middlewares/validation.middleware.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  validateRegister,
  registerUser,
);

router.route("/login").post(loginUser);

router.route("/logout").post(authenticateUser, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(
  authenticateUser,
  changePassword,
);

router.route("/current-user").get(
  authenticateUser,
  getCurrentUser,
);

router.route("/update-account").patch(
  authenticateUser,
  updateUserDetails,
);

router.route("/avatar").patch(
  authenticateUser,
  upload.single("avatar"),
  updateUserAvatar,
);

router.route("/cover-image").patch(
  authenticateUser,
  upload.single("coverImage"),
  updateUserCoverImage,
);

router.route("/channel/:username").get(
  authenticateUser,
  getUserChannelProfile,
);

router
  .route("/watch-history")
  .get(getUserWatchHistory)
  .patch(updateUserWatchHistory);

export default router;
