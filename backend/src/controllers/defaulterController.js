import AttendanceSession from "../models/AttendanceSession.js";
import Student from "../models/Student.js";
import Defaulter from "../models/Defaulter.js";

/**
 * GENERATE DEFAULTER LIST
 * Admin / Teacher
 */
export const generateDefaulters = async (req, res) => {
  try {
    const {
      branchId,
      year,
      division,
      startDate,
      endDate,
      subjectId,
      thresholdPercent = 75
    } = req.query;

    // 1️. Validate input
    if (!branchId || !year || !division || !startDate || !endDate) {
      return res.status(400).json({
        message: "branchId, year, division, startDate, endDate are required"
      });
    }

    // 2️. Fetch students
    const students = await Student.find({
      branch: branchId,
      year,
      division
    });

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    // 3️. Fetch attendance sessions
    const sessionFilter = {
      branch: branchId,
      year,
      division,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (subjectId) sessionFilter.subject = subjectId;

    const sessions = await AttendanceSession.find(sessionFilter);

    // 4️. Calculate attendance per student
    const defaulters = [];

    students.forEach((student) => {
      let totalLectures = 0;
      let attended = 0;

      sessions.forEach((session) => {
        totalLectures++;

        const isAbsent = session.absentStudents
          .map(id => id.toString())
          .includes(student._id.toString());

        if (!isAbsent) attended++;
      });

      const percentage = totalLectures === 0
        ? 0
        : Math.round((attended / totalLectures) * 100);

      if (percentage < thresholdPercent) {
        defaulters.push({
          studentId: student._id,
          rollNo: student.rollNo,
          name: student.name,
          percentPresent: percentage
        });
      }
    });

    // 5️. Save defaulter record
    const record = await Defaulter.create({
      subject: subjectId || null,
      branch: branchId,
      year,
      division,
      periodStart: startDate,
      periodEnd: endDate,
      thresholdPercent,
      list: defaulters,
      createdBy: req.user.id
    });

    res.json({
      totalStudents: students.length,
      defaultersCount: defaulters.length,
      defaulters,
      recordId: record._id
    });

  } catch (error) {
    console.error("DEFAULTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
