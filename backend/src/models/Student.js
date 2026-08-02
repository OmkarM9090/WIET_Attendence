import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    rollNo: {
      type: Number,
      required: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    year: {
      type: Number,
      enum: [1, 2, 3, 4], // FE, SE, TE, BE
      required: true,
    },

    division: {
      type: String,
      enum: ["A", "B", "C"],
      required: true,
    },

    // Legacy single-batch field kept for backward compatibility.
    // Existing attendance, reports, and old migrations still read this field.
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: false,
    },

    // Practical Batches (array of Batch references)
    // New source-of-truth field for practical batch membership.
    // A student can belong to multiple batches over time or for different practicals.
    practicalBatches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
      },
    ],

    // Academic Year (e.g., "2024-2025")
    academicYear: {
      type: String,
      required: true,
    },

    // STUDENT STATUS TRACKING
    // active: Currently studying
    // dropout: Left college
    // transfer: Transferred to another division/branch
    status: {
      type: String,
      enum: ["active", "dropout", "transfer"],
      default: "active",
    },

    // LATE ADMISSION TRACKING
    // Students joining mid-semester
    admissionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    admissionYear: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },

    // Soft Delete fields
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

/**
 * INDEXES FOR QUERY PERFORMANCE
 */
studentSchema.index({ branch: 1, year: 1, division: 1, status: 1 });
studentSchema.index({ academicYear: 1, status: 1 });
studentSchema.index({ practicalBatches: 1 });
studentSchema.index(
  { branch: 1, admissionYear: 1, division: 1, rollNo: 1 },
  { unique: true, name: "unique_student_per_class" }
);

/**
 * VIRTUALS
 */
studentSchema.virtual("allBatches").get(function allBatches() {
  const batchIds = new Set();

  if (this.batch) {
    batchIds.add(String(this.batch));
  }

  if (Array.isArray(this.practicalBatches)) {
    this.practicalBatches.forEach((batchId) => {
      if (batchId) {
        batchIds.add(String(batchId));
      }
    });
  }

  return [...batchIds];
});

studentSchema.set("toJSON", { virtuals: true });
studentSchema.set("toObject", { virtuals: true });

/**
 * SCHEMA METHODS
 */

// Check if student is eligible for a specific attendance session
studentSchema.methods.isEligibleForSession = function(sessionDate) {
  // Dropout students are never eligible
  if (this.status === "dropout") {
    return false;
  }

  // Check if student was admitted before session date
  const session = new Date(sessionDate);
  const admission = new Date(this.admissionDate);

  return admission <= session;
};

export default mongoose.model("Student", studentSchema);

/**
 * WHY THESE STUDENT FIELDS?
 *
 * 1. LATE ADMISSION (admissionDate):
 *    - Students joining mid-semester
 *    - Example: Student joins on 15-Aug, lecture on 1-Aug -> exclude
 *    - Controller checks: student.admissionDate <= session.date
 *
 * 2. STATUS TRACKING:
 *    - active: Currently studying
 *    - dropout: Left college -> exclude from all calculations
 *    - transfer: Moved division/branch -> update records
 *
 * 3. DIVISION & BATCH CHANGES:
 *    - batch field can be updated mid-semester
 *    - practicalBatches supports multiple practical memberships
 *    - Historical attendance remains linked to student
 *    - New attendance uses updated batch membership
 *
 * 4. ACADEMIC YEAR:
 *    - Enables year-over-year tracking
 *    - "2024-2025" -> student was in FE during this year
 *    - Next year: "2025-2026" -> now in SE
 *
 * This handles real Mumbai University scenarios.
 */
