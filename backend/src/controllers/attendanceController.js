import mongoose from "mongoose";
import AttendanceSession from "../models/AttendanceSession.js";
import Student from "../models/Student.js";

/**
 * CREATE ATTENDANCE SESSION
 * Teacher only
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

    const normalizeAcademicYear = (value) => {
      if (!value) return value;
      const trimmed = String(value).trim();
      const parts = trimmed.split("-");
      if (parts.length === 2 && parts[0].length === 4 && parts[1].length === 2) {
        return `${parts[0]}-20${parts[1]}`;
      }
      return trimmed;
    };

    // 1️ Validate required fields
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

    // 2️ Practical requires batch
    if (sessionType === "PRACTICAL" && !batch) {
      return res.status(400).json({
        success: false,
        message: "Batch is required for practical session"
      });
    }

    // 3️ Lecture must NOT have batch
    if (sessionType === "LECTURE" && batch) {
      return res.status(400).json({
        success: false,
        message: "Batch should not be sent for lecture"
      });
    }

    // 4️ Count eligible students
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

    // 5️ Create attendance session
    const attendance = await AttendanceSession.create({
      date,
      teacher: teacherId,
      subject: subjectId,
      branch: branchId,
      year,
      division,
      academicYear,  // Save academic year
      sessionType,
      batch: sessionType === "PRACTICAL" ? batch : null,
      absentStudents: absentStudentIds || [],
      totalStudents
    });

    res.status(201).json({
      success: true,
      message: "Attendance saved successfully",
      data: attendance
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

