import bcrypt from "bcryptjs";

import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";

import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

function parseExpiresToDate(expiresIn) {
  // '30d', '15m', '12h' kabi qiymatlar
  const n = parseInt(expiresIn, 10);
  const unit = String(expiresIn).slice(-1);

  const ms =
    unit === "d"
      ? n * 24 * 60 * 60 * 1000
      : unit === "h"
      ? n * 60 * 60 * 1000
      : n * 60 * 1000;

  return new Date(Date.now() + ms);
}

export async function login(req, res) {
  const { username, password } = req.body;

  const user = await User.findOne({
    username: String(username).toLowerCase(),
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Login yoki parol xato" });
  }

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Login yoki parol xato" });
  }

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    sub: user._id.toString(),
    role: user.role,
  });

  const expiresAt = parseExpiresToDate(
    process.env.JWT_REFRESH_EXPIRES_IN || "30d"
  );

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt,
  });

  return res.json({
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      group: user.group,
      username: user.username,
      avatarUrl: user.avatarUrl,
    },
  });
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "refreshToken required" });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const saved = await RefreshToken.findOne({
    token: refreshToken,
    isRevoked: false,
  });

  if (!saved) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const newAccessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  return res.json({ accessToken: newAccessToken, refreshToken });
}

export async function logout(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "refreshToken required" });
  }

  await RefreshToken.updateOne(
    { token: refreshToken },
    { $set: { isRevoked: true } }
  );

  return res.json({ message: "Logged out" });
}

export async function me(req, res) {
  return res.json({ user: req.user });
}
