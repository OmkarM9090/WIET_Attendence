import mongoose from "mongoose";
import AttendanceSession from "../models/AttendanceSession.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import Branch from "../models/Branch.js";
import User from "../models/User.js";
import TeachingAssignment from "../models/TeachingAssignment.js";

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

