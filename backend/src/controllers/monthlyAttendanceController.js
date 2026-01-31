import AttendanceSession from "../models/AttendanceSession.js";
import Student from "../models/Student.js";

/**
 * MONTHLY ATTENDANCE AGGREGATION
 * Admin / Teacher
 * 
 * ENHANCED WITH:
 * - Exclude cancelled lectures from totals
 * - Handle batch-wise practicals
 * - Filter by academic year & semester
 * - Exclude dropout students
 * - Handle late admission students
 * - Separate lecture and practical counts
 */
export const getMonthlyAttendance = async (req, res) => {
  try {
    const {
      branchId,
      year,
      division,
      academicYear,  // Required: Academic Year filter
      semester,      // Optional: Semester filter
      startDate,
      endDate,
      subjectId
    } = req.query;
    console.log("QUERY:", req.query);

    // 1️⃣ VALIDATE INPUT
    if (!branchId || !year || !division || !startDate || !endDate) {
      return res.status(400).json({
        message: "branchId, year, division, startDate, endDate are required"
      });
    }

    // Validate academicYear
    if (!academicYear) {
      return res.status(400).json({
        message: "Academic Year is required (e.g., '2024-2025')"
      });
    }

    // 2️⃣ FETCH STUDENTS OF THIS CLASS (EXCLUDE DROPOUTS)
    const studentQuery = {
      branch: branchId,
      year: parseInt(year),
      division,
      academicYear,
      status: { $ne: "dropout" } // Exclude dropouts
    };

    const students = await Student.find(studentQuery)
      .populate("userId", "name");

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
        name: s.userId.name,
        batch: s.batch,
        admissionDate: s.admissionDate
      };
    });

    // 3️⃣ BUILD ATTENDANCE QUERY
    const attendanceQuery = {
      branch: branchId,
      year: parseInt(year),
      division,
      academicYear,
      isCancelled: false, // ⚠️ EXCLUDE CANCELLED LECTURES
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Optional semester filter
    if (semester) {
      attendanceQuery.semester = parseInt(semester);
    }

    // Optional subject filter
    if (subjectId) {
      attendanceQuery.subject = subjectId;
    }

    // 4️⃣ FETCH ATTENDANCE SESSIONS
    const sessions = await AttendanceSession.find(attendanceQuery)
      .populate("subject", "name code");

    // 5️⃣ AGGREGATION LOGIC (LECTURE + PRACTICAL SEPARATE)
    const report = {};

    sessions.forEach((session) => {
      const subjectKey = session.subject._id.toString();

      if (!report[subjectKey]) {
        report[subjectKey] = {
          subject: session.subject,
          totalLectures: 0,
          totalPracticals: 0,
          students: {}
        };
      }

      // Count lectures and practicals separately
      if (session.sessionType === "LECTURE") {
        report[subjectKey].totalLectures += 1;
      } else if (session.sessionType === "PRACTICAL") {
        report[subjectKey].totalPracticals += 1;
      }

      students.forEach((student) => {
        const studentId = student._id.toString();
        const studentInfo = studentMap[studentId];

        // LATE ADMISSION LOGIC: Skip if student joined after session date
        if (studentInfo.admissionDate && studentInfo.admissionDate > session.date) {
          return; // Skip this student for this session
        }

        // BATCH LOGIC: For practicals, only count if batch matches
        if (session.sessionType === "PRACTICAL") {
          if (session.batch !== studentInfo.batch) {
            return; // Skip this student (different batch)
          }
        }

        if (!report[subjectKey].students[studentId]) {
          report[subjectKey].students[studentId] = {
            rollNo: student.rollNo,
            name: student.userId.name,
            batch: studentInfo.batch || "N/A",
            lectureAttended: 0,
            lectureAbsent: 0,
            practicalAttended: 0,
            practicalAbsent: 0
          };
        }

        const isAbsent = session.absentStudents
          .map(id => id.toString())
          .includes(studentId);

        // Update counts based on session type
        if (session.sessionType === "LECTURE") {
          if (isAbsent) {
            report[subjectKey].students[studentId].lectureAbsent += 1;
          } else {
            report[subjectKey].students[studentId].lectureAttended += 1;
          }
        } else if (session.sessionType === "PRACTICAL") {
          if (isAbsent) {
            report[subjectKey].students[studentId].practicalAbsent += 1;
          } else {
            report[subjectKey].students[studentId].practicalAttended += 1;
          }
        }
      });
    });

    // 6️⃣ FORMAT FINAL RESPONSE WITH PERCENTAGES
    const response = Object.values(report).map((subjectBlock) => ({
      subject: subjectBlock.subject,
      totalLectures: subjectBlock.totalLectures,
      totalPracticals: subjectBlock.totalPracticals,
      students: Object.values(subjectBlock.students).map((s) => {
        const totalLectures = s.lectureAttended + s.lectureAbsent;
        const totalPracticals = s.practicalAttended + s.practicalAbsent;
        const totalSessions = totalLectures + totalPracticals;
        const totalAttended = s.lectureAttended + s.practicalAttended;

        return {
          ...s,
          lecturePercentage: totalLectures === 0 ? 0 : Math.round((s.lectureAttended / totalLectures) * 100),
          practicalPercentage: totalPracticals === 0 ? 0 : Math.round((s.practicalAttended / totalPracticals) * 100),
          overallPercentage: totalSessions === 0 ? 0 : Math.round((totalAttended / totalSessions) * 100)
        };
      })
    }));

    res.json({
      dateRange: { startDate, endDate },
      academicYear,
      semester: semester || "All",
      data: response
    });
  } catch (error) {
    console.error("MONTHLY ATTENDANCE ERROR:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message
    });
  }
};
