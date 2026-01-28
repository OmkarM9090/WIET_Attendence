import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },

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
      required: true,
    },

    division: {
      type: String,
      required: true,
    },

    // Academic Year (e.g., "2024-2025")
    academicYear: {
      type: String,
      required: true,
    },

    sessionType: {
      type: String,
      enum: ["LECTURE", "PRACTICAL"],
      required: true,
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: function () {
        return this.sessionType === "PRACTICAL";
      },
    },
  
    absentStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    totalStudents: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Prevent duplicate attendance for same lecture
 * Includes academicYear to handle year transitions
 */
attendanceSessionSchema.index(
  { date: 1, subject: 1, branch: 1, year: 1, division: 1, academicYear: 1 },
  { unique: true }
);

export default mongoose.model(
  "AttendanceSession",
  attendanceSessionSchema
);
// Why this schema?
// Each lecture has one attendance session
// Each session links to absent students
// Easy to query attendance records

/*/WHY THIS SCHEMA IS CORRECT

One document = one lecture

Absentees list = efficient

Present = derived (total − absent)

Index prevents double marking

This is exactly how attendance systems work.*/