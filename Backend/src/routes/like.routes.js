import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    togglePostLike,
} from "../controllers/like.controller.js"
import {authenticateUser} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(authenticateUser); 

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:postId").post(togglePostLike);
router.route("/videos").get(getLikedVideos);

export default router