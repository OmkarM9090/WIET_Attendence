import Subject from "../models/Subject.js";
import Branch from "../models/Branch.js";
import Student from "../models/Student.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import Teacher from "../models/Teacher.js";
import User from "../models/User.js";

/**
 * FORMAT DATE (DD-MM-YYYY)
 */
const formatDateDDMMYYYY = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * FORMAT TIME (HH:mm -> hh:mm AM/PM)
 */
const formatTime12Hour = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;
  return `${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
};

/**
 * VALIDATE TIME FORMAT
 */
const isValidTime = (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

/**
 * GENERATE DAILY ATTENDANCE REPORT TEXT
 */
const buildReportText = ({
  collegeName,
  classLabel,
  subjectName,
  dateText,
  timeText,
  teacherName,
  absentStudents
}) => {
  let report = `${collegeName}\n\n`;
  report += `Daily Attendance Report\n`;
  report += `Class: ${classLabel}\n`;
  report += `Subject: ${subjectName}\n`;
  report += `Date: ${dateText}\n`;
  report += `Time: ${timeText}\n`;
  report += `Subject Teacher: ${teacherName}\n\n`;
  report += `Absent Students:\n`;
  report += `Roll No   Name\n`;

  absentStudents.forEach((student) => {
    const roll = String(student.rollNo).padEnd(8, " ");
    report += `${roll}${student.name}\n`;
  });

  return report.trimEnd();
};

/**
 * POST /api/attendance/daily-report
 * Generate Daily Attendance Report (Teacher only)
 */
export const createDailyAttendanceReport = async (req, res) => {
  try {
    const {
      subjectId,
      branchId,
      year,
      division,
      sessionType,
      batch,
      startTime,
      endTime,
      absentRollNos
    } = req.body;

    // ============ 1. VALIDATE REQUIRED FIELDS ============
    if (!subjectId || !branchId || !year || !division || !sessionType || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
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

    // ============ 3. VALIDATE TIME FORMAT ============
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:mm"
      });
    }

    // ============ 4. VALIDATE DATE (TODAY ONLY) ============
    // If client sends a date, it must match today's system date
    const getLocalDateString = (value) => {
      const d = new Date(value);
      const yearStr = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, "0");
      const dayStr = String(d.getDate()).padStart(2, "0");
      return `${yearStr}-${monthStr}-${dayStr}`;
    };

    const todayStr = getLocalDateString(new Date());
    const requestDateStr = req.body?.date ? getLocalDateString(req.body.date) : todayStr;

    if (requestDateStr !== todayStr) {
      return res.status(400).json({
        success: false,
        message: "Daily report can be generated only for today"
      });
    }

    // ============ 5. FETCH TEACHER FROM JWT ============
    const userId = req.user.id;
    const teacherUser = await User.findById(userId);
    if (!teacherUser) {
      return res.status(404).json({
        success: false,
        message: "Teacher user not found"
      });
    }

    const teacherProfile = await Teacher.findOne({ userId });
    if (!teacherProfile) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found"
      });
    }

    // ============ 6. VALIDATE ASSIGNMENT ============
    const assignment = await TeachingAssignment.findOne({
      teacher: teacherProfile._id,
      subject: subjectId,
      branch: branchId,
      year: parseInt(year),
      division
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this class"
      });
    }

    // ============ 7. FETCH SUBJECT & BRANCH ============
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found"
      });
    }

    // ============ 8. VALIDATE & NORMALIZE ROLL NUMBERS ============
    const rollList = Array.isArray(absentRollNos)
      ? absentRollNos.map((r) => Number(r)).filter((r) => !Number.isNaN(r))
      : [];

    const uniqueRolls = [...new Set(rollList)];

    if (uniqueRolls.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Absent roll numbers are required"
      });
    }

    // ============ 9. FETCH STUDENTS BY ROLL NUMBERS ============
    const studentFilter = {
      branch: branchId,
      year: parseInt(year),
      division,
      rollNo: { $in: uniqueRolls },
      status: "active"
    };

    if (sessionType === "PRACTICAL" && batch) {
      studentFilter.$or = [
        { batch },
        { batchName: batch }
      ];
    }

    const students = await Student.find(studentFilter).populate("userId", "name");

    const foundRolls = new Set(students.map((s) => s.rollNo));
    const missingRolls = uniqueRolls.filter((r) => !foundRolls.has(r));

    if (missingRolls.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid roll numbers for this class: ${missingRolls.join(", ")}`
      });
    }

    // ============ 10. BUILD RESPONSE DATA ============
    const absentStudents = students
      .map((s) => ({
        rollNo: s.rollNo,
        name: s.userId?.name || "N/A"
      }))
      .sort((a, b) => a.rollNo - b.rollNo);

    const yearMap = {
      1: "FE",
      2: "SE",
      3: "TE",
      4: "BE"
    };

    const classLabel = `${yearMap[parseInt(year)] || year} Div ${division}`;
    const dateText = formatDateDDMMYYYY(new Date());
    const timeText = `${formatTime12Hour(startTime)} to ${formatTime12Hour(endTime)}`;

    const reportText = buildReportText({
      collegeName: "Watumull College Of Engineering And Technology",
      classLabel,
      subjectName: subject.name,
      dateText,
      timeText,
      teacherName: teacherUser.name,
      absentStudents
    });

    return res.json({
      reportText,
      absentStudents
    });
  } catch (error) {
    console.error("DAILY ATTENDANCE REPORT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
