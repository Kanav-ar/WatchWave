import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  incrementVideoView,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validateVideoPublish } from "../middlewares/validation.middleware.js";

const router = Router();
router.use(authenticateUser);

router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    validateVideoPublish,
    publishAVideo,
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

router.post("/videos/:videoId/view", authenticateUser, incrementVideoView);

export default router;
