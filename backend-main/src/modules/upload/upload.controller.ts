import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import path from "path";
import fs from "fs";
import { authService } from "../auth/auth.service";

const uploadsDir = path.join(__dirname, "../../../uploads");

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filename = req.file.filename;
    const fileUrl = `/api/files/upload/${filename}`;

    res.status(200).json({
      message: "File uploaded successfully",
      filename,
      url: fileUrl,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getFile = async (req: any, res: Response) => {
  try {
    const { filename } = req.params;

    // Prevent directory traversal attacks
    const safePath = path.join(uploadsDir, path.basename(filename));

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.sendFile(safePath);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filename = req.file.filename;
    const result = await authService.updateAvatar(req.user.id, filename);

    res.status(200).json({
      message: "Avatar uploaded successfully",
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
