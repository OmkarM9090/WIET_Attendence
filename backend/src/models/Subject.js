import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    code: {
      type: String,
      required: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    semester: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate subject per branch+semester
subjectSchema.index(
  { code: 1, branch: 1, semester: 1 },
  { unique: true }
);

export default mongoose.model("Subject", subjectSchema);
