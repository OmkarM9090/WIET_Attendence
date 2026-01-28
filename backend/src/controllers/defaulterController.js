import AttendanceSession from "../models/AttendanceSession.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";

/**
 * GENERATE DEFAULTERS (LECTURE + PRACTICAL)
 * Admin only
 */
export const generateDefaulters = async (req, res) => {
  try {
    const { branchId, year, division, academicYear, startDate, endDate, threshold = 75 } = req.query;

    if (!branchId || !year || !division || !startDate || !endDate) {
      return res.status(400).json({
        message: "branchId, year, division, startDate, endDate required"
      });
    }

    // Validate academicYear
    if (!academicYear) {
      return res.status(400).json({
        message: "Academic Year is required"
      });
    }

    const students = await Student.find({
      branch: branchId,
      year,
      division,
      academicYear  // Filter by academic year
    }).populate("userId", "name");

    const subjects = await Subject.find({ branch: branchId });

    const sessions = await AttendanceSession.find({
      branch: branchId,
      year,
      division,
      academicYear,  // Filter by academic year
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate("subject");

    const defaulters = [];

    for (const student of students) {
      const subjectMap = {};

      subjects.forEach(sub => {
        subjectMap[sub.code] = {
          subject: sub,
          lecAttended: 0,
          lecTotal: 0,
          pracAttended: 0,
          pracTotal: 0
        };
      });

      sessions.forEach(session => {
        const entry = subjectMap[session.subject.code];
        if (!entry) return;

        const isAbsent = session.absentStudents
          .map(id => id.toString())
          .includes(student._id.toString());

        if (session.sessionType === "LECTURE") {
          entry.lecTotal++;
          if (!isAbsent) entry.lecAttended++;
        }

        if (
          session.sessionType === "PRACTICAL" &&
          session.batch?.toString() === student.batch?.toString()
        ) {
          entry.pracTotal++;
          if (!isAbsent) entry.pracAttended++;
        }
      });

      let totalPercent = 0;
      let count = 0;
      const summary = {};

      Object.values(subjectMap).forEach(e => {
        const attended = e.lecAttended + e.pracAttended;
        const total = e.lecTotal + e.pracTotal;
        if (total === 0) return;

        const percent = Math.round((attended / total) * 100);
        totalPercent += percent;
        count++;

        summary[e.subject.code] = {
          lec: `${e.lecAttended}/${e.lecTotal}`,
          prac: `${e.pracAttended}/${e.pracTotal}`,
          total: percent
        };
      });

      const overall = Math.round(totalPercent / count);

      if (overall < threshold) {
        defaulters.push({
          rollNo: student.rollNo,
          name: student.userId.name,
          academicYear: student.academicYear,  // Include academic year
          batch: student.batchName,
          subjects: summary,
          remark: "Defaulter"
        });
      }
    }

    res.json({ defaulters, subjects });
  } catch (err) {
    console.error("DEFAULTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
