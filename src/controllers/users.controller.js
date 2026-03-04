import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { makePath, uploadBuffer, removeFile } from "../utils/storage.js";

function canCreateRole(creatorRole, targetRole) {
  if (creatorRole === "HEAD" && targetRole === "TEACHER") return true;
  if (creatorRole === "TEACHER" && targetRole === "STUDENT") return true;
  return false;
}

export async function createUser(req, res) {
  const creator = req.user;
  const { firstName, lastName, group, username, password, role } = req.body;

  if (!canCreateRole(creator.role, role)) {
    return res
      .status(403)
      .json({ message: "Siz bu roldagi userni yarata olmaysiz" });
  }

  const exists = await User.findOne({
    username: String(username).toLowerCase(),
  });

  if (exists) {
    return res.status(409).json({ message: "Bu username band" });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  const user = await User.create({
    firstName,
    lastName,
    group: role === "STUDENT" ? (group || "") : "",
    username: String(username).toLowerCase(),
    passwordHash,
    role,
    createdBy: creator._id,
  });

  return res.status(201).json({
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    group: user.group,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });
}

export async function listUsers(req, res) {
  const { role, group, q } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (group) filter.group = group;

  if (q) {
    filter.$or = [
      { firstName: new RegExp(String(q), "i") },
      { lastName: new RegExp(String(q), "i") },
      { username: new RegExp(String(q), "i") },
      { group: new RegExp(String(q), "i") },
    ];
  }

  // TEACHER faqat o'zi yaratgan studentlarni ko'rsin
  if (req.user.role === "TEACHER") {
    filter.createdBy = req.user._id;
    filter.role = "STUDENT";
  }

  const users = await User.find(filter)
    .select("-passwordHash")
    .sort({ createdAt: -1 });

  return res.json({ items: users });
}

export async function getUser(req, res) {
  const user = await User.findById(req.params.id).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user });
}

export async function updateUser(req, res) {
  const { firstName, lastName, group, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // TEACHER faqat o'zi yaratgan STUDENT'ni tahrir qilsin
  if (req.user.role === "TEACHER") {
    if (
      String(user.createdBy) !== String(req.user._id) ||
      user.role !== "STUDENT"
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;

  if (group !== undefined && user.role === "STUDENT") {
    user.group = group;
  }

  if (isActive !== undefined && req.user.role === "HEAD") {
    user.isActive = Boolean(isActive);
  }

  await user.save();

  const fresh = await User.findById(user._id).select("-passwordHash");
  return res.json({ user: fresh });
}

export async function deleteUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // HEAD: teacher/student o'chira oladi; TEACHER faqat o'zi yaratgan student
  if (req.user.role === "TEACHER") {
    if (
      String(user.createdBy) !== String(req.user._id) ||
      user.role !== "STUDENT"
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  // Avatar file cleanup
  if (user.avatarPath) {
    const bucket = process.env.SUPABASE_BUCKET_AVATARS || "avatars";
    await removeFile({ bucket, filePath: user.avatarPath });
  }

  await user.deleteOne();
  return res.json({ message: "Deleted" });
}

export async function uploadAvatar(req, res) {
  const userId = req.params.id;

  const target = await User.findById(userId);
  if (!target) return res.status(404).json({ message: "User not found" });

  // ✅ STUDENT: faqat o'zini update qilsin
  if (req.user.role === "STUDENT" && String(req.user._id) !== String(target._id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // TEACHER: faqat o'zi yaratgan studentga avatar qo'yadi
  if (req.user.role === "TEACHER") {
    if (
      target.role !== "STUDENT" ||
      String(target.createdBy) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  if (!req.file) {
    return res.status(400).json({ message: "avatar file required" });
  }

  const bucket = process.env.SUPABASE_BUCKET_AVATARS || "avatars";
  const filePath = makePath(
    `users/${target._id}`,
    req.file.originalname,
    req.file.mimetype
  );

  const { publicUrl, path } = await uploadBuffer({
    bucket,
    filePath,
    buffer: req.file.buffer,
    contentType: req.file.mimetype,
  });

  // delete old
  if (target.avatarPath && target.avatarPath !== path) {
    await removeFile({ bucket, filePath: target.avatarPath });
  }

  target.avatarUrl = publicUrl;
  target.avatarPath = path;
  await target.save();

  return res.json({ avatarUrl: target.avatarUrl });
}

