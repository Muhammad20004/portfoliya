import Project from "../models/project.js";
import Review from "../models/review.js";
import User from "../models/user.js";

import { makePath, uploadBuffer, removeFile } from "../utils/storage.js";

function parseTech(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(String).map((s) => s.trim()).filter(Boolean);
  }
  // allow CSV
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createProject(req, res) {
  // STUDENT only
  const student = req.user;

  const { title, description, githubUrl, technologies, year } = req.body;
  const tech = parseTech(technologies);

  const project = await Project.create({
    student: student._id,
    title,
    description,
    githubUrl,
    technologies: tech,
    year: year ? Number(year) : null,
    group: student.group || "",
    status: "PENDING",
  });

  const bucket = process.env.SUPABASE_BUCKET_PROJECTS || "projects";

  const uploaded = [];

  // fields:
  // images (image/*)   - multiple
  // files  (any)       - multiple
  // presentation       - single file
  const images = req.files?.images || [];
  const files = req.files?.files || [];
  const presentation = req.files?.presentation || [];

  for (const f of images) {
    const filePath = makePath(
      `projects/${project._id}/images`,
      f.originalname,
      f.mimetype
    );

    const { publicUrl, path } = await uploadBuffer({
      bucket,
      filePath,
      buffer: f.buffer,
      contentType: f.mimetype,
    });

    uploaded.push({
      kind: "IMAGE",
      url: publicUrl,
      path,
      mime: f.mimetype,
      size: f.size,
      originalName: f.originalname,
    });
  }

  for (const f of files) {
    const filePath = makePath(
      `projects/${project._id}/files`,
      f.originalname,
      f.mimetype
    );

    const { publicUrl, path } = await uploadBuffer({
      bucket,
      filePath,
      buffer: f.buffer,
      contentType: f.mimetype,
    });

    uploaded.push({
      kind: "FILE",
      url: publicUrl,
      path,
      mime: f.mimetype,
      size: f.size,
      originalName: f.originalname,
    });
  }

  for (const f of presentation) {
    const filePath = makePath(
      `projects/${project._id}/presentation`,
      f.originalname,
      f.mimetype
    );

    const { publicUrl, path } = await uploadBuffer({
      bucket,
      filePath,
      buffer: f.buffer,
      contentType: f.mimetype,
    });

    uploaded.push({
      kind: "PRESENTATION",
      url: publicUrl,
      path,
      mime: f.mimetype,
      size: f.size,
      originalName: f.originalname,
    });
  }

  project.media = uploaded;
  await project.save();

  return res.status(201).json({ project });
}

export async function listPublicProjects(req, res) {
  const { group, year, tech, q, page = 1, limit = 12 } = req.query;

  const filter = { status: "APPROVED" };
  if (group) filter.group = String(group);
  if (year) filter.year = Number(year);
  if (tech) filter.technologies = { $in: [String(tech)] };

  let query = Project.find(filter)
    .populate("student", "firstName lastName group avatarUrl socialLinks")
    .sort({ createdAt: -1 });

  if (q) {
    query = Project.find({
      ...filter,
      $text: { $search: String(q) },
    })
      .populate("student", "firstName lastName group avatarUrl socialLinks")
      .sort({ score: { $meta: "textScore" }, createdAt: -1 });
  }

  const p = Math.max(1, Number(page));
  const l = Math.min(50, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    query.skip((p - 1) * l).limit(l),
    Project.countDocuments(
      q ? { ...filter, $text: { $search: String(q) } } : filter
    ),
  ]);

  return res.json({ items, page: p, limit: l, total });
}

export async function listMyProjects(req, res) {
  const student = req.user;
  const items = await Project.find({ student: student._id }).sort({
    createdAt: -1,
  });
  return res.json({ items });
}

export async function listTeacherQueue(req, res) {
  // TEACHER: faqat o'ziga biriktirilgan
  const filter = { assignedTeacher: req.user._id };

  const { status } = req.query;
  if (status) filter.status = status;

  const items = await Project.find(filter)
    .populate("student", "firstName lastName group avatarUrl")
    .sort({ createdAt: -1 });

  return res.json({ items });
}

