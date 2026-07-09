import mongoose from "mongoose";
import AttendanceSession from "../models/AttendanceSession.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import Branch from "../models/Branch.js";
import User from "../models/User.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import { validateAttendanceDate } from "../utils/dateValidator.js";
import { generateDailyReport } from "../services/reportGenerator.js";
import { updateMonthlyAttendanceExcel } from "../utils/updateMonthlyAttendanceExcel.js";
import { parseAttendanceExcel } from "../utils/excelParser.js";

/**
 * FORMAT WHATSAPP ATTENDANCE MESSAGE
 * Generates a formatted attendance report for WhatsApp
 */
const generateWhatsAppMessage = (
  institution,
  className,
  subjectName,
  date,
  sessionType,
  teacherName,
  absentStudents
) => {
  // Format date as "Fri, 30 Jan, 2026"
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Build the message
  let message = `${institution}\nDaily Attendance Report\n\n`;
  message += `Class: ${className}\n`;
  message += `Subject: ${subjectName}\n`;
  message += `Date: ${formattedDate}\n`;
  message += `Session Type: ${sessionType}\n`;
  message += `Subject Teacher: ${teacherName}\n`;

  // Add absent students section
  if (absentStudents.length > 0) {
    message += `\nAbsent Students:\n`;
    message += `Roll No | Name\n`;
    message += `------- | -----\n`;
    
    absentStudents.forEach((student) => {
      message += `${student.rollNo} | ${student.name}\n`;
    });
  } else {
    message += `\nAbsent Students: None (All Present)\n`;
  }

  return message;
};

/**
 * CREATE ATTENDANCE SESSION
 * Teacher only
 * Generates WhatsApp-ready attendance report message
 * 
 * ENHANCED WITH:
 * - Substitute teacher logic
 * - Extra lecture logic
 * - Cancelled lecture logic
 * - Semester boundary validation
 * - Late admission student handling
 * - Academic year & semester filtering
 */
