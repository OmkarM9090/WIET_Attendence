// This schema defines WHO teaches WHAT WHERE.

import mongoose from "mongoose";

const teachingAssignmentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    year: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
    },

    division: {
      type: String,
      enum: ["A", "B", "C"],
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Prevent duplicate assignments
 */
teachingAssignmentSchema.index(
  { teacher: 1, subject: 1, branch: 1, year: 1, division: 1 },
  { unique: true }
);

export default mongoose.model(
  "TeachingAssignment",
  teachingAssignmentSchema
);


// Why this schema is powerful
// One teacher → many classes
// One subject → many divisions
// Fully flexible
// No duplication