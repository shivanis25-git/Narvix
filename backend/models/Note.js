import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    // Note title
    title: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
      maxlength: 150,
    },

    // Markdown content
    content: {
      type: String,
      required: [true, "Note content is required"],
      default: "",
    },

    // Project associated with this note
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    // User who created the note
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Improve project-wise note queries
noteSchema.index({ project: 1, updatedAt: -1 });

const Note = mongoose.model("Note", noteSchema);

export default Note;