export const createAttendance = async (req, res) => {
  try {
    const {
      date,
      subjectId,
      branchId,
      year,
      division,
      academicYear,       // Required: "2024-2025"
      semester,           // Required: 1-8
      sessionType,        // Required: LECTURE | PRACTICAL
      batch,              // Required only for PRACTICAL
      assignedTeacherId,  // Who should take this lecture (timetable)
      isSubstitute,       // Is this a substitute?
      substituteReason,   // Required if isSubstitute = true
      isExtraLecture,     // Is this compensation lecture?
      extraLectureReason, // Required if isExtraLecture = true
      isCancelled,        // Is this lecture cancelled?
      cancelReason,       // Required if isCancelled = true
      absentStudentIds
    } = req.body;

    const teacherId = req.user.id; // Actual teacher taking the lecture

    // ============ 1. VALIDATE REQUIRED FIELDS ============
    if (!date || !subjectId || !branchId || !year || !division || !sessionType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: date, subjectId, branchId, year, division, sessionType"
      });
    }

    // Validate academicYear
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: "Academic Year is required (e.g., '2024-2025')"
      });
    }

    // Validate semester
    if (!semester || semester < 1 || semester > 8) {
      return res.status(400).json({
        success: false,
        message: "Semester is required (1-8)"
      });
    }

    // ============ 2. VALIDATE SESSION TYPE & BATCH ============
    if (sessionType === "PRACTICAL" && !batch) {
      return res.status(400).json({
        success: false,
        message: "Batch is required for practical session"
      });
    }

    if (sessionType === "LECTURE" && batch) {
      return res.status(400).json({
        success: false,
        message: "Batch should not be sent for lecture"
      });
    }

    // ============ 3. VALIDATE CANCELLED LECTURE ============
    if (isCancelled) {
      if (!cancelReason || !cancelReason.trim()) {
        return res.status(400).json({
          success: false,
          message: "Cancel reason is required for cancelled lectures"
        });
      }

      // For cancelled lectures, we create the record but don't count students
      const cancelledSession = await AttendanceSession.create({
        date,
        academicYear,
        semester,
        sessionType,
        batch: sessionType === "PRACTICAL" ? batch : null,
        assignedTeacher: assignedTeacherId || teacherId,
        teacher: teacherId,
        isSubstitute: false,
        isExtraLecture: isExtraLecture || false,
        extraLectureReason: extraLectureReason || null,
        isCancelled: true,
        cancelReason,
        subject: subjectId,
        branch: branchId,
        year,
        division,
        absentStudents: [],
        totalStudents: 0,
        createdBy: teacherId,
        isLocked: false
      });

      return res.status(201).json({
        success: true,
        message: "Cancelled lecture recorded",
        data: cancelledSession
      });
    }

    // ============ 4. PERMISSION & SUBSTITUTE LOGIC ============
    const effectiveAssignedTeacher = assignedTeacherId || teacherId;
    let isActualSubstitute = false;
    
    // Check if teacher is taking someone else's lecture
    if (teacherId.toString() !== effectiveAssignedTeacher.toString()) {
      isActualSubstitute = true;
      
      // Substitute must provide reason
      if (!substituteReason || !substituteReason.trim()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to take this lecture. Substitute reason is required."
        });
      }
    }

    // ============ 5. VALIDATE EXTRA LECTURE REASON ============
    if (isExtraLecture && (!extraLectureReason || !extraLectureReason.trim())) {
      return res.status(400).json({
        success: false,
        message: "Extra lecture reason is required for compensation lectures"
      });
    }

    // ============ 6. VALIDATE DATE (NO FUTURE ATTENDANCE) ============
    const getLocalDateString = (value) => {
      const d = new Date(value);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const inputDateStr = getLocalDateString(date);
    const todayStr = getLocalDateString(new Date());

    if (inputDateStr > todayStr) {
      return res.status(400).json({
        success: false,
        message: "Cannot mark attendance for future dates"
      });
    }

    // ============ 7. FETCH & VALIDATE SUBJECT ============
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    // ============ 8. VALIDATE SEMESTER BOUNDARIES ============
    // Check if attendance date falls within semester start/end dates
    if (!subject.isWithinSemester(date)) {
      return res.status(400).json({
        success: false,
        message: `Attendance date must be between ${subject.semesterStartDate.toDateString()} and ${subject.semesterEndDate.toDateString()}`
      });
    }

    // Check if subject is active
    if (!subject.isCurrentlyActive()) {
      return res.status(400).json({
        success: false,
        message: "Subject is no longer active"
      });
    }

    // ============ 9. FETCH TEACHER & BRANCH INFO ============
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found"
      });
    }

    // ============ 10. COUNT ELIGIBLE STUDENTS (LATE ADMISSION LOGIC) ============
    const normalizeAcademicYear = (value) => {
      if (!value) return value;
      const trimmed = String(value).trim();
      const parts = trimmed.split("-");
      if (parts.length === 2 && parts[0].length === 4 && parts[1].length === 2) {
        return `${parts[0]}-20${parts[1]}`;
      }
      return trimmed;
    };

    const normalizedAcademicYear = normalizeAcademicYear(academicYear);
    
    const studentFilter = {
      branch: mongoose.Types.ObjectId.isValid(branchId)
        ? new mongoose.Types.ObjectId(branchId)
        : branchId,
      year: parseInt(year),
      division,
      status: "active" // Only active students
    };

    // Filter by academic year
    if (normalizedAcademicYear) {
      studentFilter.$or = [
        { academicYear: normalizedAcademicYear },
        { academicYear: academicYear },
        { academicYear: { $exists: false } }
      ];
    }

    // Filter by batch for practicals
    if (sessionType === "PRACTICAL") {
      studentFilter.batch = batch;
    }

    // LATE ADMISSION LOGIC: Exclude students whose admission date > session date
    const sessionDate = new Date(date);
    studentFilter.admissionDate = { $lte: sessionDate };

    const totalStudents = await Student.countDocuments(studentFilter);

    if (totalStudents === 0) {
      return res.status(400).json({
        success: false,
        message: "No eligible students found for this session (check active status, late admissions, and batch)"
      });
    }

    // ============ 11. FETCH ABSENT STUDENT DETAILS ============
    let absentStudentsDetails = [];
    if (absentStudentIds && absentStudentIds.length > 0) {
      absentStudentsDetails = await Student.find({
        _id: { $in: absentStudentIds }
      }).populate("userId", "name");
    }

    // ============ 12. GENERATE WHATSAPP MESSAGE ============
    const className = `${branch.name} ${year}-${division}${sessionType === "PRACTICAL" ? ` (Batch ${batch})` : ""}`;
    const institution = "Watumull College Of Engineering And Technology";
    
    const absentForMessage = absentStudentsDetails.map((student) => ({
      rollNo: student.rollNo,
      name: student.userId?.name || "N/A"
    }));

    let whatsappText = generateWhatsAppMessage(
      institution,
      className,
      subject.name,
      date,
      sessionType,
      teacher.name,
      absentForMessage
    );

    // Add substitute/extra lecture info to WhatsApp message
    if (isActualSubstitute) {
      whatsappText += `\n⚠️ Substitute Teacher: ${teacher.name}\nReason: ${substituteReason}`;
    }
    if (isExtraLecture) {
      whatsappText += `\n📚 Extra Lecture\nReason: ${extraLectureReason}`;
    }

    // ============ 13. CREATE ATTENDANCE SESSION ============
    const attendance = await AttendanceSession.create({
      date,
      academicYear,
      semester,
      sessionType,
      batch: sessionType === "PRACTICAL" ? batch : null,
      assignedTeacher: effectiveAssignedTeacher,
      teacher: teacherId,
      isSubstitute: isActualSubstitute,
      substituteReason: isActualSubstitute ? substituteReason : null,
      isExtraLecture: isExtraLecture || false,
      extraLectureReason: isExtraLecture ? extraLectureReason : null,
      isCancelled: false,
      cancelReason: null,
      subject: subjectId,
      branch: branchId,
      year,
      division,
      absentStudents: absentStudentIds || [],
      totalStudents,
      createdBy: teacherId,
      isLocked: false
    });

    // ============ 14. RETURN RESPONSE WITH WHATSAPP MESSAGE ============
    res.status(201).json({
      success: true,
      message: "Attendance saved successfully",
      data: {
        ...attendance.toObject(),
        whatsappText // Include the formatted WhatsApp message
      }
    });

  } catch (error) {
    console.error("CREATE ATTENDANCE ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for this session. If this is an extra lecture, set isExtraLecture=true"
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * GET ATTENDANCE (Teacher)
 * Fetch teacher's attendance sessions
 */
export const getTeacherAttendance = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { academicYear, semester } = req.query;

    const query = {
      teacher: teacherId
    };

    // Filter by academic year if provided
    if (academicYear) {
      query.academicYear = academicYear;
    }

    // Filter by semester if provided
    if (semester) {
      query.semester = parseInt(semester);
    }

    const attendance = await AttendanceSession.find(query)
      .populate("subject", "name code")
      .populate("branch", "name code")
      .populate("assignedTeacher", "name")
      .sort({ date: -1 });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error("GET ATTENDANCE ERROR:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

/**
 * GET STUDENTS FOR SESSION
 * Fetches the list of students for a teaching session
 * Based on session type (LECTURE or PRACTICAL)
 * 
 * @route GET /api/attendance/students-for-session
 * @access Private (Teacher only)
 */
export const getStudentsForSession = async (req, res) => {
  try {
    const { teachingAssignmentId } = req.query;
    const teacherId = req.user.id;

    // Validate required parameter
    if (!teachingAssignmentId) {
      return res.status(400).json({
        success: false,
        message: "Teaching assignment ID is required"
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(teachingAssignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teaching assignment ID format"
      });
    }

    // Fetch teaching assignment
    const assignment = await TeachingAssignment.findById(teachingAssignmentId)
      .populate("subjectId", "name code")
      .populate("branchId", "name code")
      .populate("batchId", "name");

    // Check if assignment exists
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Teaching assignment not found"
      });
    }

    // Verify teacher authorization
    // Teacher must own this assignment
    if (assignment.teacherId.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this teaching assignment"
      });
    }

    // Verify assignment is active
    if (!assignment.isActive) {
      return res.status(400).json({
        success: false,
        message: "This teaching assignment is not active"
      });
    }

    // Build student query based on session type
    let studentQuery = {
      status: "active",
      academicYear: assignment.academicYear
    };

    if (assignment.sessionType === "PRACTICAL") {
      // PRACTICAL: Filter by branch, year, division, and batch name
      if (!assignment.batchId) {
        return res.status(400).json({
          success: false,
          message: "Batch information is required for practical sessions"
        });
      }

      studentQuery.branch = assignment.branchId;
      studentQuery.year = assignment.year;
      studentQuery.division = assignment.division;

      const batchName = assignment.batchId?.name;
      if (batchName) {
        studentQuery.$or = [{ batch: batchName }, { batchName }];
      }
    } else {
      // LECTURE: Filter by branch, year, division
      studentQuery.branch = assignment.branchId;
      studentQuery.year = assignment.year;
      studentQuery.division = assignment.division;
    }

    // Fetch students and sort by roll number
    const students = await Student.find(studentQuery)
      .populate("userId", "name email")
      .populate("branch", "name code")
      .select("rollNo userId branch year division batch batchName academicYear status")
      .sort({ rollNo: 1 });

    // Resolve missing user details if populate didn't return a user document
    const missingUserIds = students
      .filter((student) => student.userId && !student.userId.name)
      .map((student) => student.userId.toString());

    let userMap = new Map();
    if (missingUserIds.length > 0) {
      const users = await User.find({ _id: { $in: missingUserIds } })
        .select("name email")
        .lean();

      userMap = new Map(
        users.map((user) => [user._id.toString(), user])
      );
    }

    // Format response
    const formattedStudents = students.map((student) => {
      const userIdValue = student.userId && student.userId._id
        ? student.userId._id.toString()
        : student.userId?.toString();

      const fallbackUser = userIdValue ? userMap.get(userIdValue) : null;
      const name = student.userId?.name || fallbackUser?.name || "";
      const email = student.userId?.email || fallbackUser?.email || "";

      return {
        _id: student._id,
        rollNo: student.rollNo,
        name,
        email,
        branch: student.branch?.name,
        branchCode: student.branch?.code,
        year: student.year,
        division: student.division,
        batch: student.batchName || student.batch || "",
        academicYear: student.academicYear
      };
    });

    res.json({
      success: true,
      count: formattedStudents.length,
      sessionType: assignment.sessionType,
      sessionDetails: {
        subject: assignment.subjectId?.name,
        subjectCode: assignment.subjectId?.code,
        branch: assignment.branchId?.name,
        year: assignment.year,
        division: assignment.division,
        batch: assignment.batchId?.name,
        dayOfWeek: assignment.dayOfWeek,
        startTime: assignment.startTime,
        endTime: assignment.endTime
      },
      data: formattedStudents
    });
  } catch (error) {
    console.error("GET STUDENTS FOR SESSION ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching students"
    });
  }
};

