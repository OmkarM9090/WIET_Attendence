import mongoose from "mongoose";
import AttendanceSession from "../models/AttendanceSession.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import Branch from "../models/Branch.js";
import User from "../models/User.js";

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
 */
export const createAttendance = async (req, res) => {
  try {
    const {
      date,
      subjectId,
      branchId,
      year,
      division,
      academicYear,  // Academic Year (e.g., "2024-2025")
      sessionType,   // LECTURE | PRACTICAL
      batch,         // required only for PRACTICAL
      absentStudentIds
    } = req.body;

    const teacherId = req.user.id;

    // ============ VALIDATION FUNCTIONS ============
    const normalizeAcademicYear = (value) => {
      if (!value) return value;
      const trimmed = String(value).trim();
      const parts = trimmed.split("-");
      if (parts.length === 2 && parts[0].length === 4 && parts[1].length === 2) {
        return `${parts[0]}-20${parts[1]}`;
      }
      return trimmed;
    };

    // ============ 1. VALIDATE REQUIRED FIELDS ============
    if (!date || !subjectId || !branchId || !year || !division || !sessionType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Validate academicYear
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: "Academic Year is required"
      });
    }

    // ============ 2. VALIDATE DATE (NO FUTURE ATTENDANCE) ============
    // Use local date strings to avoid timezone issues
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

    // ============ 3. VALIDATE SESSION TYPE & BATCH ============
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

    // ============ 4. FETCH TEACHER NAME ============
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    // ============ 5. FETCH SUBJECT NAME ============
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    // ============ 6. FETCH BRANCH NAME ============
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found"
      });
    }

    // ============ 7. COUNT ELIGIBLE STUDENTS ============
    const normalizedAcademicYear = normalizeAcademicYear(academicYear);
    const studentFilter = {
      branch: mongoose.Types.ObjectId.isValid(branchId)
        ? new mongoose.Types.ObjectId(branchId)
        : branchId,
      year: parseInt(year),
      division,
      status: "active"
    };

    if (normalizedAcademicYear) {
      studentFilter.$or = [
        { academicYear: normalizedAcademicYear },
        { academicYear: academicYear },
        { academicYear: { $exists: false } }
      ];
    }

    if (sessionType === "PRACTICAL") {
      studentFilter.batch = batch;
    }

    const totalStudents = await Student.countDocuments(studentFilter);

    if (totalStudents === 0) {
      return res.status(400).json({
        success: false,
        message: "No students found for this session"
      });
    }

    // ============ 8. FETCH ABSENT STUDENT DETAILS ============
    let absentStudentsDetails = [];
    if (absentStudentIds && absentStudentIds.length > 0) {
      absentStudentsDetails = await Student.find({
        _id: { $in: absentStudentIds }
      }).populate("userId", "name");
    }

    // ============ 9. GENERATE WHATSAPP MESSAGE ============
    const className = `${branch.name} ${year}-${division}`;
    const institution = "Watumull College Of Engineering And Technology";
    
    const absentForMessage = absentStudentsDetails.map((student) => ({
      rollNo: student.rollNo,
      name: student.userId?.name || "N/A"
    }));

    const whatsappText = generateWhatsAppMessage(
      institution,
      className,
      subject.name,
      date,
      sessionType,
      teacher.name,
      absentForMessage
    );

    // ============ 10. CREATE ATTENDANCE SESSION ============
    const attendance = await AttendanceSession.create({
      date,
      teacher: teacherId,
      subject: subjectId,
      branch: branchId,
      year,
      division,
      academicYear,
      sessionType,
      batch: sessionType === "PRACTICAL" ? batch : null,
      absentStudents: absentStudentIds || [],
      totalStudents
    });

    // ============ 11. RETURN RESPONSE WITH WHATSAPP MESSAGE ============
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
        message: "Attendance already marked for this session"
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Server error"
    });
  }
};



/**
 * GET ATTENDANCE (Teacher)
 */
export const getTeacherAttendance = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const attendance = await AttendanceSession.find({
      teacher: teacherId
    })
      .populate("subject", "name code")
      .populate("branch", "name code")
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

