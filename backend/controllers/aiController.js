import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Note from "../models/Note.js";
import Project from "../models/Project.js";

export const askGemini = async (req, res) => {
  try {
    const { prompt, conversationId } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid prompt",
      });
    }

    if (prompt.length > 8000) {
      return res.status(400).json({
        success: false,
        message: "Prompt is too long",
      });
    }

    let conversation = null;

    if (conversationId) {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversation ID",
        });
      }

      conversation = await Conversation.findOne({
        _id: conversationId,
        user: req.user.id,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt.trim(),
    });

    const answer = response.text?.trim();

    if (!answer) {
      return res.status(502).json({
        success: false,
        message: "Gemini returned an empty response",
      });
    }

    if (!conversation) {
      conversation = new Conversation({
        user: req.user.id,
        title: prompt.trim().replace(/\s+/g, " ").slice(0, 90),
        messages: [],
      });
    }

    conversation.messages.push({
      prompt: prompt.trim(),
      response: answer,
    });

    await conversation.save();

    const savedMessage = conversation.messages[conversation.messages.length - 1];

    return res.status(200).json({
      success: true,
      answer,
      conversationId: conversation._id,
      savedMessage,
      conversation,
    });

  } catch (error) {
    console.error("Gemini AI error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Unable to get a response from Gemini",
    });
  }
};

// Explain source code using Gemini
export const explainCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide code to explain",
      });
    }

    if (code.length > 12000) {
      return res.status(400).json({
        success: false,
        message: "Code is too long. Maximum 12000 characters allowed.",
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

    const prompt = `
You are a friendly programming mentor.
Explain this ${language || "programming"} code in simple English.

Keep the answer concise. Include:
1. What the code does
2. How it works (main steps)
3. Important concepts
4. One useful improvement if needed

Avoid unnecessary details.

Code:
${code}
`;

    const startTime = Date.now();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        maxOutputTokens: 1000,
        temperature: 0.3,
      },
    });

    console.log(`Gemini Code Explainer took ${(Date.now() - startTime) / 1000} seconds`);
    console.log("Gemini finish reason:", response.candidates?.[0]?.finishReason);
    console.log("Gemini output characters:", response.text?.length || 0);
    console.log("Gemini finish reason:", response.candidates?.[0]?.finishReason);
    console.log("Gemini output characters:", response.text?.length || 0);

    const explanation = response.text?.trim();

    if (!explanation) {
      return res.status(502).json({
        success: false,
        message: "Gemini returned an empty response",
      });
    }

    return res.status(200).json({
      success: true,
      explanation,
    });
  } catch (error) {
    console.error("Code explanation error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Unable to explain code right now",
    });
  }
};

