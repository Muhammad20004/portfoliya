import { Router } from "express";

import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadAvatar,
} from "../controllers/users.controller.js";

import { requireAuth, requireRole } from "../middleware/auth.js";
import { avatarUpload } from "../middleware/upload.js";

const router = Router();

// create teacher (HEAD) or student (TEACHER)
router.post(
  "/",
  requireAuth,
  requireRole("HEAD", "TEACHER"),
  createUser
);

// list users: HEAD => all, TEACHER => own students
router.get(
  "/",
  requireAuth,
  requireRole("HEAD", "TEACHER"),
  listUsers
);

router.get("/:id", requireAuth, requireRole("HEAD", "TEACHER"), getUser);
router.put("/:id", requireAuth, requireRole("HEAD", "TEACHER"), updateUser);
router.delete("/:id", requireAuth, requireRole("HEAD", "TEACHER"), deleteUser);

// avatar upload (multer -> supabase)
router.post(
  "/:id/avatar",
  requireAuth,
  requireRole("HEAD", "TEACHER", "STUDENT"),
  avatarUpload.single("avatar"),
  uploadAvatar
);

export default router;
