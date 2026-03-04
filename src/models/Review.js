import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    comment: {
      type: String,
      default: "",
    },

    recommendations: {
      type: String,
      default: "",
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
  },
  { timestamps: true }
);

// 1 teacher → 1 project only 1 review
ReviewSchema.index(
  { project: 1, teacher: 1 },
  { unique: true }
);

const Review = mongoose.model("Review", ReviewSchema);

export default Review;
