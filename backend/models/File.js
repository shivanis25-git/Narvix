import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    // Project containing this file
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    // User who uploaded this file
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Original filename
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    // Unique filename stored on the server
    storedName: {
      type: String,
      required: true,
      unique: true,
    },

    // File MIME type
    mimeType: {
      type: String,
      required: true,
    },

    // File size in bytes
    size: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Project-wise file listing
fileSchema.index({
  project: 1,
  createdAt: -1,
});

const ProjectFile = mongoose.model("ProjectFile", fileSchema);

export default ProjectFile;