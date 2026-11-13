import express from "express";

import {
  createNote,
  getProjectNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from "../controllers/noteController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Authentication required
router.use(authMiddleware);

// Create note
router.post("/projects/:projectId/notes", createNote);

// Get all project notes
router.get("/projects/:projectId/notes", getProjectNotes);

// Get single note
router.get("/notes/:noteId", getNoteById);

// Update note
router.put("/notes/:noteId", updateNote);

// Delete note
router.delete("/notes/:noteId", deleteNote);

export default router;