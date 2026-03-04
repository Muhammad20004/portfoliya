import { Router } from "express";

import { dashboardStats } from "../controllers/stats.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get(
  "/dashboard",
  requireAuth,
  requireRole("HEAD", "TEACHER"),
  dashboardStats
);

export default router;
