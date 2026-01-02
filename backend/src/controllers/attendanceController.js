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
      absentStudentIds
    } = req.body;

    //  Teacher id comes from JWT
    const teacherId = req.user.id;

    // 1️. Validate required fields
    if (!date || !subjectId || !branchId || !year || !division) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // 2️. Get total students count
    const totalStudents = await Student.countDocuments({
      branch: branchId,
      year,
      division
    });

    if (totalStudents === 0) {
      return res.status(400).json({
        message: "No students found for this class"
      });
    }

    // 3️. Create attendance session
    const attendance = await AttendanceSession.create({
      date,
      teacher: teacherId,
      subject: subjectId,
      branch: branchId,
      year,
      division,
      absentStudents: absentStudentIds || [],
      totalStudents
    });

    res.status(201).json({
      message: "Attendance saved successfully",
      attendance
    });
  } catch (error) {
    console.error("CREATE ATTENDANCE ERROR:", error);

    // Duplicate attendance (unique index)
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Attendance already marked for this lecture"
      });
    }

    res.status(500).json({ message: "Server error" });
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

    res.json(attendance);
  } catch (error) {
    console.error("GET ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

