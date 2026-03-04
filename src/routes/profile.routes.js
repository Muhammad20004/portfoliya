import { Router } from "express";

import {
  requireAuth,
  requireRole
} from "../middleware/auth.js";

import {
  updateSocial,
  changePassword
} from "../controllers/profile.controller.js";

const router = Router();

router.put("/social", requireAuth, requireRole("STUDENT"), updateSocial);
router.put("/password", requireAuth, changePassword);

export default router;
