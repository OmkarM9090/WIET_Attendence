import AttendanceSession from "../models/AttendanceSession.js";
import Student from "../models/Student.js";

/**
 * GET STUDENT ATTENDANCE (Subject-wise)
 * Student only
 */
export const getStudentAttendance = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️. Find student profile
    const student = await Student.findOne({ userId });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const { branch, year, division, _id: studentId } = student;

    // 2️. Get all attendance sessions for student's class
    const sessions = await AttendanceSession.find({
      branch,
      year,
      division
    }).populate("subject", "name code");

    // 3️. Calculate attendance subject-wise
    const summary = {};

    sessions.forEach((session) => {
      const subjectId = session.subject._id.toString();

      if (!summary[subjectId]) {
        summary[subjectId] = {
          subject: session.subject,
          totalLectures: 0,
          attended: 0,
          absent: 0
        };
      }

      summary[subjectId].totalLectures += 1;

      const isAbsent = session.absentStudents
        .map(id => id.toString())
        .includes(studentId.toString());

      if (isAbsent) {
        summary[subjectId].absent += 1;
      } else {
        summary[subjectId].attended += 1;
      }
    });

    // 4️. Calculate percentage
    const result = Object.values(summary).map(item => ({
      subject: item.subject,
      totalLectures: item.totalLectures,
      attended: item.attended,
      absent: item.absent,
      percentage: Math.round(
        (item.attended / item.totalLectures) * 100
      )
    }));

    res.json(result);
  } catch (error) {
    console.error("STUDENT ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
