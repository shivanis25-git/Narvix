import express from "express";

import {
  askGemini,
  explainCode,
  generateDocumentation,
  generateReadme,
  explainNote,
  improveNote,
} from "../controllers/aiController.js";

import {
  getConversations,
  getConversation,
  deleteConversation,
  editMessage,
} from "../controllers/conversationController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import {
  saveToolHistory,
  getToolHistory,
  deleteToolHistory,
} from "../controllers/aiHistoryController.js";

const router = express.Router();

router.use(authMiddleware);

// Gemini AI
router.post("/ask", askGemini);
router.post("/explain-code", explainCode);
router.post("/generate-documentation", generateDocumentation);
router.post("/generate-readme", generateReadme);
router.post("/explain-note/:noteId", explainNote);
router.post("/improve-note/:noteId", improveNote);

// Developer Tool History
router.post("/tool-history", saveToolHistory);
router.get("/tool-history", getToolHistory);
router.delete("/tool-history/:id", deleteToolHistory);

// Chat History
router.get("/conversations", getConversations);
router.get("/conversations/:conversationId", getConversation);

// Edit message and regenerate response
router.patch(
  "/conversations/:conversationId/messages/:messageId",
  editMessage
);

// Delete conversation
router.delete("/conversations/:conversationId", deleteConversation);

export default router;