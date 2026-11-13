import AIHistory from "../models/AIHistory.js";

export const saveToolHistory = async (req, res) => {
  try {
    const { toolType, title, inputCode, language, output } = req.body;

    if (!toolType || !title || !output) {
      return res.status(400).json({
        success: false,
        message: "Tool type, title and output are required.",
      });
    }

    const history = await AIHistory.create({
      user: req.user.id,
      toolType,
      title,
      inputCode,
      language,
      output,
    });

    res.status(201).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getToolHistory = async (req, res) => {
  try {
    const { toolType } = req.query;
    const filter = { user: req.user.id };

    if (toolType) filter.toolType = toolType;

    const history = await AIHistory.find(filter).sort({ updatedAt: -1 });

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteToolHistory = async (req, res) => {
  try {
    const history = await AIHistory.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        message: "History not found.",
      });
    }

    res.json({ success: true, message: "History deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
