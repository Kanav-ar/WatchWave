import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import { z } from "zod";
import validateRegister from "../middlewares/validation.middleware.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

// router.route("/register").post(registerUser);
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


export default router;