/**
 * MARK ATTENDANCE + GENERATE REPORT
 * Unified API for saving attendance and generating WhatsApp report text.
 * 
 * @route POST /api/attendance/mark-and-generate
 * @access Private (Teacher only)
 */
export const markAndGenerateAttendance = async (req, res) => {
  try {
    const { teachingAssignmentId, date, absentRollNumbers } = req.body;
    const teacherId = req.user.id;

    // 1. Validate required fields
    if (!teachingAssignmentId || !date || !Array.isArray(absentRollNumbers)) {
      return res.status(400).json({
        success: false,
        message: "teachingAssignmentId, date and absentRollNumbers are required"
      });
    }

    // 2. Date validation (today or yesterday only)
    validateAttendanceDate(date);

    // 3. Fetch TeachingAssignment
    if (!mongoose.Types.ObjectId.isValid(teachingAssignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teachingAssignmentId format"
      });
    }

    const assignment = await TeachingAssignment.findById(teachingAssignmentId)
      .populate("subjectId", "name code")
      .populate("branchId", "name code")
      .populate("batchId", "name")
      .lean();

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Teaching assignment not found"
      });
    }

    // Validate teacher ownership
    if (assignment.teacherId.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to mark attendance for this session"
      });
    }

    // Academic year must be current
    const currentAcademicYear = process.env.CURRENT_ACADEMIC_YEAR || "2025-2026";
    if (assignment.academicYear !== currentAcademicYear) {
      return res.status(400).json({
        success: false,
        message: "Attendance can only be marked for the current academic year"
      });
    }

    // 4. Load students based on session type
    const studentQuery = {
      status: "active",
      academicYear: assignment.academicYear,
      branch: assignment.branchId,
      year: assignment.year,
      division: assignment.division
    };

    if (assignment.sessionType === "PRACTICAL") {
      if (!assignment.batchId?.name) {
        return res.status(400).json({
          success: false,
          message: "Batch is required for practical sessions"
        });
      }
      studentQuery.$or = [
        { batch: assignment.batchId.name },
        { batchName: assignment.batchId.name }
      ];
    }

    const students = await Student.find(studentQuery)
      .populate("userId", "name email")
      .select("rollNo userId")
      .sort({ rollNo: 1 })
      .lean();

    if (!students.length) {
      return res.status(400).json({
        success: false,
        message: "No students found for this session"
      });
    }

    // 5. Convert roll numbers to student IDs
    const rollSet = new Set(absentRollNumbers.map((r) => Number(r)));
    const rollToStudent = new Map(students.map((s) => [s.rollNo, s]));

    const missingRolls = [...rollSet].filter((roll) => !rollToStudent.has(roll));
    if (missingRolls.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid roll numbers: ${missingRolls.join(", ")}`
      });
    }

    const absentStudentIds = [...rollSet].map((roll) => rollToStudent.get(roll)._id);

    // 6. Check if attendance already exists
    // Query must match the unique index fields: date + subject + branch + year + division + academicYear + semester + sessionType + batch
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(sessionDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Calculate semester for query
    const month = new Date(date).getMonth();
    const semesterBase = (assignment.year - 1) * 2;
    const semester = month >= 6 ? semesterBase + 1 : semesterBase + 2;

    // Build query matching the unique index
    const duplicateQuery = {
      date: { $gte: sessionDate, $lt: nextDate },
      subject: assignment.subjectId,
      branch: assignment.branchId,
      year: assignment.year,
      division: assignment.division,
      academicYear: assignment.academicYear,
      semester: semester,
      sessionType: assignment.sessionType,
      isCancelled: false // Index has partialFilterExpression
    };

    // Add batch for practical sessions
    if (assignment.sessionType === "PRACTICAL" && assignment.batchId?.name) {
      duplicateQuery.batch = assignment.batchId.name;
    }

    const existing = await AttendanceSession.findOne(duplicateQuery);

    // If attendance already exists, return response to allow editing
    if (existing) {
      return res.json({
        success: true,
        alreadyExists: true,
        attendanceId: existing._id,
        message: "Attendance already marked for this session and date"
      });
    }

    // 7. Save AttendanceSession
    const attendance = await AttendanceSession.create({
      teachingAssignmentId,
      date: sessionDate,
      academicYear: assignment.academicYear,
      semester,
      sessionType: assignment.sessionType,
      batch: assignment.sessionType === "PRACTICAL" ? assignment.batchId?.name : null,
      assignedTeacher: assignment.teacherId,
      teacher: teacherId,
      isSubstitute: false,
      substituteReason: null,
      isExtraLecture: false,
      extraLectureReason: null,
      isCancelled: false,
      cancelReason: null,
      subject: assignment.subjectId,
      branch: assignment.branchId,
      year: assignment.year,
      division: assignment.division,
      absentStudents: absentStudentIds,
      totalStudents: students.length,
      createdBy: teacherId
    });

    // 8. Generate WhatsApp report text
    const teacher = await User.findById(teacherId).select("name email").lean();
    const subject = await Subject.findById(assignment.subjectId).select("name code").lean();
    const absentStudents = [...rollSet].map((roll) => ({
      rollNo: roll,
      name: rollToStudent.get(roll)?.userId?.name || ""
    }));

    const reportText = generateDailyReport(
      {
        ...attendance.toObject(),
        startTime: assignment.startTime,
        endTime: assignment.endTime
      },
      absentStudents,
      teacher,
      subject
    );

    // 9. Update Monthly Excel Attendance Sheet
    // This runs asynchronously and won't block the API response
    updateMonthlyAttendanceExcel(attendance.toObject())
      .then((result) => {
        if (result.success) {
          console.log(`📊 Excel updated: ${result.message}`);
        } else {
          console.error(`📊 Excel update failed: ${result.error}`);
        }
      })
      .catch((error) => {
        console.error("📊 Excel update error:", error.message);
      });

    // 10. Return response
    res.json({
      success: true,
      alreadyExists: false,
      attendance,
      reportText
    });
  } catch (error) {
    console.error("MARK AND GENERATE ERROR:", error);
    
    // Handle MongoDB duplicate key error (fallback if findOne missed it)
    if (error.code === 11000) {
      // Try to find the existing attendance to return its ID
      try {
        const sessionDate = new Date(req.body.date);
        sessionDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(sessionDate);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const existing = await AttendanceSession.findOne({
          teachingAssignmentId: req.body.teachingAssignmentId,
          date: { $gte: sessionDate, $lt: nextDate }
        });
        
        return res.status(409).json({
          success: false,
          message: "Attendance already marked for this session and date",
          alreadyExists: true,
          attendanceId: existing?._id
        });
      } catch (findError) {
        return res.status(409).json({
          success: false,
          message: "Attendance already marked for this session and date",
          alreadyExists: true
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};

/**
 * UPDATE ATTENDANCE
 * PUT /api/attendance/update/:attendanceId
 * 
 * Update existing attendance record with new absent students list
 * Regenerates WhatsApp report and updates Excel file
 * 
 * Required: Only assigned teacher can edit
 * Date must still be today or yesterday
 * 
 * Request body:
 * {
 *   absentRollNumbers: [9, 12, 15]
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   attendance: {...updated attendance session},
 *   reportText: "..."
 * }
 */
export const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { absentRollNumbers } = req.body;
    const teacherId = req.user.id;

    // 1. Validate required fields
    if (!attendanceId || !Array.isArray(absentRollNumbers)) {
      return res.status(400).json({
        success: false,
        message: "attendanceId and absentRollNumbers array are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendanceId format"
      });
    }

    // 2. Fetch existing attendance session
    const attendance = await AttendanceSession.findById(attendanceId).lean();

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance session not found"
      });
    }

    // 3. Verify teacher ownership and authorization
    if (attendance.teacher.toString() !== teacherId && attendance.assignedTeacher.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this attendance"
      });
    }

    // 4. Date validation (must be today or yesterday)
    const attendanceDate = new Date(attendance.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (attendanceDate < yesterday || attendanceDate > today) {
      return res.status(400).json({
        success: false,
        message: "Can only edit attendance for today or yesterday"
      });
    }

    // 5. Fetch teaching assignment details
    const assignment = await TeachingAssignment.findById(attendance.teachingAssignmentId)
      .populate("subjectId", "name code")
      .populate("branchId", "name code")
      .populate("batchId", "name")
      .lean();

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Teaching assignment not found"
      });
    }

    // 6. Load students and validate roll numbers
    const studentQuery = {
      status: "active",
      academicYear: attendance.academicYear,
      branch: attendance.branch,
      year: attendance.year,
      division: attendance.division
    };

    if (attendance.sessionType === "PRACTICAL") {
      if (attendance.batch) {
        studentQuery.$or = [
          { batch: attendance.batch },
          { batchName: attendance.batch }
        ];
      }
    }

    const students = await Student.find(studentQuery)
      .populate("userId", "name email")
      .select("rollNo userId")
      .sort({ rollNo: 1 })
      .lean();

    // 7. Convert roll numbers to student IDs
    const rollSet = new Set(absentRollNumbers.map((r) => Number(r)));
    const rollToStudent = new Map(students.map((s) => [s.rollNo, s]));

    // Validate roll numbers exist
    const missingRolls = [...rollSet].filter((roll) => !rollToStudent.has(roll));
    if (missingRolls.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid roll numbers: ${missingRolls.join(", ")}`
      });
    }

    const absentStudentIds = [...rollSet].map((roll) => rollToStudent.get(roll)._id);

    // 8. Update attendance session
    const updatedAttendance = await AttendanceSession.findByIdAndUpdate(
      attendanceId,
      {
        absentStudents: absentStudentIds,
        totalStudents: students.length,
        updatedAt: new Date()
      },
      { new: true }
    ).lean();

    // 9. Generate updated WhatsApp report text
    const teacher = await User.findById(teacherId).select("name email").lean();
    const subject = await Subject.findById(assignment.subjectId).select("name code").lean();
    const absentStudents = [...rollSet].map((roll) => ({
      rollNo: roll,
      name: rollToStudent.get(roll)?.userId?.name || ""
    }));

    const reportText = generateDailyReport(
      {
        ...updatedAttendance,
        startTime: assignment.startTime,
        endTime: assignment.endTime
      },
      absentStudents,
      teacher,
      subject
    );

    // 10. Update Monthly Excel Attendance Sheet
    // This runs asynchronously and won't block the API response
    updateMonthlyAttendanceExcel(updatedAttendance)
      .then((result) => {
        if (result.success) {
          console.log(`📊 Excel updated: ${result.message}`);
        } else {
          console.error(`📊 Excel update failed: ${result.error}`);
        }
      })
      .catch((error) => {
        console.error("📊 Excel update error:", error.message);
      });

    // 11. Return updated attendance and report
    res.json({
      success: true,
      attendance: updatedAttendance,
      reportText,
      message: "Attendance updated successfully"
    });

  } catch (error) {
    console.error("UPDATE ATTENDANCE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};

/**
 * MANUAL EXCEL UPDATE
 * POST /api/attendance/update-excel/:attendanceId
 * 
 * Manually triggers Excel update for a specific attendance session
 * Useful when teacher wants to force Excel generation or regeneration
 */
export const manualExcelUpdate = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const teacherId = req.user.id;

    // 1. Validate attendance ID
    if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendanceId format"
      });
    }

    // 2. Fetch attendance session with populated fields
    const attendance = await AttendanceSession.findById(attendanceId)
      .populate("subject", "name code")
      .populate("branch", "name code")
      .populate("teacher", "name")
      .lean();

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance session not found"
      });
    }

    // 3. Verify teacher authorization
    if (
      attendance.teacher._id.toString() !== teacherId &&
      attendance.assignedTeacher.toString() !== teacherId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update Excel for this session"
      });
    }

    // 4. Prepare attendance object for Excel update
    // Convert populated fields back to IDs for the utility function
    const attendanceForExcel = {
      ...attendance,
      subject: attendance.subject._id,
      branch: attendance.branch._id,
      teacher: attendance.teacher._id
    };

    // 5. Trigger Excel update
    console.log(`📊 Manual Excel update requested for attendance: ${attendanceId}`);
    
    const result = await updateMonthlyAttendanceExcel(attendanceForExcel);

    // 6. Return result
    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        filePath: result.filePath,
        skipped: result.skipped || false
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || "Excel update failed",
        error: result.error
      });
    }

  } catch (error) {
    console.error("MANUAL EXCEL UPDATE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while updating Excel"
    });
  }
};

