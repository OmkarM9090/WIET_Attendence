import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },

    // Academic Year (e.g., "2024-2025")
    academicYear: {
      type: String,
      required: true,
    },

    // Semester (1-8 for engineering)
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },

    // Session type: LECTURE, PRACTICAL, or LAB
    sessionType: {
      type: String,
      enum: ["LECTURE", "PRACTICAL", "LAB"],
      required: true,
    },

    // Batch: Required only for PRACTICAL/LAB sessions
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: function () {
        return ["PRACTICAL", "LAB"].includes(this.sessionType);
      },
    },

    // TEACHER ASSIGNMENT LOGIC
    // assignedTeacher: The timetable teacher (who should take this lecture)
    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // teacher: The actual teacher who took this lecture
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // SUBSTITUTE TEACHER LOGIC
    // If teacher !== assignedTeacher, it's a substitute
    isSubstitute: {
      type: Boolean,
      default: false,
    },

    substituteReason: {
      type: String,
      trim: true,
    },

    // EXTRA LECTURE LOGIC
    // Compensation lectures outside regular timetable
    isExtraLecture: {
      type: Boolean,
      default: false,
    },

    extraLectureReason: {
      type: String,
      trim: true,
    },

    // CANCELLED LECTURE LOGIC
    // Holidays, unexpected cancellations
    isCancelled: {
      type: Boolean,
      default: false,
    },

    cancelReason: {
      type: String,
      trim: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    // Link to timetable assignment (for duplicate prevention and reporting)
    teachingAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeachingAssignment",
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

    // AUDIT TRAIL
    // Track who created this attendance session
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // LOCK MECHANISM
    // Once locked, attendance cannot be modified
    isLocked: {
      type: Boolean,
      default: false,
    },

    // Soft Delete fields
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

/**
 * INDEXES FOR PERFORMANCE & DUPLICATE PREVENTION
 * 
 * Prevent duplicate attendance for same lecture
 * Includes academicYear and semester to handle year transitions
 * 
 * NOTE: We allow multiple sessions on same date if:
 * - Different sessionType (LECTURE vs PRACTICAL)
 * - Different batch (for practicals)
 * - isExtraLecture = true (compensation lectures)
 */
attendanceSessionSchema.index(
  { 
    date: 1, 
    subject: 1, 
    branch: 1, 
    year: 1, 
    division: 1, 
    academicYear: 1,
    semester: 1,
    sessionType: 1,
    batch: 1,
    isExtraLecture: 1
  },
  { 
    unique: true,
    partialFilterExpression: { isCancelled: false } // Cancelled lectures don't prevent new sessions
  }
);

/**
 * SCHEMA METHODS
 */

// Check if current user is authorized to take this lecture
attendanceSessionSchema.methods.isAuthorized = function(userId) {
  // Assigned teacher can always take the lecture
  if (this.assignedTeacher.toString() === userId.toString()) {
    return { authorized: true, isSubstitute: false };
  }
  
  // Substitute teacher needs a reason
  if (this.substituteReason && this.substituteReason.trim()) {
    return { authorized: true, isSubstitute: true };
  }
  
  return { authorized: false, isSubstitute: false };
};

export default mongoose.model(
  "AttendanceSession",
  attendanceSessionSchema
);

/**
 * WHY THIS ENHANCED SCHEMA?
 * 
 * 1. SUBSTITUTE TEACHERS:
 *    - assignedTeacher = timetable teacher
 *    - teacher = actual teacher who took lecture
 *    - isSubstitute = true if teacher !== assignedTeacher
 *    - substituteReason = mandatory for substitutes
 * 
 * 2. EXTRA LECTURES:
 *    - isExtraLecture = true for compensation lectures
 *    - extraLectureReason = why this extra lecture
 *    - Allows multiple sessions on same day
 * 
 * 3. CANCELLED LECTURES:
 *    - isCancelled = true
 *    - cancelReason = holiday, teacher absent, etc.
 *    - Excluded from attendance percentage calculations
 * 
 * 4. ACADEMIC YEAR & SEMESTER:
 *    - academicYear = "2024-2025"
 *    - semester = 1-8
 *    - Enables year-over-year tracking
 *    - Semester boundaries prevent out-of-range attendance
 * 
 * 5. LATE ADMISSION STUDENTS:
 *    - Handled in controller by checking student.admissionDate
 *    - Students admitted after session date are excluded
 * 
 * 6. AUDIT & LOCK:
 *    - createdBy = tracks who created this session
 *    - isLocked = prevents modifications after lock
 * 
 * This is a production-ready schema for Mumbai University colleges.
 */