import mongoose from "mongoose";
import Project from "../models/Project.js";

const projectAccessMiddleware = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const userId = req.user.id;

    const isOwner = project.owner.toString() === userId;

    const isMember = project.members.some(
      (member) => member.user.toString() === userId
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }

    req.project = project;

    next();

  } catch (error) {
    console.error("Project access error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify project access",
    });
  }
};

export default projectAccessMiddleware;