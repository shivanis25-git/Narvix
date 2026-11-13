import Conversation from "../models/Conversation.js";
import mongoose from "mongoose";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// Get all conversations of logged-in user
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      user: req.user.id,
    })
      .select("title createdAt updatedAt messages")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch chat history",
    });
  }
};

// Get one conversation with all messages
export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Get conversation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch conversation",
    });
  }
};

// Edit message and regenerate Gemini response
export const editMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { prompt } = req.body ?? {};

    if (
      !mongoose.Types.ObjectId.isValid(conversationId) ||
      !mongoose.Types.ObjectId.isValid(messageId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation or message ID",
      });
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid message",
      });
    }

    if (prompt.length > 8000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const message = conversation.messages.id(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt.trim(),
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
      },
    });

    const newResponse = result.text?.trim();

    if (!newResponse) {
      return res.status(502).json({
        success: false,
        message: "Gemini returned an empty response",
      });
    }

    // Update edited message
    message.prompt = prompt.trim();
    message.response = newResponse;

    // Remove later messages because this conversation has changed
    const messageIndex = conversation.messages.findIndex(
      (item) => item._id.toString() === messageId
    );

    conversation.messages.splice(messageIndex + 1);

    // Update conversation title if first message was edited
    if (messageIndex === 0) {
      conversation.title = prompt
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 90);
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Message updated successfully",
      updatedMessage: message,
      conversation,
    });
  } catch (error) {
    console.error("Edit message error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to edit message",
    });
  }
};

// Delete a conversation
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOneAndDelete({
      _id: conversationId,
      user: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Delete conversation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete conversation",
    });
  }
};