/**
 * GET SESSION DETAILS
 * Fetch detailed info for a specific attendance session including all students
 * @route GET /api/attendance/session/:sessionId/details
 */
export const getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // 1. Fetch attendance session with populated refs
    const session = await AttendanceSession.findById(sessionId)
      .populate("subject", "name code")
      .populate("branch", "name code")
      .lean();

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // 2. Fetch all eligible students for this session
    const studentFilter = {
      branch: session.branch._id,
      year: session.year,
      division: session.division,
      status: "active",
      admissionDate: { $lte: session.date }
    };

    if (session.academicYear) {
      studentFilter.$or = [
        { academicYear: session.academicYear },
        { academicYear: { $exists: false } }
      ];
    }

    if (session.sessionType === "PRACTICAL" && session.batch) {
      studentFilter.batch = session.batch;
    }

    const students = await Student.find(studentFilter)
      .populate("userId", "name")
      .sort({ rollNo: 1 })
      .lean();

    // 3. Format the students array with present/absent status
    const absentSet = new Set(session.absentStudents.map(id => id.toString()));
    
    let presentCount = 0;
    let absentCount = 0;

    const attendanceRecords = students.map(student => {
      const isAbsent = absentSet.has(student._id.toString());
      if (isAbsent) absentCount++;
      else presentCount++;

      return {
        rollNo: student.rollNo,
        studentName: student.userId?.name || "Unknown",
        status: isAbsent ? "absent" : "present"
      };
    });

    // 4. Return formatted response
    res.json({
      success: true,
      session: {
        date: session.date,
        subject: session.subject,
        batch: {
          name: session.batch || null,
          branch: session.branch.name,
          year: session.year,
          division: session.division
        },
        type: session.sessionType,
        totalStudents: students.length, // use actual count
        presentCount,
        absentCount
      },
      attendanceRecords
    });

  } catch (error) {
    console.error("GET SESSION DETAILS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error fetching details" });
  }
};

