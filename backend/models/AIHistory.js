import mongoose from "mongoose";

const aiHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toolType: {
      type: String,
      enum: ["code-explainer", "documentation", "readme"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    inputCode: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "",
    },
    output: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

aiHistorySchema.index({ user: 1, toolType: 1, updatedAt: -1 });

export default mongoose.model("AIHistory", aiHistorySchema);
