import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Dashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const normalizeNoteMarkdown = (content = '') =>
  String(content).replace(/\\([#*_+>-])/g, '$1');


const EMPTY_PROJECT_FORM = {
  title: '',
  description: '',
  visibility: 'private',
};

const NAV_ITEMS = [
  { name: 'Overview', icon: '◫' },
  { name: 'My Projects', icon: '▣' },
  { name: 'Team Members', icon: '♧' },
  { name: 'Notes & Docs', icon: '▤' },
  { name: 'AI Assistant', icon: '✧', badge: 'NEW' },
  { name: 'File Manager', icon: '▱' },
  { name: 'Analytics', icon: '▥' },
];

const STATUS_FILTERS = [
  { label: 'All Projects', value: 'all' },
  { label: 'Planning', value: 'planning' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
];

function Dashboard({ name = '', email = '', token = '', onLogout }) {
  const [activePage, setActivePage] = useState('Overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.ok && !cancelled) {
          setNotifications(data.notifications || []);
          setUnreadNotificationCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Notifications fetch error:", error);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  const markOneNotificationRead = async (id) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setNotifications((items) =>
          items.map((item) => item._id === id ? { ...item, isRead: true } : item)
        );
        setUnreadNotificationCount((count) => Math.max(0, count - 1));
      }
    } catch (error) {
      console.error("Mark notification read error:", error);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
        setUnreadNotificationCount(0);
      }
    } catch (error) {
      console.error("Mark all notifications read error:", error);
    }
  };


  // ==========================================
  // Project states
  // ==========================================
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [projectSuccess, setProjectSuccess] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT_FORM);

  // Delete states
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Filter & sort states
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');
  const [projectSort, setProjectSort] = useState('newest');

  // Workspace members (for Overview contributors)
  const [workspaceMembers] = useState([]);

  // ==========================================
  // Team members states
  // ==========================================
  const [selectedTeamProjectId, setSelectedTeamProjectId] = useState('');
  const [teamMemberEmail, setTeamMemberEmail] = useState('');
  const [addingTeamMember, setAddingTeamMember] = useState(false);
  const [teamMemberSuccess, setTeamMemberSuccess] = useState('');
  const [teamMemberError, setTeamMemberError] = useState('');
  const [updatingMemberId, setUpdatingMemberId] = useState(null);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // ==========================================
  // File Manager states
  // ==========================================
  const [selectedFileProjectId, setSelectedFileProjectId] = useState('');
  const [projectFiles, setProjectFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState('');
  const [filesSuccess, setFilesSuccess] = useState('');

  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');

  const [fileToDelete, setFileToDelete] = useState(null);
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  // ==========================================
  // Notes & Docs states
  // ==========================================
  const [selectedNotesProjectId, setSelectedNotesProjectId] = useState('');
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [notesSuccess, setNotesSuccess] = useState('');

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [noteAIResult, setNoteAIResult] = useState(null);
  const [noteAILoading, setNoteAILoading] = useState(null);
  const [selectedNoteAIView, setSelectedNoteAIView] = useState(null);
  const [expandedNoteId, setExpandedNoteId] = useState(null);


  // ==========================================
  // AI Assistant states
  // ==========================================
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Code Explainer states
  const [codeInput, setCodeInput] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('JavaScript');
  const [codeExplanation, setCodeExplanation] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  // Documentation Generator states
  const [docCodeInput, setDocCodeInput] = useState('');
  const [docLanguage, setDocLanguage] = useState('JavaScript');
  const [generatedDocumentation, setGeneratedDocumentation] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState('');

  // README Generator states
  const [readmeProjectName, setReadmeProjectName] = useState('');
  const [readmeDescription, setReadmeDescription] = useState('');
  const [readmeTechStack, setReadmeTechStack] = useState('');
  const [readmeFeatures, setReadmeFeatures] = useState('');
  const [readmeInstallation, setReadmeInstallation] = useState('');
  const [generatedReadme, setGeneratedReadme] = useState('');
  const [readmeCopied, setReadmeCopied] = useState(false);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeError, setReadmeError] = useState('');

  const [activeDeveloperTool, setActiveDeveloperTool] = useState('explainer');

  // AI Chat History states
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Developer Tool History states
  const [toolHistory, setToolHistory] = useState([]);
  const [toolHistoryLoading, setToolHistoryLoading] = useState(false);
  const [toolHistoryError, setToolHistoryError] = useState('');
  const [deletingToolHistoryId, setDeletingToolHistoryId] = useState(null);

  // Message editing states
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedPrompt, setEditedPrompt] = useState('');

  // Chat deletion state
  const [deletingConversationId, setDeletingConversationId] = useState(null);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  // ==========================================
  // Analytics states
  // ==========================================
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  const displayName = name.trim() || email.split('@')[0] || 'Developer';

  // ==========================================
  // Fetch AI Chat History
  // ==========================================
  useEffect(() => {
    if (activePage !== 'AI Assistant' || !token) return;

    const controller = new AbortController();

    const fetchChatHistory = async () => {
      setHistoryLoading(true);
      setAiError('');

      try {
        const response = await fetch(`${API_BASE_URL}/api/ai/conversations`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load chat history');
        }

        setConversations(data.conversations || []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setAiError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false);
        }
      }
    };

    fetchChatHistory();

    return () => controller.abort();
  }, [activePage, token]);

  // ==========================================
  // Fetch Developer Tool History
  // ==========================================
  useEffect(() => {
    if (
      activePage !== 'AI Assistant' ||
      !token ||
      activeDeveloperTool === 'general'
    ) {
      setToolHistory([]);
      return;
    }

    const controller = new AbortController();

    const fetchToolHistory = async () => {
      setToolHistoryLoading(true);
      setToolHistoryError('');

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/ai/tool-history?toolType=${activeDeveloperTool === 'explainer' ? 'code-explainer' : activeDeveloperTool}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to load tool history.');
        }

        setToolHistory(data.history || []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setToolHistoryError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setToolHistoryLoading(false);
        }
      }
    };

    fetchToolHistory();

    return () => controller.abort();
  }, [activePage, activeDeveloperTool, token]);

  // ==========================================
  // Fetch Analytics Data
  // ==========================================
  useEffect(() => {
    if (activePage !== 'Analytics' || !token) return;

    const controller = new AbortController();

    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      setAnalyticsError('');

      try {
        const response = await fetch(`${API_BASE_URL}/api/analytics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load analytics');
        }

        setAnalyticsData(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setAnalyticsError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setAnalyticsLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => controller.abort();
  }, [activePage, token]);

  // ==========================================
  // Auto-hide messages
  // ==========================================
  useEffect(() => {
    if (!projectSuccess) return undefined;
    const timer = setTimeout(() => setProjectSuccess(''), 3000);
    return () => clearTimeout(timer);
  }, [projectSuccess]);

  useEffect(() => {
    if (!projectsError) return undefined;
    const timer = setTimeout(() => setProjectsError(''), 5000);
    return () => clearTimeout(timer);
  }, [projectsError]);

  // Team member success toast: auto-hide after 3 seconds
  useEffect(() => {
    if (!teamMemberSuccess) return undefined;
    const timer = setTimeout(() => setTeamMemberSuccess(''), 3000);
    return () => clearTimeout(timer);
  }, [teamMemberSuccess]);

  useEffect(() => {
    if (!teamMemberError) return undefined;
    const timer = setTimeout(() => setTeamMemberError(''), 5000);
    return () => clearTimeout(timer);
  }, [teamMemberError]);

  // File manager messages auto-hide
  useEffect(() => {
    if (!filesSuccess) return undefined;
    const timer = setTimeout(() => setFilesSuccess(''), 3000);
    return () => clearTimeout(timer);
  }, [filesSuccess]);

  useEffect(() => {
    if (!filesError) return undefined;
    const timer = setTimeout(() => setFilesError(''), 5000);
    return () => clearTimeout(timer);
  }, [filesError]);

  // Close remove-member popup with the Escape key
  useEffect(() => {
    if (!memberToRemove) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMemberToRemove(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [memberToRemove]);

  // ==========================================
  // Load projects
  // ==========================================
  const loadProjects = useCallback(async () => {
    if (!token) {
      setProjectsError('Please sign in to view your projects.');
      return;
    }

    setProjectsLoading(true);
    setProjectsError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to load projects');

      setProjects(data.projects || []);
    } catch (error) {
      setProjectsError(error.message);
    } finally {
      setProjectsLoading(false);
    }
  }, [token]);

  // ==========================================
  // FILE MANAGER - LOAD PROJECT FILES
  // ==========================================
  const loadProjectFiles = useCallback(
    async (projectId) => {
      if (!projectId || !token) {
        setProjectFiles([]);
        return;
      }

      setFilesLoading(true);
      setFilesError('');

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/projects/${projectId}/files`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load files');
        }

        setProjectFiles(data.files || []);
      } catch (error) {
        setFilesError(error.message);
      } finally {
        setFilesLoading(false);
      }
    },
    [token]
  );

  // Automatically load files when project changes
  useEffect(() => {
    if (activePage !== 'File Manager') return;

    if (!selectedFileProjectId) {
      setProjectFiles([]);
      return;
    }

    loadProjectFiles(selectedFileProjectId);
  }, [activePage, selectedFileProjectId, loadProjectFiles]);

  // ==========================================
  // FILE MANAGER - PREVIEW FILE
  // ==========================================
  const handlePreviewFile = async (file) => {
    setFilesError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedFileProjectId}/files/${file._id}/preview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Unable to preview file');
      }

      const blob = await response.blob();
      const previewUrl = URL.createObjectURL(blob);

      if (previewFile?.url) {
        URL.revokeObjectURL(previewFile.url);
      }

      setPreviewFile({
        ...file,
        url: previewUrl,
      });
    } catch (error) {
      setFilesError(error.message);
    }
  };

  // ==========================================
  // FILE MANAGER - DOWNLOAD FILE
  // ==========================================
  const handleDownloadFile = async (file) => {
    setFilesError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedFileProjectId}/files/${file._id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Unable to download file');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

      setFilesSuccess('File downloaded successfully!');
    } catch (error) {
      setFilesError(error.message);
    }
  };

  // ==========================================
  // FILE MANAGER - DELETE FILE
  // ==========================================
  const handleDeleteFile = async (fileId) => {
    setDeletingFileId(fileId);
    setFilesError('');
    setFilesSuccess('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedFileProjectId}/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete file');
      }

      setFileToDelete(null);
      setFilesSuccess('File deleted successfully!');

      await loadProjectFiles(selectedFileProjectId);
    } catch (error) {
      setFilesError(error.message);
    } finally {
      setDeletingFileId(null);
    }
  };

  // ==========================================
  // FILE MANAGER - UPLOAD FILE
  // ==========================================
  const handleUploadFile = async (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFileProjectId) {
      setFilesError('Please select a project first.');
      e.target.value = '';
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setFilesError('File size cannot exceed 10 MB.');
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploadingFile(true);
    setFilesError('');
    setFilesSuccess('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedFileProjectId}/files`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'File upload failed');
      }

      setFilesSuccess('File uploaded successfully!');

      await loadProjectFiles(selectedFileProjectId);
    } catch (error) {
      setFilesError(error.message);
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  // ==========================================
  // Load notes for selected project
  // ==========================================
  const loadProjectNotes = useCallback(
    async (projectId) => {
      if (!projectId || !token) {
        setNotes([]);
        return;
      }

      setNotesLoading(true);
      setNotesError('');

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/projects/${projectId}/notes`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load notes');
        }

        setNotes(data.notes || []);
      } catch (error) {
        setNotesError(error.message);
      } finally {
        setNotesLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedNotesProjectId) {
      loadProjectNotes(selectedNotesProjectId);
    } else {
      setNotes([]);
    }
  }, [selectedNotesProjectId, loadProjectNotes]);

  // ==========================================
  // Notes handlers
  // ==========================================

  // Create or update note
  const handleSaveNote = async (e) => {
    e.preventDefault();

    setNotesError('');
    setNotesSuccess('');

    if (!selectedNotesProjectId) {
      setNotesError('Please select a project.');
      return;
    }

    if (!noteTitle.trim()) {
      setNotesError('Note title is required.');
      return;
    }

    setSavingNote(true);

    try {
      const isEditing = Boolean(editingNoteId);

      const url = isEditing
        ? `${API_BASE_URL}/api/notes/${editingNoteId}`
        : `${API_BASE_URL}/api/projects/${selectedNotesProjectId}/notes`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: noteTitle.trim(),
          content: noteContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save note');
      }

      setNotesSuccess(data.message);
      setNoteTitle('');
      setNoteContent('');
      setEditingNoteId(null);
      setShowNoteForm(false);

      await loadProjectNotes(selectedNotesProjectId);
    } catch (error) {
      setNotesError(error.message);
    } finally {
      setSavingNote(false);
    }
  };

  // Edit note
  const handleEditNote = (note) => {
    setEditingNoteId(note._id);
    setShowNoteForm(true);
    setNoteTitle(note.title || '');
    setNoteContent(note.content || '');
    setNotesError('');
    setNotesSuccess('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete note
  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    setDeletingNoteId(noteToDelete);
    setNotesError('');
    setNotesSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/${noteToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete note');
      }

      setNoteToDelete(null);
      setNotesSuccess(data.message);

      await loadProjectNotes(selectedNotesProjectId);
    } catch (error) {
      setNotesError(error.message);
    } finally {
      setDeletingNoteId(null);
    }
  };

  // Explain or improve a note using Gemini
  const handleNoteAI = async (note, action) => {
    setNotesError('');
    setNotesSuccess('');
    setNoteAILoading({ noteId: note._id, action });
    setNoteAIResult(null);
    setSelectedNoteAIView({ note, action });

    try {
      const endpoint = action === 'explain' ? 'explain-note' : 'improve-note';

      const response = await fetch(
        `${API_BASE_URL}/api/ai/${endpoint}/${note._id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gemini could not process this note');
      }

      setNoteAIResult({
        noteId: note._id,
        action,
        content: action === 'explain' ? data.explanation : data.improvedContent,
      });
    } catch (error) {
      setNotesError(error.message);
    } finally {
      setNoteAILoading(null);
    }
  };

  // Load improved content into the existing note editor
  const handleUseImprovedNote = (note) => {
    if (!noteAIResult || noteAIResult.noteId !== note._id) return;

    setEditingNoteId(note._id);
    setNoteTitle(note.title || '');
    setNoteContent(noteAIResult.content || '');
    setShowNoteForm(true);
    setSelectedNoteAIView(null);
    setNoteAIResult(null);
    setNotesError('');
    setNotesSuccess('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start a fresh Developer Tool session without deleting history
  const handleNewToolSession = () => {
    if (activeDeveloperTool === 'explainer') {
      setCodeInput('');
      setCodeExplanation('');
      setCodeError('');
    } else if (activeDeveloperTool === 'documentation') {
      setDocCodeInput('');
      setGeneratedDocumentation('');
      setDocError('');
    } else if (activeDeveloperTool === 'readme') {
      setReadmeProjectName('');
      setReadmeDescription('');
      setReadmeTechStack('');
      setReadmeFeatures('');
      setReadmeInstallation('');
      setGeneratedReadme('');
      setReadmeError('');
    }

    setToolHistoryError('');
  };

  // Open a saved Developer Tool result
  const handleOpenToolHistory = (item) => {
    if (item.toolType === 'code-explainer') {
      setCodeInput(item.inputCode || '');
      setCodeLanguage(item.language || 'JavaScript');
      setCodeExplanation(item.output || '');
      setActiveDeveloperTool('explainer');
    } else if (item.toolType === 'documentation') {
      setDocCodeInput(item.inputCode || '');
      setDocLanguage(item.language || 'JavaScript');
      setGeneratedDocumentation(item.output || '');
      setActiveDeveloperTool('documentation');
    } else if (item.toolType === 'readme') {
      try {
        const details = JSON.parse(item.inputCode || '{}');
        setReadmeProjectName(details.projectName || '');
        setReadmeDescription(details.description || '');
        setReadmeTechStack(details.techStack || '');
        setReadmeFeatures(details.features || '');
        setReadmeInstallation(details.installation || '');
        setGeneratedReadme(item.output || '');
        setReadmeError('');
        setActiveDeveloperTool('readme');
      } catch {
        setToolHistoryError('Unable to restore this README history.');
      }
    }
  };

  // Delete a saved Developer Tool result
  const handleDeleteToolHistory = async (id) => {
    setDeletingToolHistoryId(id);
    setToolHistoryError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/tool-history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to delete history.');
      }

      setToolHistory((previous) => previous.filter((item) => item._id !== id));
    } catch (error) {
      setToolHistoryError(error.message);
    } finally {
      setDeletingToolHistoryId(null);
    }
  };

  // Save Developer Tool History
  const saveDeveloperToolHistory = async (toolType, code, language, output) => {
    try {
      const firstLine = code.trim().split('\n')[0].slice(0, 55);
      let title = `${language} - ${firstLine || toolType}`;

      if (toolType === 'readme') {
        try {
          const details = JSON.parse(code);
          title = `README - ${details.projectName || 'Untitled Project'}`;
        } catch {
          title = 'README - Project Documentation';
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/tool-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toolType,
          title,
          inputCode: code,
          language,
          output,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to save history.');
      }

      if (activeDeveloperTool === (toolType === 'code-explainer' ? 'explainer' : toolType)) {
        setToolHistory((previous) => [data.history, ...previous]);
      }
    } catch (error) {
      setToolHistoryError(`Result generated, but history could not be saved: ${error.message}`);
    }
  };

  // ==========================================
  // Gemini Code Explainer
  // ==========================================
  const handleExplainCode = async (e) => {
    e.preventDefault();

    if (!codeInput.trim()) {
      setCodeError('Please paste your code first.');
      return;
    }

    setCodeLoading(true);
    setCodeError('');
    setCodeExplanation('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ai/explain-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: codeInput,
            language: codeLanguage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to explain code.');
      }

      setCodeExplanation(data.explanation);
      await saveDeveloperToolHistory(
        'code-explainer',
        codeInput,
        codeLanguage,
        data.explanation
      );
    } catch (error) {
      setCodeError(error.message);
    } finally {
      setCodeLoading(false);
    }
  };

  // Generate technical documentation
  const handleGenerateDocumentation = async (e) => {
    e.preventDefault();

    if (!docCodeInput.trim()) {
      setDocError('Please paste your code first.');
      return;
    }

    setDocLoading(true);
    setDocError('');
    setGeneratedDocumentation('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ai/generate-documentation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: docCodeInput,
            language: docLanguage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to generate documentation.');
      }

      setGeneratedDocumentation(data.documentation);
      await saveDeveloperToolHistory(
        'documentation',
        docCodeInput,
        docLanguage,
        data.documentation
      );
    } catch (error) {
      setDocError(error.message);
    } finally {
      setDocLoading(false);
    }
  };

  // Generate project README
  const handleGenerateReadme = async (e) => {
    e.preventDefault();

    if (!readmeProjectName.trim() || !readmeDescription.trim() || !readmeTechStack.trim()) {
      setReadmeError('Project name, description and tech stack are required.');
      return;
    }

    setReadmeLoading(true);
    setReadmeError('');
    setGeneratedReadme('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-readme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectName: readmeProjectName,
          description: readmeDescription,
          techStack: readmeTechStack,
          features: readmeFeatures,
          installation: readmeInstallation,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to generate README.');
      }

      setGeneratedReadme(data.readme);

      await saveDeveloperToolHistory(
        'readme',
        JSON.stringify({
          projectName: readmeProjectName,
          description: readmeDescription,
          techStack: readmeTechStack,
          features: readmeFeatures,
          installation: readmeInstallation,
        }),
        'Markdown',
        data.readme
      );
    } catch (error) {
      setReadmeError(error.message);
    } finally {
      setReadmeLoading(false);
    }
  };

  // ==========================================
  // Ask Gemini AI with live chat display
  // ==========================================
  const handleAskGemini = async (e) => {
    e.preventDefault();

    const prompt = aiPrompt.trim();

    if (!prompt) {
      setAiError('Please enter a prompt.');
      return;
    }

    const temporaryMessageId = `temp-${Date.now()}`;
    let activeMessageId = temporaryMessageId;
    let streamedAnswer = '';

    setAiLoading(true);
    setAiError('');
    setAiAnswer('');

    // Immediately show the user's question in chat
    setChatMessages((previous) => [
      ...previous,
      {
        _id: temporaryMessageId,
        prompt,
        response: '',
      },
    ]);

    // Clear the input box
    setAiPrompt('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Unable to get AI response');
      }

      const data = await response.json().catch(() => ({}));

      if (!data.answer || typeof data.answer !== 'string' || !data.answer.trim()) {
        throw new Error(data.message || 'Gemini returned an empty response.');
      }

      streamedAnswer = data.answer.trim();

      // Store permanent MongoDB conversation and message IDs
      if (!data.conversationId || !data.savedMessage?._id) {
        throw new Error('Chat was not saved correctly. Please try again.');
      }

      setCurrentConversationId(data.conversationId);
      activeMessageId = data.savedMessage._id;

      setChatMessages((previous) =>
        previous.map((message) =>
          message._id === temporaryMessageId
            ? {
                ...data.savedMessage,
                response: streamedAnswer,
              }
            : message
        )
      );

      setAiAnswer('');

      // Refresh chat history
      const historyResponse = await fetch(`${API_BASE_URL}/api/ai/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setConversations(historyData.conversations || []);
      }
    } catch (error) {
      setAiError(error.message);

      if (streamedAnswer) {
        setChatMessages((previous) =>
          previous.map((message) =>
            message._id === activeMessageId
              ? { ...message, response: streamedAnswer }
              : message
          )
        );
      } else {
        setChatMessages((previous) =>
          previous.filter(
            (message) =>
              message._id !== temporaryMessageId &&
              message._id !== activeMessageId
          )
        );
      }

      setAiAnswer('');
    } finally {
      setAiLoading(false);
    }
  };

  // ==========================================
  // AI CHAT HISTORY HANDLERS
  // ==========================================

  // Start a new chat
  const handleNewChat = () => {
    setCurrentConversationId(null);
    setChatMessages([]);
    setAiPrompt('');
    setAiAnswer('');
    setAiError('');
    setEditingMessageId(null);
    setEditedPrompt('');
  };

  // Open an existing conversation
  const handleOpenConversation = async (conversationId) => {
    setHistoryLoading(true);
    setAiError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ai/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to open conversation');
      }

      setCurrentConversationId(data.conversation._id);
      setChatMessages(data.conversation.messages || []);
      setAiPrompt('');
      setAiAnswer('');
      setEditingMessageId(null);
      setEditedPrompt('');
    } catch (error) {
      setAiError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (conversationId) => {
    setDeletingConversationId(conversationId);
    setAiError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ai/conversations/${conversationId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete conversation');
      }

      setConversations((previous) =>
        previous.filter((chat) => chat._id !== conversationId)
      );

      if (currentConversationId === conversationId) {
        handleNewChat();
      }

      setConversationToDelete(null);
    } catch (error) {
      setAiError(error.message);
    } finally {
      setDeletingConversationId(null);
    }
  };

  // Save edited message and regenerate Gemini response
  const handleSaveEditedMessage = async (messageId) => {
    const prompt = editedPrompt.trim();

    if (!prompt) {
      setAiError('Message cannot be empty.');
      return;
    }

    setAiLoading(true);
    setAiError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ai/conversations/${currentConversationId}/messages/${messageId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prompt }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update message');
      }

      setChatMessages(data.conversation.messages || []);
      setConversations((previous) =>
        previous.map((chat) =>
          chat._id === currentConversationId ? data.conversation : chat
        )
      );

      setEditingMessageId(null);
      setEditedPrompt('');
      setAiAnswer('');
    } catch (error) {
      setAiError(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  // ==========================================
  // Project handlers
  // ==========================================
  const handleProjectInput = (e) => {
    const { name: fieldName, value } = e.target;
    setProjectForm((previous) => ({ ...previous, [fieldName]: value }));
  };

  const resetProjectForm = () => {
    setShowProjectForm(false);
    setEditingProjectId(null);
    setProjectForm(EMPTY_PROJECT_FORM);
  };

  const handleToggleProjectForm = () => {
    setShowProjectForm((previous) => !previous);
    setEditingProjectId(null);
    setProjectForm(EMPTY_PROJECT_FORM);
    setProjectsError('');
    setProjectSuccess('');
  };

  const handleEditProject = (project) => {
    setEditingProjectId(project._id);
    setProjectForm({
      title: project.title || '',
      description: project.description || '',
      visibility: project.visibility || 'private',
    });
    setShowProjectForm(true);
    setProjectsError('');
    setProjectSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setProjectsError('');
    setProjectSuccess('');

    if (!projectForm.title.trim()) {
      setProjectsError('Project title is required.');
      return;
    }

    setCreatingProject(true);

    try {
      const isEditing = Boolean(editingProjectId);
      const url = isEditing
        ? `${API_BASE_URL}/api/projects/${editingProjectId}`
        : `${API_BASE_URL}/api/projects`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: projectForm.title.trim(),
          description: projectForm.description.trim(),
          visibility: projectForm.visibility,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to save project');

      setProjectSuccess(
        isEditing ? 'Project updated successfully!' : 'Project created successfully!'
      );
      resetProjectForm();
      await loadProjects();
    } catch (error) {
      setProjectsError(error.message);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = (project) => {
    setProjectToDelete(project);
    setProjectsError('');
    setProjectSuccess('');
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    const project = projectToDelete;
    setDeletingProjectId(project._id);
    setProjectsError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${project._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to delete project');

      setProjectToDelete(null);
      await loadProjects();
      setProjectSuccess('Project deleted successfully!');
    } catch (error) {
      setProjectsError(error.message);
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleUpdateProjectStatus = async (projectId, status) => {
    setProjectsError('');
    setProjectSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to update project status');

      setProjectSuccess('Project status updated successfully!');
      await loadProjects();
    } catch (error) {
      setProjectsError(error.message);
      await loadProjects();
    }
  };



  const handleShareProject = async (project) => {
    setProjectsError('');
    setProjectSuccess('');

    try {
      const newVisibility =
        project.visibility === 'public' ? 'private' : 'public';

      const response = await fetch(
        `${API_BASE_URL}/api/projects/${project._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: project.title,
            description: project.description || '',
            visibility: newVisibility,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update sharing.');
      }

      await loadProjects();

      if (newVisibility === 'public') {
        const shareLink = `${window.location.origin}/?public=${data.project.publicId}`;
        await navigator.clipboard.writeText(shareLink);
        setProjectSuccess('Public link copied successfully!');
      } else {
        setProjectSuccess('Project sharing disabled successfully!');
      }
    } catch (error) {
      setProjectsError(error.message);
    }
  };

  // ==========================================
  // Team member handlers
  // ==========================================
  const replaceProjectInState = (updatedProject) => {
    if (!updatedProject) return;
    setProjects((previous) =>
      previous.map((project) =>
        project._id === updatedProject._id ? updatedProject : project
      )
    );
  };

  const handleAddTeamMember = async (e) => {
    e.preventDefault();

    setTeamMemberSuccess('');
    setTeamMemberError('');

    if (!selectedTeamProjectId) {
      setTeamMemberError('Please select a project.');
      return;
    }

    if (!teamMemberEmail.trim()) {
      setTeamMemberError('Please enter a member email.');
      return;
    }

    setAddingTeamMember(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedTeamProjectId}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: teamMemberEmail.trim().toLowerCase(),
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to add team member');

      replaceProjectInState(data.project);
      setTeamMemberEmail('');
      setTeamMemberSuccess(data.message || 'Team member added successfully!');
    } catch (error) {
      setTeamMemberError(error.message);
    } finally {
      setAddingTeamMember(false);
    }
  };

  const handleUpdateTeamMemberRole = async (memberId, role) => {
    setTeamMemberSuccess('');
    setTeamMemberError('');
    setUpdatingMemberId(memberId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedTeamProjectId}/members/${memberId}/role`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role }),
        }
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to update member role');

      replaceProjectInState(data.project);
      setTeamMemberSuccess('Member role updated successfully!');
    } catch (error) {
      setTeamMemberError(error.message);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  // Confirmation happens in the custom popup (memberToRemove)
  const handleRemoveTeamMember = async (memberId) => {
    setTeamMemberSuccess('');
    setTeamMemberError('');
    setRemovingMemberId(memberId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedTeamProjectId}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Unable to remove team member');

      replaceProjectInState(data.project);
      setTeamMemberSuccess('Team member removed successfully!');
    } catch (error) {
      setTeamMemberError(error.message);
    } finally {
      setRemovingMemberId(null);
      setMemberToRemove(null);
    }
  };

  // ==========================================
  // Navigation
  // ==========================================
  const selectPage = (page) => {
    setActivePage(page);
    setProjectsError('');
    setProjectSuccess('');
    if (page === 'My Projects') loadProjects();
  };

  // Open a project for its owner or an added member
  const handleOpenProject = (project) => {
    setSelectedNotesProjectId(project._id);
    setSelectedFileProjectId(project._id);
    setSelectedTeamProjectId(project._id);
    setEditingNoteId(null);
    setShowNoteForm(false);
    setNoteTitle('');
    setNoteContent('');
    setNotesError('');
    setNotesSuccess('');
    setActivePage('Notes & Docs');
  };

  // ==========================================
  // Derived data
  // ==========================================
  const filteredProjects = projects
    .filter((project) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        project.title?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query);
      const status = project.status || 'planning';
      const matchesStatus = projectStatusFilter === 'all' || status === projectStatusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return projectSort === 'oldest' ? dateA - dateB : dateB - dateA;
    });

  const projectCounts = {
    total: projects.length,
    planning: projects.filter((p) => (p.status || 'planning') === 'planning').length,
    inProgress: projects.filter((p) => p.status === 'in-progress').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  };

  const stats = [
    { title: 'TOTAL PROJECTS', value: String(projectCounts.total), icon: '▣', note: 'All your projects' },
    { title: 'PLANNING', value: String(projectCounts.planning), icon: '◷', note: 'Projects being planned' },
    { title: 'IN PROGRESS', value: String(projectCounts.inProgress), icon: '↗', note: 'Currently active projects' },
    { title: 'COMPLETED', value: String(projectCounts.completed), icon: '✓', note: 'Successfully completed projects' },
  ];

  const selectedTeamProject = projects.find(
    (project) => project._id === selectedTeamProjectId
  );

  const selectedNotesProject = projects.find(
    (project) => project._id === selectedNotesProjectId
  );

  // ==========================================
  // File Manager derived data
  // ==========================================
  const CODE_FILE_REGEX = /\.(js|jsx|ts|tsx|css|html|json)$/i;

  const isImageFile = (file) => Boolean(file.mimeType?.startsWith('image/'));
  const isDocumentFile = (file) =>
    file.mimeType === 'application/pdf' || Boolean(file.mimeType?.startsWith('text/'));
  const isCodeFile = (file) => CODE_FILE_REGEX.test(String(file.originalName || ''));

  const filteredFiles = projectFiles.filter((file) => {
    const filename = String(file.originalName || '');

    const matchesSearch = filename.toLowerCase().includes(fileSearch.toLowerCase());

    const matchesType =
      fileTypeFilter === 'all' ||
      (fileTypeFilter === 'images' && isImageFile(file)) ||
      (fileTypeFilter === 'code' && isCodeFile(file)) ||
      (fileTypeFilter === 'documents' && isDocumentFile(file));

    return matchesSearch && matchesType;
  });

  // Global workspace search results
  const searchQuery = search.trim().toLowerCase();

  const searchResults = searchQuery
    ? [
        ...projects
          .filter((p) =>
            `${p.title || ''} ${p.description || ''}`
              .toLowerCase()
              .includes(searchQuery)
          )
          .map((p) => ({
            type: 'Project',
            title: p.title,
            subtitle: p.description || 'Workspace project',
            item: p,
          })),

        ...notes
          .filter((n) =>
            `${n.title || ''} ${n.content || ''}`
              .toLowerCase()
              .includes(searchQuery)
          )
          .map((n) => ({
            type: 'Note',
            title: n.title || 'Untitled note',
            subtitle: 'Notes & Docs',
            item: n,
          })),

        ...projectFiles
          .filter((f) =>
            (f.originalName || '').toLowerCase().includes(searchQuery)
          )
          .map((f) => ({
            type: 'File',
            title: f.originalName,
            subtitle: 'File Manager',
            item: f,
          })),

        ...conversations
          .filter((c) =>
            (c.title || '').toLowerCase().includes(searchQuery)
          )
          .map((c) => ({
            type: 'AI Chat',
            title: c.title,
            subtitle: 'AI Assistant',
            item: c,
          })),
      ].slice(0, 8)
    : [];

  const getFileIcon = (file) => {
    if (file.mimeType === 'application/pdf') return '📕';
    if (isImageFile(file)) return '🖼️';
    if (/\.(js|jsx|ts|tsx)$/i.test(String(file.originalName || ''))) return '💻';
    return '📄';
  };

  // ==========================================
  // Analytics derived data
  // ==========================================
  const analyticsTotalProjects = analyticsData?.summary?.totalProjects || 0;

  const getStatusPercent = (value) =>
    analyticsTotalProjects ? ((value || 0) / analyticsTotalProjects) * 100 : 0;

  const formatStorage = (bytes) => {
    const value = Number(bytes || 0);
    if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MB`;
    return `${(value / 1024).toFixed(1)} KB`;
  };

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="dashboard-shell">
      {/* SIDEBAR */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="dashboard-brand">
          <div className="dashboard-brand-mark">N</div>
          <div className="dashboard-brand-copy">
            <strong>
              NARVIX<span>.</span>
            </strong>
            <small>DEVELOPER WORKSPACE</small>
          </div>
        </div>

        <p className="sidebar-section-label">WORKSPACE</p>
        <nav className="dashboard-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`dashboard-nav-item ${activePage === item.name ? 'active' : ''}`}
              onClick={() => {
  selectPage(item.name);
  setIsSidebarOpen(false);
}}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.name}</span>
              {item.badge && <span className="nav-new-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-ai-card">
            <div className="sidebar-ai-icon">✧</div>
            <strong>Meet your AI copilot</strong>
            <p>Get help with ideas, code and documentation.</p>
            <button type="button" onClick={() => selectPage('AI Assistant')}>
              Explore AI <span>→</span>
            </button>
          </div>

          <div className="sidebar-profile">
            <div className="profile-avatar">{displayName.charAt(0).toUpperCase()}</div>
            <div className="profile-copy">
              <strong>{displayName}</strong>
              <span>{email || 'Developer account'}</span>
            </div>
            <button
              type="button"
              className="profile-menu-button"
              onClick={onLogout}
              title="Sign out"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="dashboard-main">
        <header className="dashboard-topbar">

          <button
  type="button"
  className="mobile-menu-button"
  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
  aria-label="Toggle navigation menu"
>
  ☰
</button>
          <div className="topbar-breadcrumb">
            Workspace <span className="breadcrumb-separator">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <label className="dashboard-search">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search workspace..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>/</kbd>
            </label>

            {search.trim() && (
              <div className="dashboard-search-results">
                <div className="search-results-heading">SEARCH RESULTS</div>

                {searchResults.length > 0 ? (
                  searchResults.map((result, index) => (
                    <button
                      type="button"
                      className="search-result-item"
                      key={`${result.type}-${result.item._id || index}`}
                      onClick={() => {
                        if (result.type === 'Project') {
                          handleOpenProject(result.item);
                        } else if (result.type === 'Note') {
                          setActivePage('Notes & Docs');
                        } else if (result.type === 'File') {
                          setActivePage('File Manager');
                        } else {
                          setActivePage('AI Assistant');
                        }
                        setSearch('');
                      }}
                    >
                      <span className="search-result-type">{result.type}</span>
                      <span className="search-result-text">
                        <strong>{result.title}</strong>
                        <small>{result.subtitle}</small>
                      </span>
                      <span className="search-result-arrow">→</span>
                    </button>
                  ))
                ) : (
                  <div className="search-no-results">
                    No matching results found.
                  </div>
                )}
              </div>
            )}

            <div className="notification-wrapper">
              <button
                type="button"
                className="topbar-icon-button"
                title="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                ♧
                {unreadNotificationCount > 0 && (
                  <span className="notification-count">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-panel">
                  <div className="notification-header">
                    <div>
                      <strong>Notifications</strong>
                      <small>Your workspace updates</small>
                    </div>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="notification-list">
                    {notifications.length ? notifications.map((n) => (
                      <button
                        type="button"
                        key={n._id}
                        className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                        onClick={() => markOneNotificationRead(n._id)}
                      >
                        <span className="notification-indicator" />
                        <span>
                          <strong>{n.title}</strong>
                          <small>{n.message}</small>
                          <small className="notification-time">
                            {new Date(n.createdAt).toLocaleString()}
                          </small>
                        </span>
                      </button>
                    )) : (
                      <div className="notification-empty">
                        You're all caught up!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button type="button" className="topbar-avatar">
              {displayName.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        <section className="dashboard-content">
          {/* ================= OVERVIEW PAGE ================= */}
          {activePage === 'Overview' && (
            <>
              <div className="dashboard-page-heading">
                <div>
                  <div className="dashboard-eyebrow">YOUR CREATIVE WORKSPACE</div>
                  <h1>
                    Dashboard<span className="heading-sparkle">✧</span>
                  </h1>
                  <p>
                    Manage your projects, collaborate with your team and build something
                    great.
                  </p>
                </div>
                <button
                  type="button"
                  className="dashboard-primary-button"
                  onClick={() => selectPage('My Projects')}
                >
                  <span>+</span> New Project
                </button>
              </div>

              {/* WELCOME BANNER */}
              <section className="dashboard-welcome-banner">
                <div className="welcome-banner-content">
                  <div className="welcome-kicker">
                    <span className="welcome-live-dot" />
                    YOUR AI-POWERED WORKSPACE
                  </div>
                  <h2>
                    Welcome back, <span>{displayName}!</span>
                  </h2>
                  <p>
                    Your next great idea starts here. Bring your projects, notes and team
                    together with the power of AI.
                  </p>
                  <button
                    type="button"
                    className="welcome-banner-button"
                    onClick={() => selectPage('My Projects')}
                  >
                    Explore your workspace <span>→</span>
                  </button>
                </div>

                {/* ANIMATED NARVIX ART */}
                <div className="welcome-art" aria-hidden="true">
                  <div className="art-orbit art-orbit-one" />
                  <div className="art-orbit art-orbit-two" />
                  <div className="art-orbit art-orbit-three" />
                  <div className="art-core">N</div>
                  <div className="art-floating art-floating-one">✧</div>
                  <div className="art-floating art-floating-two">{'</>'}</div>
                  <div className="art-floating art-floating-three">⌘</div>
                </div>
              </section>

              {/* WORKSPACE STATISTICS */}
              <div className="dashboard-page-heading">
                <div>
                  <div className="dashboard-eyebrow">AT A GLANCE</div>
                  <h1>Workspace Overview</h1>
                  <p>Here is a quick look at your workspace activity.</p>
                </div>
              </div>

              <div className="dashboard-stats-grid">
                {stats.map((stat) => (
                  <article className="dashboard-stat-card" key={stat.title}>
                    <div className="stat-card-top">
                      <span>{stat.title}</span>
                      <div className="stat-icon">{stat.icon}</div>
                    </div>
                    <h2>{stat.value}</h2>
                    <p>{stat.note}</p>
                  </article>
                ))}
              </div>

              {/* 2-COLUMN WORKSPACE */}
              <div className="overview-workspace-grid">
                {/* LEFT COLUMN */}
                <div className="overview-main-column">
                  {/* MARKDOWN NOTES */}
                  <section className="overview-panel">
                    <div className="overview-panel-header">
                      <div>
                        <span className="overview-panel-label">WORKSPACE</span>
                        <h3>Markdown Notes</h3>
                        <p>Write, organize and understand your ideas.</p>
                      </div>
                      <span className="overview-panel-icon">✎</span>
                    </div>

                    <div className="overview-editor-preview">
                      <div className="overview-editor-toolbar">
                        <span>Markdown Editor</span>
                        <span>Preview</span>
                      </div>

                      <div className="overview-editor-content">
                        <h4>Welcome to your workspace</h4>
                        <p>Start writing your project notes here...</p>
                        <div className="overview-editor-line" />
                        <div className="overview-editor-line" />
                        <div className="overview-editor-line short" />
                      </div>
                    </div>

                    <div className="overview-ai-actions">
                      <button type="button" onClick={() => selectPage('AI Assistant')}>
                        ✨ AI Explain
                      </button>
                      <button type="button" onClick={() => selectPage('AI Assistant')}>
                        ✦ AI Suggest
                      </button>
                    </div>

                    <button
                      className="overview-panel-link"
                      type="button"
                      onClick={() => selectPage('Notes & Docs')}
                    >
                      Open Notes & Docs →
                    </button>
                  </section>

                  {/* CODE REPOSITORY */}
                  <section className="overview-panel">
                    <div className="overview-panel-header">
                      <div>
                        <span className="overview-panel-label">DEVELOPMENT</span>
                        <h3>Code Repository</h3>
                        <p>Keep your project files organized.</p>
                      </div>
                      <span className="overview-panel-icon">⌘</span>
                    </div>

                    <div className="overview-repository-empty">
                      <div className="overview-repository-symbol">{'</>'}</div>
                      <h4>Your repository starts here</h4>
                      <p>Upload project files to manage and review your code.</p>
                      <button type="button" onClick={() => selectPage('File Manager')}>
                        Open File Manager →
                      </button>
                    </div>
                  </section>
                </div>

                {/* RIGHT COLUMN */}
                <div className="overview-side-column">
                  {/* CONTRIBUTION ANALYTICS */}
                  <section className="overview-panel">
                    <div className="overview-panel-header">
                      <div>
                        <span className="overview-panel-label">ACTIVITY</span>
                        <h3>Contribution Analytics</h3>
                        <p>Activity preview</p>
                      </div>
                      <span className="overview-panel-icon">↗</span>
                    </div>

                    <div className="overview-chart">
                      <div className="overview-chart-bars">
                        {[35, 55, 42, 75, 58, 88, 65].map((height, index) => (
                          <div className="overview-chart-column" key={index}>
                            <div
                              className="overview-chart-bar"
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="overview-chart-labels">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <span key={day}>{day}</span>
                        ))}
                      </div>
                    </div>

                    <p className="overview-analytics-note">
                      Sample preview — live contribution data is not connected yet.
                    </p>

                    <button
                      className="overview-panel-link"
                      type="button"
                      onClick={() => selectPage('Analytics')}
                    >
                      View Analytics →
                    </button>
                  </section>

                  {/* PROJECT CONTRIBUTORS */}
                  <section className="overview-panel">
                    <div className="overview-panel-header">
                      <div>
                        <span className="overview-panel-label">YOUR TEAM</span>
                        <h3>Project Contributors</h3>
                        <p>People in your workspaces</p>
                      </div>
                      <span className="overview-panel-icon">♧</span>
                    </div>

                    <div className="overview-contributors-list">
                      {workspaceMembers.length > 0 ? (
                        workspaceMembers.map((member) => (
                          <div className="overview-contributor" key={member._id}>
                            <div className="contributor-avatar">
                              {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                            </div>

                            <div className="contributor-details">
                              <strong>{member.name || 'Workspace Member'}</strong>
                              <span>{member.email}</span>
                            </div>

                            <span className="contributor-role">{member.workspaceRole}</span>
                          </div>
                        ))
                      ) : (
                        <p className="overview-analytics-note">No contributors found yet.</p>
                      )}
                    </div>

                    <button
                      className="overview-panel-link"
                      type="button"
                      onClick={() => selectPage('Team Members')}
                    >
                      Manage Team →
                    </button>
                  </section>
                </div>
              </div>
            </>
          )}

          {/* ================= MY PROJECTS PAGE ================= */}
          {activePage === 'My Projects' && (
            <section className="projects-page">
              {/* 1. PAGE HEADER */}
              <div className="projects-page-header">
                <div>
                  <div className="dashboard-eyebrow">PROJECT WORKSPACE</div>
                  <h1>Project Hub</h1>
                  <p>Create projects, track progress and collaborate with your team.</p>
                </div>

                <button
                  type="button"
                  className="dashboard-primary-button"
                  onClick={handleToggleProjectForm}
                >
                  <span>+</span> Create New Project
                </button>
              </div>

              {/* 2. TOAST NOTIFICATIONS */}
              <div className="project-notifications-container">
                {projectSuccess && (
                  <div className="projects-success-message">
                    <span>✓</span> {projectSuccess}
                  </div>
                )}
                {projectsError && (
                  <div className="projects-error-message" role="alert">
                    {projectsError}
                  </div>
                )}
              </div>

              {/* 3. SUMMARY CARDS */}
              <div className="projects-summary-grid">
                <article className="projects-summary-card">
                  <span className="summary-icon">▣</span>
                  <div>
                    <p>Total Projects</p>
                    <h2>{projectCounts.total}</h2>
                  </div>
                </article>
                <article className="projects-summary-card planning-card">
                  <span className="summary-icon">◷</span>
                  <div>
                    <p>Planning</p>
                    <h2>{projectCounts.planning}</h2>
                  </div>
                </article>
                <article className="projects-summary-card progress-card">
                  <span className="summary-icon">↗</span>
                  <div>
                    <p>In Progress</p>
                    <h2>{projectCounts.inProgress}</h2>
                  </div>
                </article>
                <article className="projects-summary-card completed-card">
                  <span className="summary-icon">✓</span>
                  <div>
                    <p>Completed</p>
                    <h2>{projectCounts.completed}</h2>
                  </div>
                </article>
              </div>

              {/* 4. CREATE / EDIT FORM */}
              {showProjectForm && (
                <form className="projects-form-card" onSubmit={handleCreateProject}>
                  <div className="projects-form-heading">
                    <div>
                      <h2>{editingProjectId ? 'Edit Project' : 'Create New Project'}</h2>
                      <p>
                        {editingProjectId
                          ? 'Update your project details.'
                          : 'Add details about your new workspace project.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="projects-close-button"
                      onClick={resetProjectForm}
                    >
                      ×
                    </button>
                  </div>

                  <div className="projects-form-field">
                    <label htmlFor="projectTitle">Project Title</label>
                    <input
                      id="projectTitle"
                      type="text"
                      name="title"
                      placeholder="Enter project title"
                      value={projectForm.title}
                      onChange={handleProjectInput}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="projects-form-field">
                    <label htmlFor="projectDescription">Description</label>
                    <textarea
                      id="projectDescription"
                      name="description"
                      placeholder="Describe your project..."
                      value={projectForm.description}
                      onChange={handleProjectInput}
                      maxLength={2000}
                      rows={3}
                    />
                  </div>

                  <div className="projects-form-field">
                    <label htmlFor="projectVisibility">Project Visibility</label>
                    <select
                      id="projectVisibility"
                      name="visibility"
                      value={projectForm.visibility}
                      onChange={handleProjectInput}
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>

                  <div className="projects-form-actions">
                    <button
                      type="button"
                      className="projects-cancel-button"
                      onClick={resetProjectForm}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="dashboard-primary-button"
                      disabled={creatingProject}
                    >
                      {creatingProject
                        ? 'Saving...'
                        : editingProjectId
                        ? 'Update Project →'
                        : 'Create Project →'}
                    </button>
                  </div>
                </form>
              )}

              {/* 5. TOOLBAR (FILTERS & SORT) */}
              <div className="projects-toolbar">
                <div className="projects-filter-group">
                  {STATUS_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      className={`projects-filter-button ${
                        projectStatusFilter === filter.value ? 'active' : ''
                      }`}
                      onClick={() => setProjectStatusFilter(filter.value)}
                      aria-pressed={projectStatusFilter === filter.value}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="projects-sort-control">
                  <label htmlFor="projectSort">Sort by:</label>
                  <select
                    id="projectSort"
                    value={projectSort}
                    onChange={(e) => setProjectSort(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* 6. PROJECT LIST HEADER */}
              <div className="projects-list-heading">
                <div>
                  <h2>All Projects</h2>
                  <p>
                    Showing {filteredProjects.length} of {projects.length} projects
                  </p>
                </div>
              </div>

              {/* 7. PROJECT GRID */}
              {projectsLoading ? (
                <div className="projects-empty-state">Loading your projects...</div>
              ) : filteredProjects.length > 0 ? (
                <div className="projects-grid">
                  {filteredProjects.map((project) => {
                    const isOwner = project.owner?.email === email;

                    return (
                      <article className="project-card" key={project._id}>
                        <div className="project-card-top">
                          <div className="project-card-icon">▣</div>
                          <span
                            className={`project-visibility ${
                              project.visibility === 'public' ? 'public' : 'private'
                            }`}
                          >
                            {project.visibility || 'private'}
                          </span>
                        </div>

                        <h3>{project.title}</h3>
                        <p className="project-card-description">
                          {project.description || 'No description provided.'}
                        </p>

                        {/* CREATOR INFO */}
                        <div className="project-card-owner">
                          <div className="project-card-owner-avatar">
                            {(project.owner?.name || project.owner?.email || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="project-card-owner-info">
                            <span>CREATED BY</span>
                            <strong>
                              {project.owner?.name || project.owner?.email || 'Unknown'}
                            </strong>
                          </div>
                        </div>

                        <div className="project-status-control">
                          <label htmlFor={`status-${project._id}`}>Project Status</label>
                          <select
                            id={`status-${project._id}`}
                            value={project.status || 'planning'}
                            disabled={!isOwner}
                            onChange={(e) =>
                              handleUpdateProjectStatus(project._id, e.target.value)
                            }
                          >
                            <option value="planning">Planning</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>

                        <div className="project-card-footer">
                          <span>♧ {project.members?.length || 0} member(s)</span>
                          <span>
                            {project.createdAt
                              ? new Date(project.createdAt).toLocaleDateString()
                              : ''}
                          </span>
                        </div>

                        <div className="project-card-actions">
                          <button
                            type="button"
                            className="projects-edit-button"
                            onClick={() => handleOpenProject(project)}
                          >
                            ↗ Open Project
                          </button>
                        </div>

                        {isOwner && (
                          <div className="project-card-actions">
                            <button
                              type="button"
                              className="projects-edit-button"
                              onClick={() => handleEditProject(project)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              className="projects-delete-button"
                              onClick={() => handleDeleteProject(project)}
                              disabled={deletingProjectId === project._id}
                            >
                              {deletingProjectId === project._id ? 'Deleting...' : '🗑 Delete'}
                            </button>


                            <button
  type="button"
  className="projects-edit-button"
  onClick={() => handleShareProject(project)}

>

  {project.visibility === 'public' ? '🔒 Disable Sharing' : '🔗 Share'}
</button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                !projectsError && (
                  <div className="projects-empty-state">
                    <div className="projects-empty-icon">▣</div>
                    <h2>{search ? 'No matching projects found' : 'No projects yet'}</h2>
                    <p>
                      {search
                        ? 'Try another search term.'
                        : 'Create your first project and start collaborating with your team.'}
                    </p>
                    {!search && (
                      <button
                        type="button"
                        className="dashboard-primary-button"
                        onClick={() => setShowProjectForm(true)}
                      >
                        + Create Your First Project
                      </button>
                    )}
                  </div>
                )
              )}
            </section>
          )}

          {/* ================= TEAM MEMBERS PAGE ================= */}
          {activePage === 'Team Members' && (
            <section className="team-members-page">
              {/* TEAM MEMBER SUCCESS TOAST (auto-hides after 3 seconds) */}
              {teamMemberSuccess && (
                <div className="narvix-toast" role="status" aria-live="polite">
                  <span className="narvix-toast-icon">✓</span>
                  <span className="narvix-toast-text">{teamMemberSuccess}</span>
                  <button
                    type="button"
                    className="narvix-toast-close"
                    onClick={() => setTeamMemberSuccess('')}
                    aria-label="Dismiss notification"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="team-members-header">
                <div>
                  <div className="dashboard-eyebrow">NARVIX WORKSPACE</div>
                  <h1>Team Members</h1>
                  <p>View the people working together on your projects.</p>
                </div>
              </div>

              {/* PROJECT SELECTOR */}
              <div className="team-members-project-selector">
                <label htmlFor="teamProjectSelect">Select Project</label>

                <select
                  id="teamProjectSelect"
                  value={selectedTeamProjectId}
                  onChange={(e) => {
                    setSelectedTeamProjectId(e.target.value);
                    setTeamMemberSuccess('');
                    setTeamMemberError('');
                  }}
                >
                  <option value="">Choose a project</option>

                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              {projectsLoading ? (
                <p>Loading projects...</p>
              ) : projects.length === 0 ? (
                <div className="dashboard-stat-card">
                  <h3>No projects found</h3>
                  <p>Create or join a project to view its team members.</p>
                </div>
              ) : selectedTeamProject ? (
                <>
                  {/* SELECTED PROJECT */}
                  <div className="team-members-project-info">
                    <div>
                      <span>SELECTED PROJECT</span>
                      <h2>{selectedTeamProject.title}</h2>
                      <p>{selectedTeamProject.description || 'No description provided.'}</p>
                    </div>

                    <div className="team-members-count">
                      {selectedTeamProject.members?.length || 0}
                      <span>Members</span>
                    </div>
                  </div>

                  {/* ADD MEMBER - OWNER ONLY */}
                  {selectedTeamProject.owner?.email === email && (
                    <form className="team-members-add-form" onSubmit={handleAddTeamMember}>
                      <div>
                        <h3>Add Team Member</h3>
                        <p>Enter the email of an existing registered user.</p>
                      </div>

                      <div className="team-members-add-controls">
                        <input
                          type="email"
                          placeholder="Enter member email"
                          value={teamMemberEmail}
                          onChange={(e) => setTeamMemberEmail(e.target.value)}
                          required
                        />

                        <button type="submit" disabled={addingTeamMember}>
                          {addingTeamMember ? 'Adding...' : '+ Add Member'}
                        </button>
                      </div>
                    </form>
                  )}

                  {teamMemberError && (
                    <div className="team-members-error" role="alert">
                      {teamMemberError}
                    </div>
                  )}

                  {/* MEMBERS LIST */}
                  <div className="team-members-list">
                    <div className="team-members-list-header">
                      <h3>Project Members</h3>
                      <span>{selectedTeamProject.members?.length || 0} members</span>
                    </div>

                    {selectedTeamProject.members?.length > 0 ? (
                      selectedTeamProject.members.map((member, index) => {
                        const user = member.user;
                        const canManage =
                          selectedTeamProject.owner?.email === email &&
                          user?._id !== selectedTeamProject.owner?._id;

                        return (
                          <div className="team-member-row" key={user?._id || index}>
                            <div className="team-member-avatar">
                              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                            </div>

                            <div className="team-member-details">
                              <strong>{user?.name || 'User'}</strong>
                              <span>{user?.email || 'Email unavailable'}</span>
                            </div>

                            {canManage ? (
                              <div className="team-member-actions">
                                <select
                                  value={member.role || 'member'}
                                  onChange={(e) =>
                                    handleUpdateTeamMemberRole(user._id, e.target.value)
                                  }
                                  disabled={updatingMemberId === user?._id}
                                  aria-label={`Update role for ${user?.name || 'team member'}`}
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setMemberToRemove({
                                      id: user._id,
                                      name: user?.name || user?.email || 'this member',
                                    })
                                  }
                                  disabled={removingMemberId === user?._id}
                                >
                                  {removingMemberId === user?._id ? 'Removing...' : 'Remove'}
                                </button>
                              </div>
                            ) : (
                              <span className="team-member-role">{member.role || 'member'}</span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p>No members found in this project.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="dashboard-stat-card">
                  <h3>Select a project</h3>
                  <p>Choose a project above to view its team members.</p>
                </div>
              )}
            </section>
          )}

          {/* ================= REMOVE MEMBER CONFIRMATION ================= */}
          {activePage === 'Team Members' && memberToRemove && (
            <div
              className="team-member-modal-backdrop"
              onClick={() => {
                if (!removingMemberId) setMemberToRemove(null);
              }}
            >
              <div
                className="team-member-modal"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="remove-member-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="team-member-modal-icon">!</div>

                <span className="team-member-modal-label">REMOVE TEAM MEMBER</span>

                <h3 id="remove-member-title">Remove {memberToRemove.name}?</h3>

                <p>This member will lose access to the selected project.</p>

                <div className="team-member-modal-actions">
                  <button
                    type="button"
                    className="team-member-cancel-button"
                    onClick={() => setMemberToRemove(null)}
                    disabled={removingMemberId === memberToRemove.id}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="team-member-confirm-button"
                    disabled={removingMemberId === memberToRemove.id}
                    onClick={() => handleRemoveTeamMember(memberToRemove.id)}
                  >
                    {removingMemberId === memberToRemove.id ? 'Removing...' : 'Yes, Remove'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= NOTES & DOCS PAGE ================= */}
          {activePage === 'Notes & Docs' && (
            <section className="notes-page">
              <div className="notes-page-header">
                <div className="dashboard-eyebrow">NARVIX WORKSPACE</div>
                <h1>Notes & Docs</h1>
                <p>Create, manage and organize your project notes.</p>
              </div>

              {/* PROJECT SELECTOR */}
              <div className="notes-project-selector">
                <label htmlFor="notesProjectSelect">Select Project</label>

                <select
                  id="notesProjectSelect"
                  value={selectedNotesProjectId}
                  onChange={(e) => {
                    setSelectedNotesProjectId(e.target.value);
                    setEditingNoteId(null);
                    setShowNoteForm(false);
                    setNoteTitle('');
                    setNoteContent('');
                    setNotesError('');
                    setNotesSuccess('');
                    setNoteToDelete(null);
                  }}
                >
                  <option value="">Choose a project</option>

                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedNotesProjectId && (
                selectedNoteAIView ? (
                  <section className="note-document-view">
                    <div className="note-document-breadcrumb">
                      NARVIX WORKSPACE / {selectedNotesProject?.title || 'Project'} / Notes
                    </div>

                    <button
                      type="button"
                      className="note-document-back"
                      onClick={() => {
                        setSelectedNoteAIView(null);
                        setNoteAIResult(null);
                        setNotesError('');
                      }}
                    >
                      ← Back to Notes
                    </button>

                    <header className="note-document-header">
                      <span className="note-document-label">PROJECT DOCUMENT</span>
                      <h2>{selectedNoteAIView.note.title}</h2>
                      <p>{selectedNotesProject?.title || 'Selected Project'}</p>
                    </header>

                    <article className="note-document-section">
                      <div className="note-document-section-heading">
                        <span>01</span>
                        <h3>Original Note</h3>
                      </div>
                      <div className="note-document-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {normalizeNoteMarkdown(selectedNoteAIView.note.content || 'No content available.')}
                        </ReactMarkdown>
                      </div>
                    </article>

                    <article className="note-document-section note-document-ai-section">
                      <div className="note-document-section-heading">
                        <span>02</span>
                        <h3>
                          {selectedNoteAIView.action === 'explain'
                            ? 'Gemini Explanation'
                            : 'Gemini Improved Version'}
                        </h3>
                      </div>

                      {noteAILoading?.noteId === selectedNoteAIView.note._id ? (
                        <div className="note-document-loading">
                          Gemini is processing your note...
                        </div>
                      ) : noteAIResult?.noteId === selectedNoteAIView.note._id ? (
                        <div className="note-document-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {normalizeNoteMarkdown(noteAIResult.content)}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="note-document-loading">
                          Gemini result is not available.
                        </div>
                      )}
                    </article>

                    {notesError && (
                      <div className="notes-error" role="alert">{notesError}</div>
                    )}

                    {selectedNoteAIView.action === 'improve' &&
                      noteAIResult?.noteId === selectedNoteAIView.note._id && (
                        <div className="note-document-actions">
                          <button
                            type="button"
                            className="note-ai-use-button"
                            onClick={() => handleUseImprovedNote(selectedNoteAIView.note)}
                          >
                            Use Improved Content
                          </button>
                          <p>
                            Your original note stays unchanged until you save.
                          </p>
                        </div>
                      )}
                  </section>
                ) : (
                  <>
                  {/* CREATE / EDIT NOTE FORM */}
                  <button
                    type="button"
                    className="notes-create-button"
                    onClick={() => {
                      setEditingNoteId(null);
                      setNoteTitle('');
                      setNoteContent('');
                      setNotesError('');
                      setNotesSuccess('');
                      setShowNoteForm(true);
                    }}
                  >
                    + Create New Note
                  </button>

                  {showNoteForm && (
                    <form className="notes-form" onSubmit={handleSaveNote}>
                      <h2>{editingNoteId ? 'Edit Note' : 'Create New Note'}</h2>

                      <label htmlFor="noteTitle">Note Title</label>
                      <input
                        id="noteTitle"
                        type="text"
                        placeholder="Enter note title"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        maxLength={150}
                        required
                      />

                      <label htmlFor="noteContent">Note Content (Markdown)</label>
                      <textarea
                        id="noteContent"
                        placeholder="Write your notes here..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        rows={8}
                        required
                      />

                      <div className="notes-form-actions">
                        <button type="submit" disabled={savingNote}>
                          {savingNote
                            ? 'Saving...'
                            : editingNoteId
                              ? 'Update Note'
                              : 'Create Note'}
                        </button>

                        {showNoteForm && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowNoteForm(false);
                              setEditingNoteId(null);
                              setNoteTitle('');
                              setNoteContent('');
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  )}

                  {notesSuccess && <div className="notes-success">{notesSuccess}</div>}

                  {notesError && (
                    <div className="notes-error" role="alert">
                      {notesError}
                    </div>
                  )}

                  {/* NOTES LIST */}
                  <div className="notes-list">
                    <div className="notes-list-header">
                      <div>
                        <h2>
                          Notes for {selectedNotesProject?.title || 'Selected Project'}
                        </h2>
                        <p className="notes-project-description">
                          All documentation and notes belonging to this project.
                        </p>
                      </div>
                      <span>{notes.length} notes</span>
                    </div>

                    {notesLoading ? (
                      <p>Loading notes...</p>
                    ) : notes.length > 0 ? (
                      notes.map((note) => (
                        <article
                          className={`note-card ${expandedNoteId === note._id ? 'note-card-expanded' : ''}`}
                          key={note._id}
                        >
                          <button
                            type="button"
                            className="note-expand-toggle"
                            onClick={() =>
                              setExpandedNoteId(
                                expandedNoteId === note._id ? null : note._id
                              )
                            }
                            aria-label={expandedNoteId === note._id ? 'Collapse note' : 'Expand note'}
                            title={expandedNoteId === note._id ? 'Collapse note' : 'Expand note'}
                          >
                            {expandedNoteId === note._id ? '⊙' : '⛶'}
                          </button>

                          <div className="note-card-content">
                            <div className="note-card-heading">
                              <h3>{note.title}</h3>
                            </div>

                            <div className="note-document-content">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {normalizeNoteMarkdown(note.content || 'No content available.')}
                              </ReactMarkdown>
                            </div>
                          </div>

                          <div className="note-card-actions">
                            <button type="button" onClick={() => handleEditNote(note)}>
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleNoteAI(note, 'explain')}
                              disabled={noteAILoading?.noteId === note._id}
                            >
                              {noteAILoading?.noteId === note._id &&
                              noteAILoading?.action === 'explain'
                                ? 'Explaining...'
                                : 'Explain with Gemini'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleNoteAI(note, 'improve')}
                              disabled={noteAILoading?.noteId === note._id}
                            >
                              {noteAILoading?.noteId === note._id &&
                              noteAILoading?.action === 'improve'
                                ? 'Improving...'
                                : 'Improve with Gemini'}
                            </button>

                            <button type="button" onClick={() => setNoteToDelete(note._id)}>
                              Delete
                            </button>
                          </div>

                          {noteToDelete === note._id && (
                            <div className="note-delete-confirmation">
                              <span>Delete this note?</span>

                              <button
                                type="button"
                                onClick={handleDeleteNote}
                                disabled={deletingNoteId === note._id}
                              >
                                {deletingNoteId === note._id ? 'Deleting...' : 'Confirm'}
                              </button>

                              <button type="button" onClick={() => setNoteToDelete(null)}>
                                Cancel
                              </button>
                            </div>
                          )}
                        </article>
                      ))
                    ) : (
                      <div className="notes-empty-state">
                        <h3>No notes yet</h3>
                        <p>Create your first note for this project.</p>
                      </div>
                    )}
                  </div>
                  </>
                )
              )}
            </section>
          )}

          {/* ================= OTHER WORKSPACE PAGES ================= */}
          {activePage !== 'Overview' &&
            activePage !== 'My Projects' &&
            activePage !== 'Team Members' &&
            activePage !== 'Notes & Docs' &&
            (activePage === 'AI Assistant' ? (
              /* ================= AI ASSISTANT PAGE ================= */
              <section className="ai-assistant-page">
                {/* HISTORY SIDEBAR */}
                <aside className="ai-history-sidebar">
                  {activeDeveloperTool === 'general' ? (
                    <>
                      <button
                        type="button"
                        className="ai-new-chat-button"
                        onClick={handleNewChat}
                      >
                        + New Chat
                      </button>

                      <h3>Recent Chats</h3>

                      {historyLoading && (
                        <p className="ai-history-loading">Loading chats...</p>
                      )}

                      {!historyLoading && conversations.length === 0 && (
                        <p className="ai-history-empty">No conversations yet.</p>
                      )}

                      <div className="ai-history-list">
                        {conversations.map((chat) => (
                          <div
                            className={`ai-history-item ${
                              currentConversationId === chat._id ? 'active' : ''
                            }`}
                            key={chat._id}
                          >
                            <button
                              type="button"
                              className="ai-history-title"
                              onClick={() => handleOpenConversation(chat._id)}
                            >
                              <span>✧</span>
                              <span>{chat.title}</span>
                            </button>

                            <button
                              type="button"
                              className="ai-history-delete"
                              title="Delete conversation"
                              disabled={deletingConversationId === chat._id}
                              onClick={() => handleDeleteConversation(chat._id)}
                            >
                              {deletingConversationId === chat._id ? '...' : '🗑'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      {(activeDeveloperTool === 'explainer' ||
                        activeDeveloperTool === 'documentation' ||
                        activeDeveloperTool === 'readme') && (
                        <button
                          type="button"
                          className="ai-new-chat-button"
                          onClick={handleNewToolSession}
                        >
                          + New Session
                        </button>
                      )}

                      <h3>
                        {activeDeveloperTool === 'explainer'
                          ? 'Code Explainer History'
                          : activeDeveloperTool === 'documentation'
                            ? 'Documentation History'
                            : 'README History'}
                      </h3>

                      {toolHistoryLoading && (
                        <p className="ai-history-loading">Loading history...</p>
                      )}

                      {toolHistoryError && (
                        <p className="ai-history-empty" role="alert">
                          {toolHistoryError}
                        </p>
                      )}

                      {!toolHistoryLoading && !toolHistoryError && toolHistory.length === 0 && (
                        <p className="ai-history-empty">No saved results yet.</p>
                      )}

                      <div className="ai-history-list">
                        {toolHistory.map((item) => (
                          <div className="ai-history-item" key={item._id}>
                            <button
                              type="button"
                              className="ai-history-title"
                              onClick={() => handleOpenToolHistory(item)}
                            >
                              <span>✧</span>
                              <span>{item.title}</span>
                            </button>

                            <button
                              type="button"
                              className="ai-history-delete"
                              title="Delete saved result"
                              disabled={deletingToolHistoryId === item._id}
                              onClick={() => handleDeleteToolHistory(item._id)}
                            >
                              {deletingToolHistoryId === item._id ? '...' : '🗑'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </aside>

                {/* MAIN CHAT AREA */}
                <div className="ai-chat-main">
                  <div className="ai-page-header">
                    <span className="dashboard-eyebrow">NARVIX AI WORKSPACE</span>

                    <h1>
                      AI Assistant <span>✦</span>
                    </h1>

                    <p>Your AI copilot for ideas, coding and documentation.</p>
                  </div>

                  {/* AI DEVELOPER TOOLS NAVIGATION */}
                  <div className="developer-tool-tabs">
                    <button
                      type="button"
                      className={activeDeveloperTool === 'general' ? 'active' : ''}
                      onClick={() => setActiveDeveloperTool('general')}
                    >
                      💬 General AI Chat
                    </button>
                    <button
                      type="button"
                      className={activeDeveloperTool === 'explainer' ? 'active' : ''}
                      onClick={() => setActiveDeveloperTool('explainer')}
                    >
                      ⌘ Code Explainer
                    </button>

                    <button
                      type="button"
                      className={activeDeveloperTool === 'documentation' ? 'active' : ''}
                      onClick={() => setActiveDeveloperTool('documentation')}
                    >
                      📄 Documentation Generator
                    </button>

                    <button
                      type="button"
                      className={activeDeveloperTool === 'readme' ? 'active' : ''}
                      onClick={() => setActiveDeveloperTool('readme')}
                    >
                      📘 README Generator
                    </button>
                  </div>

                  {/* CODE EXPLAINER TOOL */}
                  {activeDeveloperTool === 'explainer' && (
                  <section className="code-explainer-panel">
                    <div className="code-explainer-header">
                      <div>
                        <span className="dashboard-eyebrow">AI DEVELOPER TOOL</span>
                        <h2>Code Explainer ✦</h2>
                        <p>Understand your code with Gemini AI.</p>
                      </div>
                      <span className="code-explainer-icon">⌘</span>
                    </div>

                    <form onSubmit={handleExplainCode}>
                      <div className="code-explainer-toolbar">
                        <label htmlFor="code-language">Programming Language</label>
                        <select
                          id="code-language"
                          value={codeLanguage}
                          onChange={(e) => setCodeLanguage(e.target.value)}
                          disabled={codeLoading}
                        >
                          {['JavaScript', 'Python', 'Java', 'C', 'C++', 'HTML', 'CSS', 'React', 'Node.js', 'PHP', 'TypeScript'].map((language) => (
                            <option key={language} value={language}>{language}</option>
                          ))}
                        </select>
                      </div>

                      <label className="code-explainer-label" htmlFor="code-input">
                        Paste your code
                      </label>

                      <textarea
                        id="code-input"
                        className="code-explainer-input"
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        placeholder="// Paste your code here..."
                        rows={10}
                        maxLength={12000}
                        disabled={codeLoading}
                      />

                      <div className="code-explainer-actions">
                        <span>{codeInput.length}/12000 characters</span>
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setCodeInput('');
                              setCodeExplanation('');
                              setCodeError('');
                            }}
                            disabled={codeLoading}
                          >
                            Clear
                          </button>
                          <button
                            type="submit"
                            disabled={codeLoading || !codeInput.trim()}
                          >
                            {codeLoading ? 'Explaining...' : 'Explain Code ✦'}
                          </button>
                        </div>
                      </div>
                    </form>

                    {codeError && (
                      <div className="code-explainer-error" role="alert">
                        {codeError}
                      </div>
                    )}

                    {codeLoading && (
                      <div className="code-explainer-loading">
                        Gemini is analyzing your code...
                      </div>
                    )}

                    {codeExplanation && (
                      <div className="code-explainer-result">
                        <div className="code-explainer-result-header">
                          <h3>✦ AI Explanation</h3>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(codeExplanation)}
                          >
                            Copy Explanation
                          </button>
                        </div>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {codeExplanation}
                        </ReactMarkdown>
                      </div>
                    )}
                  </section>
                  )}

                  {activeDeveloperTool === 'documentation' && (
                    <section className="code-explainer-panel">
                      <div className="code-explainer-header">
                        <div>
                          <span className="dashboard-eyebrow">AI DEVELOPER TOOL</span>
                          <h2>Documentation Generator ✦</h2>
                          <p>Generate structured technical documentation from your code.</p>
                        </div>
                        <span className="code-explainer-icon">📄</span>
                      </div>

                      <form onSubmit={handleGenerateDocumentation}>
                        <div className="code-explainer-toolbar">
                          <label htmlFor="doc-language">Programming Language</label>
                          <select
                            id="doc-language"
                            value={docLanguage}
                            onChange={(e) => setDocLanguage(e.target.value)}
                            disabled={docLoading}
                          >
                            {['JavaScript', 'Python', 'Java', 'C', 'C++', 'HTML', 'CSS', 'React', 'Node.js', 'PHP', 'TypeScript'].map((language) => (
                              <option key={language} value={language}>{language}</option>
                            ))}
                          </select>
                        </div>

                        <label className="code-explainer-label" htmlFor="doc-code-input">
                          Paste your code
                        </label>
                        <textarea
                          id="doc-code-input"
                          className="code-explainer-input"
                          value={docCodeInput}
                          onChange={(e) => setDocCodeInput(e.target.value)}
                          placeholder="// Paste your code here..."
                          rows={10}
                          maxLength={12000}
                          disabled={docLoading}
                        />

                        <div className="code-explainer-actions">
                          <span>{docCodeInput.length}/12000 characters</span>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setDocCodeInput('');
                                setGeneratedDocumentation('');
                                setDocError('');
                              }}
                              disabled={docLoading}
                            >
                              Clear
                            </button>
                            <button type="submit" disabled={docLoading || !docCodeInput.trim()}>
                              {docLoading ? 'Generating...' : 'Generate Documentation ✦'}
                            </button>
                          </div>
                        </div>
                      </form>

                      {docError && <div className="code-explainer-error" role="alert">{docError}</div>}
                      {docLoading && <div className="code-explainer-loading">Generating your documentation...</div>}

                      {generatedDocumentation && (
                        <div className="code-explainer-result">
                          <div className="code-explainer-result-header">
                            <h3>✦ Generated Documentation</h3>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(generatedDocumentation)}
                            >
                              Copy Documentation
                            </button>
                          </div>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {generatedDocumentation}
                          </ReactMarkdown>
                        </div>
                      )}
                    </section>
                  )}

                  {activeDeveloperTool === 'readme' && (
                    <section className="code-explainer-panel">
                      <div className="code-explainer-header">
                        <div>
                          <span className="dashboard-eyebrow">AI DEVELOPER TOOL</span>
                          <h2>README Generator ✦</h2>
                          <p>Create a professional README.md for your project using Gemini AI.</p>
                        </div>
                        <span className="code-explainer-icon">📘</span>
                      </div>

                      <form onSubmit={handleGenerateReadme}>
                        <label className="code-explainer-label" htmlFor="readme-project-name">
                          Project Name *
                        </label>
                        <input
                          id="readme-project-name"
                          className="code-explainer-input"
                          value={readmeProjectName}
                          onChange={(e) => setReadmeProjectName(e.target.value)}
                          placeholder="e.g. Narvix"
                          maxLength={200}
                          disabled={readmeLoading}
                          required
                        />

                        <label className="code-explainer-label" htmlFor="readme-description">
                          Project Description *
                        </label>
                        <textarea
                          id="readme-description"
                          className="code-explainer-input"
                          value={readmeDescription}
                          onChange={(e) => setReadmeDescription(e.target.value)}
                          placeholder="What does your project do?"
                          rows={3}
                          maxLength={5000}
                          disabled={readmeLoading}
                          required
                        />

                        <label className="code-explainer-label" htmlFor="readme-tech-stack">
                          Technology Stack *
                        </label>
                        <textarea
                          id="readme-tech-stack"
                          className="code-explainer-input"
                          value={readmeTechStack}
                          onChange={(e) => setReadmeTechStack(e.target.value)}
                          placeholder="e.g. React, Node.js, Express, MongoDB"
                          rows={2}
                          maxLength={5000}
                          disabled={readmeLoading}
                          required
                        />

                        <label className="code-explainer-label" htmlFor="readme-features">
                          Main Features (Optional)
                        </label>
                        <textarea
                          id="readme-features"
                          className="code-explainer-input"
                          value={readmeFeatures}
                          onChange={(e) => setReadmeFeatures(e.target.value)}
                          placeholder="List the main features of your project..."
                          rows={3}
                          maxLength={5000}
                          disabled={readmeLoading}
                        />

                        <label className="code-explainer-label" htmlFor="readme-installation">
                          Installation Instructions (Optional)
                        </label>
                        <textarea
                          id="readme-installation"
                          className="code-explainer-input"
                          value={readmeInstallation}
                          onChange={(e) => setReadmeInstallation(e.target.value)}
                          placeholder="Add setup or installation commands if available..."
                          rows={3}
                          maxLength={5000}
                          disabled={readmeLoading}
                        />

                        <div className="code-explainer-actions">
                          <span>Fields marked * are required</span>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setReadmeProjectName('');
                                setReadmeDescription('');
                                setReadmeTechStack('');
                                setReadmeFeatures('');
                                setReadmeInstallation('');
                                setGeneratedReadme('');
                                setReadmeError('');
                              }}
                              disabled={readmeLoading}
                            >
                              Clear
                            </button>
                            <button type="submit" disabled={readmeLoading}>
                              {readmeLoading ? 'Generating...' : 'Generate README ✦'}
                            </button>
                          </div>
                        </div>
                      </form>

                      {readmeError && (
                        <div className="code-explainer-error" role="alert">
                          {readmeError}
                        </div>
                      )}

                      {readmeLoading && (
                        <div className="code-explainer-loading">
                          Gemini is creating your README...
                        </div>
                      )}

                      {generatedReadme && (
                        <div className="code-explainer-result">
                          <div className="code-explainer-result-header">
                            <h3>✦ Generated README.md</h3>
                            <div>
                              <button
                                type="button"
                                style={readmeCopied ? { backgroundColor: '#16a34a', color: '#fff' } : {}}
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(generatedReadme);
                                    setReadmeCopied(true);
                                    window.setTimeout(() => setReadmeCopied(false), 2000);
                                  } catch {
                                    setReadmeError('Unable to copy README.');
                                  }
                                }}
                              >
                                {readmeCopied ? '✓ Copied!' : 'Copy README'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const blob = new Blob([generatedReadme], {
                                    type: 'text/markdown;charset=utf-8',
                                  });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = 'README.md';
                                  link.click();
                                  URL.revokeObjectURL(url);
                                }}
                              >
                                Download .md
                              </button>
                            </div>
                          </div>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {generatedReadme}
                          </ReactMarkdown>
                        </div>
                      )}
                    </section>
                  )}

                  {activeDeveloperTool === 'general' && (
                  <div className="ai-chat-container">
                    {chatMessages.length === 0 && !aiAnswer && (
                      <div className="ai-welcome">
                        <div className="ai-welcome-icon">✧</div>

                        <h2>How can I help you today?</h2>

                        <p>
                          Ask Gemini anything about coding, projects, documentation or
                          problem solving.
                        </p>
                      </div>
                    )}

                    {chatMessages.map((message) => (
                      <div className="ai-chat-message" key={message._id}>
                        <div className="ai-user-message">
                          <span>You</span>

                          {editingMessageId === message._id ? (
                            <div className="ai-edit-form">
                              <textarea
                                value={editedPrompt}
                                onChange={(e) => setEditedPrompt(e.target.value)}
                                rows={4}
                                maxLength={8000}
                              />

                              <div className="ai-edit-actions">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedMessage(message._id)}
                                  disabled={aiLoading || !editedPrompt.trim()}
                                >
                                  {aiLoading ? 'Generating...' : 'Save & Regenerate'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMessageId(null);
                                    setEditedPrompt('');
                                  }}
                                  disabled={aiLoading}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p>{message.prompt}</p>

                              <button
                                type="button"
                                className="ai-edit-button"
                                onClick={() => {
                                  setEditingMessageId(message._id);
                                  setEditedPrompt(message.prompt);
                                  setAiError('');
                                }}
                              >
                                ✎ Edit
                              </button>
                            </>
                          )}
                        </div>

                        {editingMessageId !== message._id && message.response && (
                          <div className="ai-answer-card">
                            <div className="ai-answer-header">
                              <span>✦ Gemini Response</span>
                            </div>

                            <div className="ai-answer-content">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.response}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Current Gemini response */}
                    {aiAnswer && (
                      <div className="ai-answer-card">
                        <div className="ai-answer-header">
                          <span>✦ Gemini Response</span>

                          <button type="button" onClick={() => setAiAnswer('')}>
                            Clear
                          </button>
                        </div>

                        <div className="ai-answer-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {aiAnswer}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {aiLoading && (
                      <div className="ai-loading">
                        <span className="ai-loading-dot"></span>
                        Gemini is thinking...
                      </div>
                    )}

                    {aiError && (
                      <div className="ai-error" role="alert">
                        {aiError}
                      </div>
                    )}

                    {/* PROMPT INPUT */}
                    <form className="ai-prompt-form" onSubmit={handleAskGemini}>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ask Gemini something..."
                        rows={4}
                        maxLength={8000}
                        disabled={aiLoading}
                      />

                      <div className="ai-prompt-footer">
                        <span>{aiPrompt.length}/8000 characters</span>

                        <button type="submit" disabled={aiLoading || !aiPrompt.trim()}>
                          {aiLoading ? 'Thinking...' : 'Ask Gemini ✦'}
                        </button>
                      </div>
                    </form>
                  </div>
                  )}
                </div>

                {/* CUSTOM DELETE CHAT MODAL */}
                {conversationToDelete && (
                  <div
                    className="ai-delete-modal-overlay"
                    onClick={() => {
                      if (!deletingConversationId) {
                        setConversationToDelete(null);
                      }
                    }}
                  >
                    <div
                      className="ai-delete-modal"
                      role="alertdialog"
                      aria-modal="true"
                      aria-labelledby="ai-delete-title"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="ai-delete-modal-icon">🗑</div>

                      <span className="ai-delete-label">DELETE CONVERSATION</span>

                      <h2 id="ai-delete-title">Delete this chat?</h2>

                      <p>
                        Are you sure you want to delete{' '}
                        <strong>
                          {conversations.find((chat) => chat._id === conversationToDelete)
                            ?.title || 'this conversation'}
                        </strong>
                        ?
                      </p>

                      <p className="ai-delete-warning">
                        This conversation and all its messages will be permanently deleted.
                        This action cannot be undone.
                      </p>

                      <div className="ai-delete-modal-actions">
                        <button
                          type="button"
                          className="ai-delete-cancel"
                          onClick={() => setConversationToDelete(null)}
                          disabled={deletingConversationId === conversationToDelete}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="ai-delete-confirm"
                          onClick={() => handleDeleteConversation(conversationToDelete)}
                          disabled={deletingConversationId === conversationToDelete}
                        >
                          {deletingConversationId === conversationToDelete
                            ? 'Deleting...'
                            : 'Yes, Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            ) : activePage === 'File Manager' ? (
              /* ================= FILE MANAGER PAGE ================= */
              <section className="file-manager-page">
                {/* FILE MANAGER HEADER */}
                <div className="file-manager-header">
                  <div>
                    <span className="dashboard-eyebrow">NARVIX WORKSPACE</span>

                    <h1>File Manager</h1>

                    <p>Manage and organize all your project files in one place.</p>
                  </div>

                  <label className="file-manager-upload-button">
                    {uploadingFile ? 'Uploading...' : '+ Upload Files'}

                    <input
                      type="file"
                      hidden
                      disabled={!selectedFileProjectId || uploadingFile}
                      accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.md,.js,.jsx,.ts,.tsx,.css,.html,.json,.csv"
                      onChange={handleUploadFile}
                    />
                  </label>
                </div>

                {/* PROJECT SELECTOR */}
                <div className="file-manager-project-selector">
                  <label htmlFor="fileProjectSelect">Select Project</label>

                  <select
                    id="fileProjectSelect"
                    value={selectedFileProjectId}
                    onChange={(e) => {
                      setSelectedFileProjectId(e.target.value);
                      setFileSearch('');
                      setFileTypeFilter('all');
                      setFilesError('');
                      setFilesSuccess('');
                    }}
                  >
                    <option value="">Choose a project</option>

                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* NOTIFICATIONS */}
                {filesError && (
                  <div className="file-manager-error" role="alert">
                    {filesError}
                  </div>
                )}

                {filesSuccess && (
                  <div className="file-manager-success" role="status">
                    ✓ {filesSuccess}
                  </div>
                )}

                {/* EMPTY PROJECT STATE */}
                {!selectedFileProjectId ? (
                  <div className="file-manager-empty-state">
                    <div className="file-manager-empty-icon">📁</div>

                    <h2>Select a Project</h2>

                    <p>Choose a project to view and manage its files.</p>
                  </div>
                ) : (
                  <>
                    {/* STORAGE OVERVIEW */}
                    <div className="file-manager-stats">
                      <div className="file-manager-stat-card">
                        <span>ALL FILES</span>
                        <h2>{projectFiles.length}</h2>
                        <p>Total uploaded files</p>
                      </div>

                      <div className="file-manager-stat-card">
                        <span>DOCUMENTS</span>
                        <h2>{projectFiles.filter(isDocumentFile).length}</h2>
                        <p>PDF and text files</p>
                      </div>

                      <div className="file-manager-stat-card">
                        <span>IMAGES</span>
                        <h2>{projectFiles.filter(isImageFile).length}</h2>
                        <p>Uploaded images</p>
                      </div>

                      <div className="file-manager-stat-card">
                        <span>CODE FILES</span>
                        <h2>{projectFiles.filter(isCodeFile).length}</h2>
                        <p>Development files</p>
                      </div>
                    </div>

                    {/* SEARCH AND FILTER */}
                    <div className="file-manager-toolbar">
                      <input
                        type="search"
                        placeholder="⌕ Search files..."
                        value={fileSearch}
                        onChange={(e) => setFileSearch(e.target.value)}
                      />

                      <select
                        value={fileTypeFilter}
                        onChange={(e) => setFileTypeFilter(e.target.value)}
                      >
                        <option value="all">All Files</option>
                        <option value="documents">Documents</option>
                        <option value="images">Images</option>
                        <option value="code">Code Files</option>
                      </select>
                    </div>

                    {/* PROJECT FILE LIST */}
                    <div className="file-manager-list">
                      <div className="file-manager-list-header">
                        <div>
                          <h2>Project Files</h2>
                          <p>All files uploaded to this project.</p>
                        </div>

                        <span>{projectFiles.length} files</span>
                      </div>

                      {filesLoading ? (
                        <div className="file-manager-loading">Loading files...</div>
                      ) : filteredFiles.length > 0 ? (
                        <div className="file-manager-items">
                          {filteredFiles.map((file) => (
                            <article className="file-manager-item" key={file._id}>
                              <div className="file-manager-file-icon">
                                {getFileIcon(file)}
                              </div>

                              <div className="file-manager-file-info">
                                <h3>{file.originalName}</h3>

                                <p>
                                  {((file.size || 0) / 1024).toFixed(1)} KB
                                  {' · '}
                                  {file.createdAt
                                    ? new Date(file.createdAt).toLocaleDateString()
                                    : ''}
                                </p>

                                <span>
                                  Uploaded by {file.uploadedBy?.name || 'User'}
                                </span>
                              </div>

                              <div className="file-manager-actions">
                                <button
                                  type="button"
                                  onClick={() => handlePreviewFile(file)}
                                  title="Preview File"
                                >
                                  👁 Preview
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(file)}
                                  title="Download File"
                                >
                                  ⬇ Download
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setFileToDelete(file)}
                                  title="Delete File"
                                >
                                  🗑 Delete
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="file-manager-empty-state">
                          <div className="file-manager-empty-icon">📂</div>

                          <h2>No Files Found</h2>

                          <p>Upload a file or try another search.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>
            ) : activePage === 'Analytics' ? (
              /* ================= ANALYTICS DASHBOARD ================= */
              <section className="analytics-page">
                <div className="analytics-header">
                  <div>
                    <div className="dashboard-eyebrow">NARVIX WORKSPACE</div>
                    <h1>Workspace Analytics</h1>
                    <p>Track your projects, team and workspace activity.</p>
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="analytics-message">Loading analytics...</div>
                ) : analyticsError ? (
                  <div className="analytics-error" role="alert">
                    {analyticsError}
                  </div>
                ) : analyticsData ? (
                  <>
                    {/* Summary Cards */}
                    <div className="analytics-summary-grid">
                      <div className="analytics-card">
                        <span>📁</span>
                        <p>Total Projects</p>
                        <h2>{analyticsData.summary?.totalProjects ?? 0}</h2>
                      </div>

                      <div className="analytics-card">
                        <span>👥</span>
                        <p>Team Members</p>
                        <h2>{analyticsData.summary?.totalTeamMembers ?? 0}</h2>
                      </div>

                      <div className="analytics-card">
                        <span>📄</span>
                        <p>Total Files</p>
                        <h2>{analyticsData.summary?.totalFiles ?? 0}</h2>
                      </div>

                      <div className="analytics-card">
                        <span>💾</span>
                        <p>Storage Used</p>
                        <h2>{formatStorage(analyticsData.summary?.storageBytes)}</h2>
                      </div>
                    </div>

                    <div className="analytics-content-grid">
                      {/* Project Status */}
                      <div className="analytics-panel">
                        <h2>Project Status</h2>
                        <p>Overview of your project progress.</p>

                        <div className="analytics-status-item">
                          <div>
                            <span>Completed</span>
                            <strong>{analyticsData.projectStatus?.completed ?? 0}</strong>
                          </div>
                          <div className="analytics-progress">
                            <div
                              className="analytics-progress-fill completed"
                              style={{
                                width: `${getStatusPercent(analyticsData.projectStatus?.completed)}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="analytics-status-item">
                          <div>
                            <span>In Progress</span>
                            <strong>{analyticsData.projectStatus?.inProgress ?? 0}</strong>
                          </div>
                          <div className="analytics-progress">
                            <div
                              className="analytics-progress-fill in-progress"
                              style={{
                                width: `${getStatusPercent(analyticsData.projectStatus?.inProgress)}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="analytics-status-item">
                          <div>
                            <span>Planning</span>
                            <strong>{analyticsData.projectStatus?.planning ?? 0}</strong>
                          </div>
                          <div className="analytics-progress">
                            <div
                              className="analytics-progress-fill planning"
                              style={{
                                width: `${getStatusPercent(analyticsData.projectStatus?.planning)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Member Contribution Breakdown */}
                      <div className="analytics-panel analytics-contributions-panel">
                        <div className="analytics-contributions-heading">
                          <div>
                            <h2>Member Contributions</h2>
                            <p>Track each member's contribution across your workspace.</p>
                          </div>
                          <span className="analytics-member-count">
                            {analyticsData.memberContributions?.length || 0} Members
                          </span>
                        </div>

                        <div className="analytics-member-grid">
                          {analyticsData.memberContributions?.length > 0 ? (
                            analyticsData.memberContributions.map((member) => (
                              <div className="analytics-member-card" key={member.userId}>
                                <div className="analytics-member-header">
                                  <div className="analytics-member-avatar">
                                    {(member.name || 'M').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <h3>{member.name}</h3>
                                    <span>Workspace Member</span>
                                  </div>
                                </div>

                                <div className="analytics-member-stats">
                                  <div>
                                    <span>📁</span>
                                    <strong>{member.projectsCreated}</strong>
                                    <small>Projects</small>
                                  </div>
                                  <div>
                                    <span>📎</span>
                                    <strong>{member.filesUploaded}</strong>
                                    <small>Files</small>
                                  </div>
                                  <div>
                                    <span>📝</span>
                                    <strong>{member.notesCreated}</strong>
                                    <small>Notes</small>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="analytics-empty">
                              No member contributions found yet.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="analytics-panel">
                        <h2>Recent Activity</h2>
                        <p>Latest updates in your workspace.</p>

                        <div className="analytics-activity-list">
                          {analyticsData.recentActivity?.length > 0 ? (
                            analyticsData.recentActivity.map((activity, index) => (
                              <div
                                className="analytics-activity-item"
                                key={activity.id || index}
                              >
                                <div className="analytics-activity-icon">
                                  {activity.type === 'file' ? '📎' : '📁'}
                                </div>

                                <div className="analytics-activity-info">
                                  <strong>{activity.title}</strong>
                                  <span>
                                    {activity.action} · {activity.project || 'Workspace'}
                                  </span>
                                  <small>
                                    {activity.actor ? `${activity.actor} · ` : ''}
                                    {activity.date
                                      ? new Date(activity.date).toLocaleString('en-IN', {
                                          dateStyle: 'medium',
                                          timeStyle: 'short',
                                        })
                                      : ''}
                                  </small>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="analytics-empty">No recent activity found.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="analytics-message">No analytics data available.</div>
                )}
              </section>
            ) : (
              /* ================= GENERIC PLACEHOLDER ================= */
              <section className="dashboard-module-page">
                <div className="dashboard-eyebrow">NARVIX WORKSPACE</div>

                <h1>{activePage}</h1>

                <div className="dashboard-stat-card">
                  <h2>{activePage}</h2>

                  <p>This section is ready for its feature implementation.</p>

                  <button
                    type="button"
                    className="dashboard-primary-button"
                    onClick={() => selectPage('Overview')}
                  >
                    ← Back to Overview
                  </button>
                </div>
              </section>
            ))}
        </section>
      </main>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {projectToDelete && (
        <div className="project-delete-overlay">
          <div className="project-delete-modal" role="alertdialog" aria-modal="true">
            <div className="delete-modal-icon">🗑️</div>
            <h2>Delete Project?</h2>
            <p>
              Are you sure you want to delete <strong>"{projectToDelete.title}"</strong>?
            </p>
            <p className="delete-modal-warning">
              This project will be permanently deleted. Any notes saved inside it will also be
              removed. This action cannot be undone.
            </p>
            {projectsError && <p className="projects-error-message">{projectsError}</p>}
            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-cancel-button"
                onClick={() => setProjectToDelete(null)}
                disabled={deletingProjectId === projectToDelete._id}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-button"
                onClick={confirmDeleteProject}
                disabled={deletingProjectId === projectToDelete._id}
              >
                {deletingProjectId === projectToDelete._id ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FILE PREVIEW MODAL ================= */}
      {previewFile && (
        <div
          className="file-preview-overlay"
          onClick={() => {
            URL.revokeObjectURL(previewFile.url);
            setPreviewFile(null);
          }}
        >
          <div
            className="file-preview-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="file-preview-header">
              <h2>{previewFile.originalName}</h2>

              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(previewFile.url);
                  setPreviewFile(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="file-preview-content">
              {previewFile.mimeType?.startsWith('image/') ? (
                <img src={previewFile.url} alt={previewFile.originalName} />
              ) : (
                <iframe src={previewFile.url} title={previewFile.originalName} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= FILE DELETE MODAL ================= */}
      {fileToDelete && (
        <div
          className="file-delete-overlay"
          onClick={() => {
            if (!deletingFileId) {
              setFileToDelete(null);
            }
          }}
        >
          <div
            className="file-delete-modal"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="file-delete-icon">🗑️</div>

            <span>DELETE FILE</span>

            <h2>Delete this file?</h2>

            <p>
              Are you sure you want to delete <strong>{fileToDelete.originalName}</strong>?
            </p>

            <p className="file-delete-warning">
              This file will be permanently deleted. This action cannot be undone.
            </p>

            <div className="file-delete-actions">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={deletingFileId === fileToDelete._id}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleDeleteFile(fileToDelete._id)}
                disabled={deletingFileId === fileToDelete._id}
              >
                {deletingFileId === fileToDelete._id ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;