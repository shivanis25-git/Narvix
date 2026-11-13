import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

// Upload directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadDirectory = path.resolve(
  __dirname,
  "../uploads"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

// Supported file types
const allowedTypes = {
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".txt": ["text/plain"],
  ".md": ["text/markdown", "text/plain"],
  ".js": ["text/javascript", "application/javascript", "text/plain"],
  ".jsx": ["text/plain", "text/javascript", "application/javascript"],
  ".ts": ["text/plain", "text/javascript", "application/javascript"],
  ".tsx": ["text/plain", "text/javascript", "application/javascript"],
  ".css": ["text/css", "text/plain"],
  ".html": ["text/html", "text/plain"],
  ".json": ["application/json", "text/plain"],
  ".csv": ["text/csv", "text/plain"],
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    cb(null, `${randomUUID()}${extension}`);
  },
});

// File validation
const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  const acceptedMimes = allowedTypes[extension];

  if (!acceptedMimes || !acceptedMimes.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type."));
  }

  cb(null, true);
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

// Export single file uploader
export const uploadSingleFile = upload.fields([
  { name: "file", maxCount: 1 },
  { name: "Value", maxCount: 1 },
]);