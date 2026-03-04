import bcrypt from "bcryptjs";
import User from "../models/User.js";

/**
 * Creates a default HEAD user if none exists.
 * Defaults:
 *   username: head
 *   password: 123456
 *
 * You can override via env:
 *   HEAD_USERNAME, HEAD_PASSWORD, HEAD_FIRSTNAME, HEAD_LASTNAME
 */
export async function seedHeadIfNotExists() {
  const username = String(process.env.HEAD_USERNAME || "head").toLowerCase().trim();
  const password = String(process.env.HEAD_PASSWORD || "123456");

  // If a HEAD already exists (by role or username) do nothing
  const existing =
    (await User.findOne({ role: "HEAD" }).lean()) ||
    (await User.findOne({ username }).lean());

  if (existing) {
    console.log("✅ HEAD already exists:", existing.username);
    return;
  }

  const firstName = String(process.env.HEAD_FIRSTNAME || "Super").trim() || "Super";
  const lastName = String(process.env.HEAD_LASTNAME || "Admin").trim() || "Admin";

  const passwordHash = await bcrypt.hash(password, 10);

  const head = await User.create({
    firstName,
    lastName,
    group: "",
    username,
    passwordHash,
    role: "HEAD",
    createdBy: null,
    isActive: true,
    avatarUrl: "",
    avatarPath: "",
    socialLinks: {},
  });

  console.log("✅ HEAD created:", { id: String(head._id), username: head.username, password });
}
