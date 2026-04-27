import express from "express";
import { uploadFile, getFile, uploadAvatar } from "./upload.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { uploadFile as uploadFileMiddleware, uploadAvatar as uploadAvatarMiddleware } from "../../middleware/upload.middleware";

const router = express.Router();

// Protected routes - require authentication
router.post("/upload", authMiddleware, uploadFileMiddleware, uploadFile);
router.post("/avatar", authMiddleware, uploadAvatarMiddleware, uploadAvatar);

// Public routes - no authentication required
router.get("/upload/:filename", getFile);

export default router;
