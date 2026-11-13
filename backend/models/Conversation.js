import mongoose from "mongoose";

// Individual chat messages
const messageSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: true,
      trim: true,
    },

    response: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Complete conversation
const conversationSchema = new mongoose.Schema(
  {
    // User who owns this conversation
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Conversation title
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // All messages in this conversation
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

// Improve user's chat history queries
conversationSchema.index({
  user: 1,
  updatedAt: -1,
});

const Conversation = mongoose.model(
  "Conversation",
  conversationSchema
);

export default Conversation;