import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
    },

    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Indexes (VERY IMPORTANT)
 * This prevents duplicate subjects for same branch & semester
 */
subjectSchema.index(
  { code: 1, branch: 1, semester: 1 },
  { unique: true }
);

export default mongoose.model("Subject", subjectSchema);
