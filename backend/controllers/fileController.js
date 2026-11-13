import ProjectFile from "../models/File.js";
import { uploadDirectory } from "../middleware/uploadMiddleware.js";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";

// Get safe stored file path
const getStoredFilePath = (storedName) => {
  const filePath = path.resolve(uploadDirectory, storedName);

  if (!filePath.startsWith(uploadDirectory + path.sep)) {
    throw new Error("Invalid file path");
  }

  return filePath;
};

// Upload file to project
export const uploadProjectFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file to upload",
      });
    }

    const file = await ProjectFile.create({
      project: req.project._id,
      uploadedBy: req.user.id,
      originalName: path.basename(req.file.originalname),
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file: {
        _id: file._id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
      },
    });

  } catch (error) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    console.error("Upload file error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to upload file",
    });
  }
};

// Get all files of a project
export const getProjectFiles = async (req, res) => {
  try {
    const files = await ProjectFile.find({
      project: req.project._id,
    })
      .select("-storedName")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      files,
    });

  } catch (error) {
    console.error("Get files error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch project files",
    });
  }
};

// Find a file belonging to the current project
const findProjectFile = async (req, res) => {
  const { fileId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    res.status(400).json({
      success: false,
      message: "Invalid file ID",
    });

    return null;
  }

  const file = await ProjectFile.findOne({
    _id: fileId,
    project: req.project._id,
  });

  if (!file) {
    res.status(404).json({
      success: false,
      message: "File not found",
    });

    return null;
  }

  return file;
};

// Preview file
export const previewProjectFile = async (req, res) => {
  try {
    const file = await findProjectFile(req, res);

    if (!file) return;

    const filePath = getStoredFilePath(file.storedName);

    const inlineTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
    ];

    const isTextFile =
      file.mimeType.startsWith("text/") ||
      file.mimeType === "application/json";

    if (!inlineTypes.includes(file.mimeType) && !isTextFile) {
      return res.status(415).json({
        success: false,
        message: "Preview is not available for this file type. Download it instead.",
      });
    }

    const contentType = isTextFile
      ? "text/plain; charset=utf-8"
      : file.mimeType;

    res.setHeader("Content-Type", contentType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "sandbox");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${path.basename(file.originalName).replace(/["\\\r\n]/g, "_")}"`
    );

    return res.sendFile(filePath);

  } catch (error) {
    console.error("Preview file error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to preview file",
    });
  }
};

// Download file
export const downloadProjectFile = async (req, res) => {
  try {
    const file = await findProjectFile(req, res);

    if (!file) return;

    const filePath = getStoredFilePath(file.storedName);

    return res.download(
      filePath,
      path.basename(file.originalName)
    );

  } catch (error) {
    console.error("Download file error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to download file",
    });
  }
};

// Delete file
export const deleteProjectFile = async (req, res) => {
  try {
    const file = await findProjectFile(req, res);

    if (!file) return;

    const filePath = getStoredFilePath(file.storedName);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    await file.deleteOne();

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });

  } catch (error) {
    console.error("Delete file error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete file",
    });
  }
};