// Generate technical documentation using Gemini
export const generateDocumentation = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide code for documentation",
      });
    }

    if (code.length > 12000) {
      return res.status(400).json({
        success: false,
        message: "Code is too long. Maximum 12000 characters allowed.",
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

    const prompt = `
You are a professional technical documentation writer.

Generate clear and well-structured technical documentation
for the following ${language || "programming"} code.

Include these sections:
1. Overview
2. Purpose of the code
3. Functions and their responsibilities
4. Important parameters and return values
5. How the code works
6. Dependencies or important concepts
7. Usage example, if possible

Use simple English and Markdown formatting.
Only describe functionality supported by the provided code.
Do not invent missing features.

Code:
${code}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        maxOutputTokens: 1500,
        temperature: 0.3,
      },
    });

    console.log("Documentation finish reason:", response.candidates?.[0]?.finishReason);
    console.log("Documentation prompt feedback:", response.promptFeedback);
    console.log("Documentation response text:", response.text);
    console.log("Documentation output length:", response.text?.length || 0);

    const documentation = (
      response.text ||
      response.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
    )?.trim();

    if (!documentation) {
      const candidate = response.candidates?.[0];

      const diagnosticMessage =
        `Gemini returned no text. ` +
        `Finish reason: ${candidate?.finishReason || "none"}. ` +
        `Finish message: ${candidate?.finishMessage || "none"}. ` +
        `Prompt block: ${response.promptFeedback?.blockReason || "none"}. ` +
        `Candidate count: ${response.candidates?.length || 0}.`;

      return res.status(502).json({
        success: false,
        message: diagnosticMessage,
      });
    }

    return res.status(200).json({
      success: true,
      documentation,
    });

  } catch (error) {
    console.error("Documentation generation error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Unable to generate documentation right now",
    });
  }
};


// Generate a project README using Gemini
export const generateReadme = async (req, res) => {
  try {
    const {
      projectName,
      description,
      techStack,
      features,
      installation,
    } = req.body;

    if (
      !projectName?.trim() ||
      !description?.trim() ||
      !techStack?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Project name, description and tech stack are required.",
      });
    }

    const fields = [projectName, description, techStack, features || "", installation || ""];
    if (fields.some((value) => typeof value !== "string")) {
      return res.status(400).json({
        success: false,
        message: "All README fields must be text.",
      });
    }

    if (fields.some((value) => value.length > 5000)) {
      return res.status(400).json({
        success: false,
        message: "Each field must be under 5000 characters.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured.",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert technical documentation writer.

Create a professional, accurate README.md using ONLY the project information supplied below.

PROJECT DETAILS
Project name: ${projectName}
Description: ${description}
Technology stack: ${techStack}
Features: ${features || "Not provided"}
Installation details: ${installation || "Not provided"}

STRICT ACCURACY RULES:
1. Never invent commands, file names, folders, scripts, URLs, repository links, environment variables, badges, versions, or features.
2. Never assume the project uses npm, yarn, Docker, Git, or any particular setup process unless explicitly provided.
3. If installation details are missing, write: "Installation instructions have not been provided yet."
4. If usage instructions are missing, write a short placeholder asking the project owner to add them.
5. Do not create fake clone commands or example commands that look executable.
6. Do not claim security, integrations, or functionality that is not explicitly listed.
7. Keep the documentation clear, useful, and professional.

Use these sections where relevant:
- Project title
- Project overview
- Features
- Technology stack
- Installation and setup
- Usage
- Contribution

Omit sections when there is not enough information, except installation and usage, where you should clearly state that details are not provided.

Return ONLY valid Markdown content for README.md. Do not add introductory text outside the README.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        maxOutputTokens: 2500,
        temperature: 0.3,
      },
    });

    const readme = (
      response.text ||
      response.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
    )?.trim();

    if (!readme) {
      return res.status(502).json({
        success: false,
        message: "Gemini returned an empty README. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      readme,
    });
  } catch (error) {
    console.error("README generation error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Unable to generate README right now.",
    });
  }
};


// Explain a project note using Gemini
export const explainNote = async (req, res) => {
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
    const userId = req.user.id;

    const hasAccess =
      project &&
      (
        project.owner.toString() === userId ||
        project.members.some(member => member.user.toString() === userId)
      );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this note",
      });
    }

    if (!note.content.trim()) {
      return res.status(400).json({
        success: false,
        message: "This note has no content to explain",
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

    const prompt = `
Explain the following project note in simple, beginner-friendly English.

STRICT FORMATTING RULES:
- Use clean Markdown formatting.
- Start with ## Main Idea, followed by one clear paragraph.
- Organize the remaining content under numbered headings such as ## 1. How It Works, ## 2. Important Features, and ## 3. Applications. Choose headings relevant to the actual note.
- Put a short explanatory paragraph directly below each heading.
- When a section contains multiple distinct points, use a numbered list (1., 2., 3.) instead of scattered bullet points.
- Keep each numbered point on its own line, with a clear and complete explanation.
- Use **bold** for important terms only.
- Avoid nested bullet lists and unnecessary subheadings.
- End with ## Short Summary and one concise paragraph.
- Do not add headings or sections that are irrelevant to the note.
- Do not invent facts or change the meaning of the original note.
- Do not repeat the same information in multiple sections.

Note title: ${note.title}

Note content:
${note.content}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        maxOutputTokens: 1500,
        temperature: 0.3,
      },
    });

    const explanation = response.text?.trim();

    if (!explanation) {
      return res.status(502).json({
        success: false,
        message: "Gemini returned an empty explanation",
      });
    }

    return res.status(200).json({
      success: true,
      explanation,
    });
  } catch (error) {
    console.error("Explain note error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Unable to explain this note right now",
    });
  }
};

// Improve a project note using Gemini
export const improveNote = async (req, res) => {
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
    const userId = req.user.id;

    const hasAccess =
      project &&
      (
        project.owner.toString() === userId ||
        project.members.some(member => member.user.toString() === userId)
      );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this note",
      });
    }

    if (!note.content.trim()) {
      return res.status(400).json({
        success: false,
        message: "This note has no content to improve",
      });
    }

    if (note.content.length > 12000) {
      return res.status(400).json({
        success: false,
        message: "Note is too long to improve",
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

    const prompt = `
Improve the following project note.
Fix grammar, spelling, clarity, and organization.
Preserve the original meaning and all technical facts.
Do not add unsupported information.
Return only the improved note content in Markdown.
Do not include an introduction or explanation.

Note title: ${note.title}

Original note:
${note.content}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        maxOutputTokens: 2000,
        temperature: 0.3,
      },
    });

    const improvedContent = response.text?.trim();

    if (!improvedContent) {
      return res.status(502).json({
        success: false,
        message: "Gemini returned empty improved content",
      });
    }

    return res.status(200).json({
      success: true,
      improvedContent,
    });
  } catch (error) {
    console.error("Improve note error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Unable to improve this note right now",
    });
  }
};