/**
 * IMPORT ATTENDANCE FROM EXCEL
 * Reads an uploaded Excel file and syncs it with MongoDB (Two-way sync)
 * 
 * @route POST /api/attendance/import-excel
 * @access Private (Admin)
 */

export const importAttendanceExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Excel file is required" });
    }

    const {
      academicYear,
      subjectId,
      branchId,
      year,
      division,
      sessionType,
      batch
    } = req.body;

    if (!academicYear || !subjectId || !branchId || !year || !division || !sessionType) {
      return res.status(400).json({
        success: false,
        message: "Missing required metadata fields (academicYear, subjectId, branchId, year, division, sessionType)"
      });
    }

    // 1. Parse Excel file
    const attendanceData = await parseAttendanceExcel(req.file.buffer);

    // 2. Fetch all students for this class
    const studentQuery = {
      status: "active",
      branch: branchId,
      year: parseInt(year),
      division,
      academicYear
    };

    if (sessionType === "PRACTICAL" && batch) {
      studentQuery.$or = [{ batch }, { batchName: batch }];
    }

    const students = await Student.find(studentQuery).select("rollNo _id").lean();
    if (students.length === 0) {
      return res.status(400).json({ success: false, message: "No students found for this class" });
    }

    const rollToId = new Map(students.map((s) => [s.rollNo, s._id]));

    let updatedSessions = 0;
    let newSessions = 0;

    // 3. Process each date column
    for (const dateStr of attendanceData.dates) {
      const records = attendanceData.records[dateStr];
      const sessionDate = new Date(dateStr);
      sessionDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(sessionDate);
      nextDate.setDate(nextDate.getDate() + 1);

      // Find absent student IDs
      const absentStudentIds = records.absent
        .map(roll => rollToId.get(roll))
        .filter(id => id !== undefined);

      // Check if session exists
      const duplicateQuery = {
        date: { $gte: sessionDate, $lt: nextDate },
        subject: subjectId,
        branch: branchId,
        year: year,
        division: division,
        academicYear: academicYear,
        sessionType: sessionType
      };

      if (sessionType === "PRACTICAL" && batch) {
        duplicateQuery.batch = batch;
      }

      const existingSession = await AttendanceSession.findOne(duplicateQuery);

      if (existingSession) {
        // Update existing session
        existingSession.absentStudents = absentStudentIds;
        existingSession.totalStudents = students.length;
        await existingSession.save();
        updatedSessions++;
      } else {
        // Create new session
        const month = sessionDate.getMonth();
        const semesterBase = (year - 1) * 2;
        const semester = month >= 6 ? semesterBase + 1 : semesterBase + 2;

        await AttendanceSession.create({
          date: sessionDate,
          academicYear,
          semester,
          sessionType,
          batch: sessionType === "PRACTICAL" ? batch : null,
          assignedTeacher: req.user.id, // default to admin
          teacher: req.user.id,
          subject: subjectId,
          branch: branchId,
          year,
          division,
          absentStudents: absentStudentIds,
          totalStudents: students.length,
          createdBy: req.user.id
        });
        newSessions++;
      }
    }

    res.json({
      success: true,
      message: "Excel data imported and synced successfully",
      updatedSessions,
      newSessions,
      totalDatesProcessed: attendanceData.dates.length
    });

  } catch (error) {
    console.error("IMPORT EXCEL ERROR:", error);
    res.status(500).json({ success: false, message: "Error importing Excel", error: error.message });
  }
};
