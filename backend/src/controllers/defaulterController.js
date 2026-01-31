import AttendanceSession from "../models/AttendanceSession.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";

/**
 * GENERATE DEFAULTERS (LECTURE + PRACTICAL)
 * Admin only
 * 
 * ENHANCED WITH:
 * - Exclude cancelled lectures from calculations
 * - Exclude dropout students
 * - Handle late admission students (exclude sessions before admission)
 * - Separate lecture and practical attendance
 * - Configurable threshold (default 75%)
 * - Semester filtering
 */
export const generateDefaulters = async (req, res) => {
  try {
    const { 
      branchId, 
      year, 
      division, 
      academicYear, 
      semester,          // Optional: Filter by semester
      startDate, 
      endDate, 
      threshold = 75     // Configurable threshold (default 75%)
    } = req.query;

    // 1️⃣ VALIDATE REQUIRED FIELDS
    if (!branchId || !year || !division || !startDate || !endDate) {
      return res.status(400).json({
        message: "branchId, year, division, startDate, endDate required"
      });
    }

    // Validate academicYear
    if (!academicYear) {
      return res.status(400).json({
        message: "Academic Year is required (e.g., '2024-2025')"
      });
    }

    // Parse threshold
    const thresholdValue = parseInt(threshold);
    if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
      return res.status(400).json({
        message: "Threshold must be between 0 and 100"
      });
    }

    // 2️⃣ FETCH STUDENTS (EXCLUDE DROPOUTS)
    const studentQuery = {
      branch: branchId,
      year: parseInt(year),
      division,
      academicYear,
      status: { $ne: "dropout" } // ⚠️ EXCLUDE DROPOUTS
    };

    const students = await Student.find(studentQuery)
      .populate("userId", "name");

    if (students.length === 0) {
      return res.status(400).json({
        message: "No students found for this class"
      });
    }

    // 3️⃣ FETCH SUBJECTS
    const subjects = await Subject.find({ branch: branchId });

    // 4️⃣ FETCH ATTENDANCE SESSIONS (EXCLUDE CANCELLED)
    const sessionQuery = {
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
      sessionQuery.semester = parseInt(semester);
    }

    const sessions = await AttendanceSession.find(sessionQuery)
      .populate("subject");

    // 5️⃣ CALCULATE ATTENDANCE PER STUDENT
    const defaulters = [];

    for (const student of students) {
      const subjectMap = {};

      // Initialize subject map
      subjects.forEach(sub => {
        subjectMap[sub.code] = {
          subject: sub,
          lecAttended: 0,
          lecTotal: 0,
          pracAttended: 0,
          pracTotal: 0
        };
      });

      // Process each session
      sessions.forEach(session => {
        const entry = subjectMap[session.subject.code];
        if (!entry) return;

        // LATE ADMISSION LOGIC: Skip sessions before student admission
        if (student.admissionDate && student.admissionDate > session.date) {
          return; // Skip this session for this student
        }

        // BATCH LOGIC: For practicals, only count if batch matches
        if (session.sessionType === "PRACTICAL") {
          if (session.batch !== student.batch) {
            return; // Skip this session (different batch)
          }
        }

        const isAbsent = session.absentStudents
          .map(id => id.toString())
          .includes(student._id.toString());

        // Count lectures
        if (session.sessionType === "LECTURE") {
          entry.lecTotal++;
          if (!isAbsent) entry.lecAttended++;
        }

        // Count practicals
        if (session.sessionType === "PRACTICAL") {
          entry.pracTotal++;
          if (!isAbsent) entry.pracAttended++;
        }
      });

      // Calculate percentages
      let totalPercent = 0;
      let count = 0;
      const summary = {};

      Object.values(subjectMap).forEach(e => {
        const attended = e.lecAttended + e.pracAttended;
        const total = e.lecTotal + e.pracTotal;
        
        if (total === 0) return; // Skip subjects with no sessions

        const percent = Math.round((attended / total) * 100);
        totalPercent += percent;
        count++;

        summary[e.subject.code] = {
          lec: `${e.lecAttended}/${e.lecTotal}`,
          lecPercent: e.lecTotal === 0 ? 0 : Math.round((e.lecAttended / e.lecTotal) * 100),
          prac: `${e.pracAttended}/${e.pracTotal}`,
          pracPercent: e.pracTotal === 0 ? 0 : Math.round((e.pracAttended / e.pracTotal) * 100),
          total: percent
        };
      });

      // Calculate overall percentage
      const overall = count === 0 ? 0 : Math.round(totalPercent / count);

      // Add to defaulters if below threshold
      if (overall < thresholdValue) {
        defaulters.push({
          rollNo: student.rollNo,
          name: student.userId.name,
          academicYear: student.academicYear,
          semester: semester || "All",
          batch: student.batch || "N/A",
          subjects: summary,
          overallPercentage: overall,
          remark: overall < thresholdValue ? "Defaulter" : "Clear"
        });
      }
    }

    res.json({ 
      defaulters, 
      subjects,
      threshold: thresholdValue,
      dateRange: { startDate, endDate },
      academicYear,
      semester: semester || "All"
    });
  } catch (err) {
    console.error("DEFAULTER ERROR:", err);
    res.status(500).json({ 
      message: "Server error",
      error: err.message
    });
  }
};
