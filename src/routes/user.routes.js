import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { z } from "zod";
import registerValidationSchema from "../middlewares/validation.middleware.js";

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
//   validate(registerValidationSchema),
  registerUser,
);

export default router;
