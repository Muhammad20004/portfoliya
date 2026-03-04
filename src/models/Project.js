import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["IMAGE", "FILE", "PRESENTATION"],
      required: true,
    },
    url: { type: String, required: true },
    path: { type: String, required: true },
    mime: { type: String, default: "" },
    size: { type: Number, default: 0 },
    originalName: { type: String, default: "" },
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    technologies: [{ type: String, trim: true }],
    year: { type: Number, default: null },
    group: { type: String, default: "" },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    media: { type: [MediaSchema], default: [] },
  },
  { timestamps: true }
);

ProjectSchema.index({
  title: "text",
  description: "text",
  technologies: "text",
});

const Project = mongoose.model("Project", ProjectSchema);

export default Project;
