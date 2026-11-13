import Note from "../models/Note.js";
import Project from "../models/Project.js";
import mongoose from "mongoose";

// Check whether user belongs to the project
const checkProjectAccess = (project, userId) => {
  if (!project) return false;

  const isOwner = project.owner.toString() === userId;

  const isMember = project.members.some(
    (member) => member.user.toString() === userId
  );

  return isOwner || isMember;
};

// Create a new note
export const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    if (!title || !title.trim() || typeof content !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid title and content are required",
      });
    }

    const project = await Project.findById(projectId);

    if (!checkProjectAccess(project, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }

    const note = await Note.create({
      title: title.trim(),
      content,
      project: projectId,
      author: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Note created successfully",
      note,
    });
  } catch (error) {
    console.error("Create note error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create note",
    });
  }
};

// Get all notes of a project
export const getProjectNotes = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(projectId);

    if (!checkProjectAccess(project, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }

    const notes = await Note.find({ project: projectId })
      .populate("author", "name email")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error("Get notes error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch notes",
    });
  }
};

// Get one note
export const getNoteById = async (req, res) => {
  try {
    const { noteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await Note.findById(noteId)
      .populate("author", "name email");

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    const project = await Project.findById(note.project);

    if (!checkProjectAccess(project, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this note",
      });
    }

    return res.status(200).json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Get note error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch note",
    });
  }
};

// Update a note
export const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    const project = await Project.findById(note.project);

    if (!checkProjectAccess(project, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this note",
      });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Note title cannot be empty",
        });
      }

      note.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== "string") {
        return res.status(400).json({
          success: false,
          message: "Note content must be text",
        });
      }

      note.content = content;
    }

    await note.save();

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      note,
    });
  } catch (error) {
    console.error("Update note error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update note",
    });
  }
};

// Delete a note
export const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID",
      });
    }

    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    const project = await Project.findById(note.project);

    if (!checkProjectAccess(project, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this note",
      });
    }

    await note.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete note",
    });
  }
};