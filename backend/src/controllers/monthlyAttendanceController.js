import AttendanceSession from "../models/AttendanceSession.js";
import Student from "../models/Student.js";

/**
 * MONTHLY ATTENDANCE AGGREGATION
 * Admin / Teacher
 */
export const getMonthlyAttendance = async (req, res) => {
  try {
    const {
      branchId,
      year,
      division,
      startDate,
      endDate,
      subjectId
    } = req.query;
    console.log("QUERY:", req.query);

    // 1️ Validate input
    if (!branchId || !year || !division || !startDate || !endDate) {
      return res.status(400).json({
        message: "branchId, year, division, startDate, endDate are required"
      });
    }

    // 2️ Fetch students of this class
    const students = await Student.find({
      branch: branchId,
      year,
      division,
      status: "active"
    }).populate("userId", "name");

    if (students.length === 0) {
      return res.status(400).json({
        message: "No students found for this class"
      });
    }

    // Map studentId → info
    const studentMap = {};
    students.forEach((s) => {
      studentMap[s._id.toString()] = {
        rollNo: s.rollNo,
        name: s.userId.name
      };
    });

    // 3️ Build attendance query
    const attendanceQuery = {
      branch: branchId,
      year,
      division,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (subjectId) {
      attendanceQuery.subject = subjectId;
    }

    // 4️ Fetch attendance sessions
    const sessions = await AttendanceSession.find(attendanceQuery)
      .populate("subject", "name code");

    // 5️ Aggregation logic
    const report = {};

    sessions.forEach((session) => {
      const subjectKey = session.subject._id.toString();

      if (!report[subjectKey]) {
        report[subjectKey] = {
          subject: session.subject,
          totalLectures: 0,
          students: {}
        };
      }

      report[subjectKey].totalLectures += 1;

      students.forEach((student) => {
        const studentId = student._id.toString();

        if (!report[subjectKey].students[studentId]) {
          report[subjectKey].students[studentId] = {
            rollNo: student.rollNo,
            name: student.userId.name,
            attended: 0,
            absent: 0
          };
        }

        const isAbsent = session.absentStudents
          .map(id => id.toString())
          .includes(studentId);

        if (isAbsent) {
          report[subjectKey].students[studentId].absent += 1;
        } else {
          report[subjectKey].students[studentId].attended += 1;
        }
      });
    });

    // 6️ Format final response
    const response = Object.values(report).map((subjectBlock) => ({
      subject: subjectBlock.subject,
      totalLectures: subjectBlock.totalLectures,
      students: Object.values(subjectBlock.students).map((s) => ({
        ...s,
        percentage:
          subjectBlock.totalLectures === 0
            ? 0
            : Math.round(
                (s.attended / subjectBlock.totalLectures) * 100
              )
      }))
    }));

    res.json({
      dateRange: { startDate, endDate },
      data: response
    });
  } catch (error) {
    console.error("MONTHLY ATTENDANCE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
