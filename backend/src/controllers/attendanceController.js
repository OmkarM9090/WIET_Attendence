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

    // 1️ Validate required fields
    if (!date || !subjectId || !branchId || !year || !division || !sessionType) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    // Validate academicYear
    if (!academicYear) {
      return res.status(400).json({
        message: "Academic Year is required"
      });
    }

    // 2️ Practical requires batch
    if (sessionType === "PRACTICAL" && !batch) {
      return res.status(400).json({
        message: "Batch is required for practical session"
      });
    }

    // 3️ Lecture must NOT have batch
    if (sessionType === "LECTURE" && batch) {
      return res.status(400).json({
        message: "Batch should not be sent for lecture"
      });
    }

    // 4️ Count eligible students
    const studentFilter = {
      branch: branchId,
      year,
      division,
      academicYear  // Filter by academic year
    };

    if (sessionType === "PRACTICAL") {
      studentFilter.batch = batch;
    }

    const totalStudents = await Student.countDocuments(studentFilter);

    if (totalStudents === 0) {
      return res.status(400).json({
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
      message: "Attendance saved successfully",
      attendance
    });

  } catch (error) {
    console.error("CREATE ATTENDANCE ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Attendance already marked for this session"
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

