import { Router } from "express";

import { requireAuth, requireRole } from "../middleware/auth.js";
import { projectUpload } from "../middleware/upload.js";

import {
  createProject,
  listPublicProjects,
  listMyProjects,
  listTeacherQueue,
  assignTeacher,
  getProject,
  listHeadQueue,
  reviewAndDecide,
  deleteProject,
} from "../controllers/projects.controller.js";

const router = Router();

// Public gallery
router.get("/public", listPublicProjects);

// Student
router.post(
  "/",
  requireAuth,
  requireRole("STUDENT"),
  projectUpload.fields([
    { name: "images", maxCount: 12 },
    { name: "files", maxCount: 12 },
    { name: "presentation", maxCount: 1 },
  ]),
  createProject
);

router.get("/me/list", requireAuth, requireRole("STUDENT"), listMyProjects);

// Teacher queue
router.get("/teacher/queue", requireAuth, requireRole("TEACHER"), listTeacherQueue);
router.post("/:id/decision", requireAuth, requireRole("TEACHER"), reviewAndDecide);
router.get("/head/queue", requireAuth, requireRole("HEAD"), listHeadQueue);

// Head assignment
router.post("/:projectId/assign", requireAuth, requireRole("HEAD"), assignTeacher);

// Delete
router.delete("/:id", requireAuth, requireRole("STUDENT", "TEACHER", "HEAD"), deleteProject);

// Project details: public if approved, else auth needed
router.get(
  "/:id",
  (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return next();
    return requireAuth(req, res, next);
  },
  getProject
);

export default router;
