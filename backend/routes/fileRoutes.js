import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import projectAccessMiddleware from "../middleware/projectAccessMiddleware.js";
import { uploadSingleFile } from "../middleware/uploadMiddleware.js";

import {
  uploadProjectFile,
  getProjectFiles,
  previewProjectFile,
  downloadProjectFile,
  deleteProjectFile,
} from "../controllers/fileController.js";

const router = express.Router();

// Authentication required
router.use(authMiddleware);

// Verify project ownership or membership
router.use("/:projectId", projectAccessMiddleware);

// Handle upload errors
const handleFileUpload = (req, res, next) => {
  uploadSingleFile(req, res, (error) => {
    if (error) {
      console.error("MULTER ERROR:", error.message);

      return res.status(400).json({
        success: false,
        message: error.message || "File upload failed.",
      });
    }

    // Convert Multer fields into req.file
    req.file =
      req.files?.file?.[0] ||
      req.files?.Value?.[0] ||
      null;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file to upload",
      });
    }

    next();
  });
};

// Upload file
router.post(
  "/:projectId/files",
  handleFileUpload,
  uploadProjectFile
);

// Get project files
router.get(
  "/:projectId/files",
  getProjectFiles
);

// Preview file
router.get(
  "/:projectId/files/:fileId/preview",
  previewProjectFile
);

// Download file
router.get(
  "/:projectId/files/:fileId/download",
  downloadProjectFile
);

// Delete file
router.delete(
  "/:projectId/files/:fileId",
  deleteProjectFile
);

export default router;