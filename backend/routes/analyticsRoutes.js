import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getWorkspaceAnalytics } from "../controllers/analyticsController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getWorkspaceAnalytics);

export default router;