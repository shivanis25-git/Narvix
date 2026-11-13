import Project from "../models/Project.js";
import ProjectFile from "../models/File.js";
import Note from "../models/Note.js";

export const getWorkspaceAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await Project.find({
      $or: [
        { owner: userId },
        { "members.user": userId },
      ],
    })
      .select("title status owner members createdAt updatedAt")
      .populate("owner", "name")
      .populate("members.user", "name")
      .lean();

    const projectIds = projects.map((project) => project._id);

    const memberMap = new Map();

    const addMember = (user) => {
      if (!user) return;

      const id = user._id.toString();

      if (!memberMap.has(id)) {
        memberMap.set(id, {
          userId: id,
          name: user.name || "Team Member",
          projectsCreated: 0,
          filesUploaded: 0,
          notesCreated: 0,
        });
      }
    };

    projects.forEach((project) => {
      addMember(project.owner);

      project.members.forEach((member) => {
        addMember(member.user);
      });

      if (project.owner) {
        const ownerId = project.owner._id.toString();
        memberMap.get(ownerId).projectsCreated += 1;
      }
    });

    let fileStats = {
      totalFiles: 0,
      documentFiles: 0,
      imageFiles: 0,
      codeFiles: 0,
      storageBytes: 0,
    };

    let recentFiles = [];
    let fileContributions = [];
    let noteContributions = [];

    if (projectIds.length > 0) {
      const [stats, files, fileCounts, noteCounts] = await Promise.all([
        ProjectFile.aggregate([
          { $match: { project: { $in: projectIds } } },
          {
            $group: {
              _id: null,
              totalFiles: { $sum: 1 },
              storageBytes: { $sum: "$size" },
              documentFiles: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $eq: ["$mimeType", "application/pdf"] },
                        {
                          $regexMatch: {
                            input: "$mimeType",
                            regex: "^text/",
                          },
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              imageFiles: {
                $sum: {
                  $cond: [
                    {
                      $regexMatch: {
                        input: "$mimeType",
                        regex: "^image/",
                      },
                    },
                    1,
                    0,
                  ],
                },
              },
              codeFiles: {
                $sum: {
                  $cond: [
                    {
                      $regexMatch: {
                        input: "$originalName",
                        regex: "\\.(js|jsx|ts|tsx|css|html|json)$",
                        options: "i",
                      },
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]),

        ProjectFile.find({ project: { $in: projectIds } })
          .populate("project", "title")
          .populate("uploadedBy", "name")
          .sort({ createdAt: -1 })
          .limit(8)
          .lean(),

        ProjectFile.aggregate([
          { $match: { project: { $in: projectIds } } },
          { $group: { _id: "$uploadedBy", count: { $sum: 1 } } },
        ]),

        Note.aggregate([
          { $match: { project: { $in: projectIds } } },
          { $group: { _id: "$author", count: { $sum: 1 } } },
        ]),
      ]);

      if (stats.length > 0) {
        fileStats = stats[0];
      }

      recentFiles = files;
      fileContributions = fileCounts;
      noteContributions = noteCounts;
    }

    fileContributions.forEach((item) => {
      const member = memberMap.get(item._id?.toString());
      if (member) member.filesUploaded = item.count;
    });

    noteContributions.forEach((item) => {
      const member = memberMap.get(item._id?.toString());
      if (member) member.notesCreated = item.count;
    });

    const completedProjects = projects.filter(
      (project) => project.status === "completed"
    ).length;

    const inProgressProjects = projects.filter(
      (project) => project.status === "in-progress"
    ).length;

    const planningProjects = projects.filter(
      (project) => project.status === "planning"
    ).length;

    const projectActivity = projects.map((project) => ({
      id: `project-${project._id}`,
      type: "project",
      title: project.title,
      action:
        new Date(project.updatedAt) > new Date(project.createdAt)
          ? "Project updated"
          : "Project created",
      date: project.updatedAt || project.createdAt,
    }));

    const fileActivity = recentFiles.map((file) => ({
      id: `file-${file._id}`,
      type: "file",
      title: file.originalName,
      action: "File uploaded",
      project: file.project?.title || "Project",
      actor: file.uploadedBy?.name || "Team member",
      date: file.createdAt,
    }));

    const recentActivity = [...projectActivity, ...fileActivity]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    const memberContributions = Array.from(memberMap.values()).sort(
      (a, b) =>
        b.projectsCreated + b.filesUploaded + b.notesCreated -
        (a.projectsCreated + a.filesUploaded + a.notesCreated)
    );

    return res.status(200).json({
      success: true,

      summary: {
        totalProjects: projects.length,
        completedProjects,
        inProgressProjects,
        planningProjects,
        totalTeamMembers: memberMap.size,
        ...fileStats,
      },

      projectStatus: {
        planning: planningProjects,
        inProgress: inProgressProjects,
        completed: completedProjects,
      },

      memberContributions,
      recentActivity,
    });
  } catch (error) {
    console.error("Analytics error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch workspace analytics",
    });
  }
};