export async function listHeadQueue(req, res) {
  // HEAD: hali tasdiqlanmagan loyihalar (default: PENDING)
  const {
    status = "PENDING", // PENDING | REJECTED
    group,
    year,
    q,
    assigned, // "true" | "false"
    teacherId,
    page = 1,
    limit = 20,
  } = req.query;

  const allowed = ["PENDING", "REJECTED"];
  const filter = {};

  if (status) {
    if (!allowed.includes(String(status))) {
      return res.status(400).json({ message: "status must be PENDING or REJECTED" });
    }
    filter.status = String(status);
  }

  if (group) filter.group = String(group);
  if (year) filter.year = Number(year);

  if (teacherId) filter.assignedTeacher = teacherId;
  if (assigned === "true") filter.assignedTeacher = { $ne: null };
  if (assigned === "false") filter.assignedTeacher = null;

  let query = Project.find(filter)
    .populate("student", "firstName lastName group avatarUrl")
    .populate("assignedTeacher", "firstName lastName avatarUrl")
    .sort({ createdAt: -1 });

  if (q) {
    query = Project.find({ ...filter, $text: { $search: String(q) } })
      .populate("student", "firstName lastName group avatarUrl")
      .populate("assignedTeacher", "firstName lastName avatarUrl")
      .sort({ score: { $meta: "textScore" }, createdAt: -1 });
  }

  const p = Math.max(1, Number(page));
  const l = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    query.skip((p - 1) * l).limit(l),
    Project.countDocuments(q ? { ...filter, $text: { $search: String(q) } } : filter),
  ]);

  return res.json({ items, page: p, limit: l, total });
}

export async function assignTeacher(req, res) {
  // HEAD only
  const { projectId } = req.params;
  const { teacherId } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  // ✅ SHU YERGA QO'YASAN
  if (project.status === "APPROVED") {
    return res
      .status(400)
      .json({ message: "Approved projectga teacher biriktirib bo'lmaydi" });
  }

  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== "TEACHER") {
    return res.status(400).json({ message: "Invalid teacher" });
  }

  project.assignedTeacher = teacher._id;
  await project.save();

  return res.json({ project });
}

export async function getProject(req, res) {
  const project = await Project.findById(req.params.id)
    .populate("student", "firstName lastName group avatarUrl socialLinks")
    .populate("assignedTeacher", "firstName lastName avatarUrl");

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  // Access rules:
  // - Public: only approved
  // - Student: own projects
  // - Teacher: assignedTeacher projects
  // - Head: all
  if (project.status !== "APPROVED") {
    if (!req.user) return res.status(403).json({ message: "Forbidden" });

    if (
      req.user.role === "STUDENT" &&
      String(project.student?._id) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (
      req.user.role === "TEACHER" &&
      String(project.assignedTeacher?._id) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  const reviews = await Review.find({ project: project._id })
    .populate("teacher", "firstName lastName avatarUrl")
    .sort({ createdAt: -1 });

  // similar projects: same tech or same group
  const simFilter = {
    _id: { $ne: project._id },
    status: "APPROVED",
    $or: [
      { group: project.group },
      { technologies: { $in: project.technologies.slice(0, 3) } },
    ],
  };

  const similar = await Project.find(simFilter)
    .limit(6)
    .sort({ createdAt: -1 });

  return res.json({ project, reviews, similar });
}

export async function reviewAndDecide(req, res) {
  // TEACHER only, assignedTeacher required
  const { id } = req.params;
  const { status, comment, recommendations, score } = req.body;

  const project = await Project.findById(id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  if (String(project.assignedTeacher) !== String(req.user._id)) {
    return res.status(403).json({ message: "Bu loyiha sizga biriktirilmagan" });
  }

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ message: "status must be APPROVED or REJECTED" });
  }

  project.status = status;
  await project.save();

  const up = {
    project: project._id,
    teacher: req.user._id,
    comment: comment || "",
    recommendations: recommendations || "",
    score:
      score === null || score === undefined || score === ""
        ? null
        : Number(score),
  };

  const review = await Review.findOneAndUpdate(
    { project: project._id, teacher: req.user._id },
    { $set: up },
    { upsert: true, new: true }
  );

  return res.json({ project, review });
}

export async function deleteProject(req, res) {
  // STUDENT can delete own if pending/rejected, TEACHER/HEAD can delete
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  if (req.user.role === "STUDENT") {
    if (String(project.student) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (project.status === "APPROVED") {
      return res.status(400).json({
        message: "Approved project cannot be deleted by student",
      });
    }
  }

  const bucket = process.env.SUPABASE_BUCKET_PROJECTS || "projects";

  for (const m of project.media || []) {
    await removeFile({ bucket, filePath: m.path });
  }

  await Review.deleteMany({ project: project._id });
  await project.deleteOne();

  return res.json({ message: "Deleted" });
}
