import bcrypt from "bcryptjs";
import User from "../models/User.js";

export async function updateSocial(req, res) {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { github, linkedin, telegram, instagram, phone } = req.body;

  user.socialLinks = {
    github: github ?? user.socialLinks.github,
    linkedin: linkedin ?? user.socialLinks.linkedin,
    telegram: telegram ?? user.socialLinks.telegram,
    instagram: instagram ?? user.socialLinks.instagram,
    phone: phone ?? user.socialLinks.phone,
  };

  await user.save();

  return res.json({ socialLinks: user.socialLinks });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const ok = await bcrypt.compare(
    String(currentPassword),
    user.passwordHash
  );

  if (!ok) {
    return res.status(400).json({ message: "Joriy parol xato" });
  }

  user.passwordHash = await bcrypt.hash(
    String(newPassword),
    10
  );

  await user.save();

  return res.json({ message: "Parol yangilandi" });
}
