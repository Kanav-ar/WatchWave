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


router.post(
  "/register",
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

router.post("/login", loginUser);

// secured routes
router.post("/logout", authenticateUser, logoutUser);

router.post("/refresh-token", refreshAccessToken);

router.post("/change-password", authenticateUser, changePassword);

router.get("/current-user", authenticateUser, getCurrentUser);

router.patch("/update-account", authenticateUser, updateUserDetails);

router.patch(
  "/avatar",
  authenticateUser,
  upload.single("avatar"),
  updateUserAvatar,
);

router.patch(
  "/cover-image",
  authenticateUser,
  upload.single("coverImage"),
  updateUserCoverImage,
);

router.get("/channel/:username", authenticateUser, getUserChannelProfile);

router.patch("/watch-history", updateUserWatchHistory);

router.get("/watch-history", getUserWatchHistory);

export default router;
