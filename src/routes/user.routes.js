import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { registerUser } from "../controllers/user.controller.js";
import { z } from "zod";
import validateRegister from "../middlewares/validation.middleware.js";

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

export default router;
