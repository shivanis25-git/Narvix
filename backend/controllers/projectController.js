import Project from "../models/Project.js";
import User from "../models/User.js";
import Note from "../models/Note.js";
import Notification from "../models/Notification.js";

// Create a new project
export const createProject = async (req, res) => {
  try {
    const { title, description, visibility } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project title is required",
      });
    }

    const project = await Project.create({
      title: title.trim(),
      description: description || "",
      visibility: visibility || "private",
      owner: req.user.id,
      members: [
        {
          user: req.user.id,
          role: "admin",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create project",
    });
  }
};

// Get all projects of logged-in user
export const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user.id },
        { "members.user": req.user.id },
      ],
    })
      .populate("owner", "name email")
      .populate("members.user", "name email")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch projects",
    });
  }
};

// Get a single project
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members.some(
      (member) => member.user.toString() === req.user.id
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }

    await project.populate([
      { path: "owner", select: "name email" },
      { path: "members.user", select: "name email" },
    ]);

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Get project error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch project",
    });
  }
};

// Add a team member by email
export const addProjectMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Member email is required",
      });
    }

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Only project owner can add members
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can add members",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email does not exist",
      });
    }

    const alreadyMember = project.members.some(
      (member) => member.user.toString() === user._id.toString()
    );

    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: "User is already a project member",
      });
    }

    project.members.push({
      user: user._id,
      role: "member",
    });

    await project.save();

    try {
      console.log("Creating notification for:", user.email, user._id.toString());
      const createdNotification = await Notification.create({
        recipient: user._id,
        type: "project_invitation",
        title: "Added to a project",
        message: `You were added to "${project.title}".`,
        project: project._id,
      });
      console.log("Notification created:", createdNotification._id.toString());
    } catch (notificationError) {
      console.error("Notification creation error:", notificationError.message);
    }

    await project.populate([
      { path: "owner", select: "name email" },
      { path: "members.user", select: "name email" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Team member added successfully",
      project,
    });
  } catch (error) {
    console.error("Add member error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to add team member",
    });
  }
};

// Update team member role
export const updateProjectMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { projectId, memberId } = req.params;

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be admin or member",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can update member roles",
      });
    }

    if (memberId === project.owner.toString()) {
      return res.status(400).json({
        success: false,
        message: "Project owner's role cannot be changed",
      });
    }

    const member = project.members.find(
      (item) => item.user.toString() === memberId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    member.role = role;

    await project.save();

    await project.populate([
      { path: "owner", select: "name email" },
      { path: "members.user", select: "name email" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update member role error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update member role",
    });
  }
};

// Remove team member
export const removeProjectMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can remove members",
      });
    }

    if (memberId === project.owner.toString()) {
      return res.status(400).json({
        success: false,
        message: "Project owner cannot be removed",
      });
    }

    const memberExists = project.members.some(
      (item) => item.user.toString() === memberId
    );

    if (!memberExists) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    project.members = project.members.filter(
      (item) => item.user.toString() !== memberId
    );

    await project.save();

    await project.populate([
      { path: "owner", select: "name email" },
      { path: "members.user", select: "name email" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Team member removed successfully",
      project,
    });
  } catch (error) {
    console.error("Remove member error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to remove team member",
    });
  }
};

// Update project status
export const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { projectId } = req.params;

    const allowedStatuses = [
      "planning",
      "in-progress",
      "completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project status",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Only project owner can change status
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can update status",
      });
    }

    project.status = status;
    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project status updated successfully",
      project: {
        id: project._id,
        title: project.title,
        status: project.status,
      },
    });
  } catch (error) {
    console.error("Update project status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update project status",
    });
  }
};

// Update project details
export const updateProject = async (req, res) => {
  try {
    const { title, description, visibility } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can update this project",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project title is required",
      });
    }

    if (visibility && !["private", "public"].includes(visibility)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project visibility",
      });
    }

    project.title = title.trim();
    project.description = description?.trim() || "";
    project.visibility = visibility || project.visibility;

    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update project",
    });
  }
};


// Delete project
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can delete this project",
      });
    }

    await Note.deleteMany({ project: project._id });
    await project.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete project",
    });
  }
};


// Get a public project without login
export const getPublicProject = async (req, res) => {
  try {
    const { publicId } = req.params;

    const project = await Project.findOne({
      publicId,
      visibility: "public",
    }).select("title description status createdAt updatedAt");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Public project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Get public project error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch public project.",
    });
  }
};