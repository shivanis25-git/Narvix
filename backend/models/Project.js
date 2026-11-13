import mongoose from "mongoose";
import { randomBytes } from "node:crypto";

const projectSchema = new mongoose.Schema(
  {
    // Project information
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // Project progress status
    status: {
      type: String,
      enum: ["planning", "in-progress", "completed"],
      default: "planning",
    },

    // Project creator
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Project team members
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        role: {
          type: String,
          enum: ["admin", "member"],
          default: "member",
        },

        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Public or private project
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    // Unique ID for public project sharing
    publicId: {
      type: String,
      unique: true,
      default: () => randomBytes(16).toString("hex"),
    },
  },
  {
    timestamps: true,
  }
);

// Database indexes
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ "members.user": 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;