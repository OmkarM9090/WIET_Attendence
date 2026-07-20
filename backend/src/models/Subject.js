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

    // NEP 2020 vs REV-C SCHEME SUPPORT
    // Mumbai University transitioned from Rev-C to NEP 2020
    scheme: {
      type: String,
      enum: ["NEP2020", "REV-C", "OTHER"],
      default: "NEP2020",
    },

    // CREDIT HOURS
    // NEP 2020: Credit-based system
    // Rev-C: Traditional system
    credits: {
      type: Number,
      min: 1,
      max: 6,
      default: 4,
    },

    // SEMESTER BOUNDARIES
    // Attendance should only be marked within semester dates
    semesterStartDate: {
      type: Date,
      required: true,
    },

    semesterEndDate: {
      type: Date,
      required: true,
    },

    // ACTIVE STATUS
    // Subjects can be discontinued or replaced
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Soft Delete fields
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

/**
 * CASCADE DELETE HOOKS
 * Hard deletion: When a subject is permanently deleted, clean up references.
 */
subjectSchema.pre("findOneAndDelete", async function (next) {
  const subjectId = this.getQuery()["_id"];
  if (subjectId) {
    try {
      const TeachingAssignment = mongoose.model("TeachingAssignment");
      const AttendanceSession = mongoose.model("AttendanceSession");

      console.log(`[CASCADE] Hard deleting records for Subject: ${subjectId}`);
      
      await TeachingAssignment.deleteMany({ subject: subjectId });
      await AttendanceSession.deleteMany({ subject: subjectId });
    } catch (err) {
      console.error(`[CASCADE ERROR] Failed to cascade delete for Subject: ${subjectId}`, err);
    }
  }
  next();
});

/**
 * INDEXES (VERY IMPORTANT)
 * This prevents duplicate subjects for same branch & semester
 */
subjectSchema.index(
  { code: 1, branch: 1, semester: 1, scheme: 1 },
  { unique: true }
);

/**
 * SCHEMA METHODS
 */

// Check if a date falls within semester boundaries
subjectSchema.methods.isWithinSemester = function(date) {
  const checkDate = new Date(date);
  const startDate = new Date(this.semesterStartDate);
  const endDate = new Date(this.semesterEndDate);
  
  return checkDate >= startDate && checkDate <= endDate;
};

// Check if subject is currently active
subjectSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  const endDate = new Date(this.semesterEndDate);
  
  return this.isActive && now <= endDate;
};

export default mongoose.model("Subject", subjectSchema);

/**
 * WHY THESE SUBJECT FIELDS?
 * 
 * 1. SCHEME (NEP2020 / REV-C):
 *    - Mumbai University uses both schemes
 *    - NEP 2020: New credit-based system (2020 onwards)
 *    - Rev-C: Traditional scheme (before 2020)
 *    - Same subject code can exist in both schemes
 * 
 * 2. CREDITS:
 *    - NEP 2020 uses credit hours
 *    - Affects workload calculation
 *    - Theory: 3-4 credits, Practical: 2 credits
 * 
 * 3. SEMESTER BOUNDARIES (semesterStartDate, semesterEndDate):
 *    - Odd Semester: June-November
 *    - Even Semester: December-May
 *    - Controller validates: session.date must be within boundaries
 *    - Prevents backdated attendance beyond semester
 * 
 * 4. SUBJECT CHANGES MID-SEMESTER:
 *    - isActive = false → subject discontinued
 *    - Historical data preserved
 *    - New subjects added with isActive = true
 * 
 * 5. MULTIPLE TEACHERS PER SUBJECT:
 *    - Handled in TeachingAssignment model (separate)
 *    - Theory teacher vs Practical teacher
 *    - Subject schema remains simple
 * 
 * This aligns with Mumbai University (WIET) requirements.
 */
