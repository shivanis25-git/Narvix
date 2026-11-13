import express from "express";

import {
  createProject,
  getMyProjects,
  getProjectById,
  getPublicProject, // 1. Yahan add kar diya
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  updateProjectStatus,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route - no login required
router.get("/public/:publicId", getPublicProject);

// All project routes require authentication
router.use(authMiddleware);

// Create project
router.post("/", createProject);

// Get all user's projects
router.get("/", getMyProjects);

// Get single project
router.get("/:projectId", getProjectById);

// Add team member
router.post("/:projectId/members", addProjectMember);

// Update team member role
router.patch(
  "/:projectId/members/:memberId/role",
  updateProjectMemberRole
);

// Remove team member
router.delete(
  "/:projectId/members/:memberId",
  removeProjectMember
);

// Update project status
router.patch("/:projectId/status", updateProjectStatus);

// Update project details
router.put("/:projectId", updateProject);
// Delete project
router.delete("/:projectId", deleteProject);

export default router;