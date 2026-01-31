// TeachingAssignment represents a single timetable slot for a teacher.
// It links teacher, subject, class details, and timing for a specific academic year.

import mongoose from "mongoose";

const teachingAssignmentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    branchId: {
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

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: function () {
        return this.sessionType === "PRACTICAL";
      },
      validate: {
        validator: function (value) {
          if (this.sessionType === "LECTURE") {
            return value == null;
          }
          return true;
        },
        message: "batchId is only allowed for PRACTICAL sessions.",
      },
    },

    dayOfWeek: {
      type: String,
      enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    sessionType: {
      type: String,
      enum: ["LECTURE", "PRACTICAL"],
      required: true,
    },

    academicYear: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/**
 * Prevent duplicate timetable slots for the same teacher/subject/class/time.
 */
teachingAssignmentSchema.index(
  {
    teacherId: 1,
    subjectId: 1,
    branchId: 1,
    year: 1,
    division: 1,
    batchId: 1,
    dayOfWeek: 1,
    startTime: 1,
    academicYear: 1,
  },
  { unique: true }
);

export default mongoose.model("TeachingAssignment", teachingAssignmentSchema);

// This schema is used to build a full timetable:
// One teacher can have multiple sessions across days.
// Practical sessions must be tied to a batch; lectures must not.