import mongoose from "mongoose";

const SocialLinksSchema = new mongoose.Schema(
  {
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    telegram: { type: String, default: "" },
    instagram: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    group: {
      type: String,
      default: "",
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["HEAD", "TEACHER", "STUDENT"],
      required: true,
    },

    avatarUrl: {
      type: String,
      default: "",
    },

    avatarPath: {
      type: String,
      default: "",
    },

    socialLinks: {
      type: SocialLinksSchema,
      default: () => ({}),
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
