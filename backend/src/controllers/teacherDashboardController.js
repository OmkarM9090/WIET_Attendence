import AttendanceSession from "../models/AttendanceSession.js";
import Student from "../models/Student.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import Subject from "../models/Subject.js";

const ALERT_THRESHOLD_PERCENT = 75;

const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  return String(value);
};

const buildClassKey = ({ branch, year, division, academicYear }) =>
  `${toIdString(branch)}|${year}|${String(division || "").toUpperCase()}|${academicYear || ""}`;

const normalizeClassDescriptor = ({ branch, year, division, academicYear }) => ({
  branch: toIdString(branch),
  year: Number(year),
  division: String(division || "").toUpperCase(),
  academicYear: academicYear || null
});

export const getDashboardStats = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Fetch core dashboard data in parallel.
    const [todaySessions, allSessions, recentSessions, assignments] = await Promise.all([
      AttendanceSession.countDocuments({
        teacher: teacherId,
        date: { $gte: today, $lt: tomorrow },
        isCancelled: false
      }),
      AttendanceSession.find({
        teacher: teacherId,
        isCancelled: false
      })
        .select("date subject branch year division academicYear sessionType batch absentStudents totalStudents")
        .lean(),
      AttendanceSession.find({ teacher: teacherId })
        .populate("subject", "name code")
        .populate("branch", "name code")
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .lean(),
      TeachingAssignment.find({ teacherId, isActive: true })
        .populate("subjectId", "name")
        .lean()
    ]);

    let totalAttendancePercent = 0;
    let validSessionsCount = 0;

    allSessions.forEach(session => {
      const absent = session.absentStudents?.length || 0;
      const present = (session.totalStudents || 0) - absent;
      if (session.totalStudents > 0) {
        totalAttendancePercent += (present / session.totalStudents) * 100;
        validSessionsCount++;
      }
    });

    const avgAttendance = validSessionsCount > 0 
      ? Number((totalAttendancePercent / validSessionsCount).toFixed(1)) 
      : 0;

    const formattedRecentSessions = recentSessions.map(session => {
      const absent = session.absentStudents?.length || 0;
      const present = (session.totalStudents || 0) - absent;
      const percentage = session.totalStudents > 0 
        ? Math.round((present / session.totalStudents) * 100) 
        : 0;
      
      return {
        _id: session._id,
        date: session.date,
        subject: session.subject?.name,
        code: session.subject?.code,
        classInfo: `${session.branch?.code || ''} ${session.year}-${session.division}`,
        percentage,
        status: session.isCancelled ? "Cancelled" : "Completed"
      };
    });

    // 3. Calculate Weekly Trend (Last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weeklySessions = await AttendanceSession.find({
      teacher: teacherId,
      date: { $gte: sevenDaysAgo, $lt: tomorrow },
      isCancelled: false
    }).lean();

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trendMap = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      trendMap[d.toDateString()] = { day: days[d.getDay()], totalPercent: 0, count: 0 };
    }

    weeklySessions.forEach(session => {
      const dateStr = new Date(session.date).toDateString();
      if (trendMap[dateStr]) {
        const absent = session.absentStudents?.length || 0;
        const present = (session.totalStudents || 0) - absent;
        if (session.totalStudents > 0) {
          trendMap[dateStr].totalPercent += (present / session.totalStudents) * 100;
          trendMap[dateStr].count++;
        }
      }
    });

    const weeklyTrend = Object.values(trendMap).map(item => ({
      day: item.day,
      percentage: item.count > 0 ? Math.round(item.totalPercent / item.count) : 0
    }));

    // 4. Build class scope from assignments + taken sessions.
    const classDescriptorMap = new Map();

    assignments.forEach((assignment) => {
      const descriptor = normalizeClassDescriptor({
        branch: assignment.branchId,
        year: assignment.year,
        division: assignment.division,
        academicYear: assignment.academicYear
      });
      classDescriptorMap.set(buildClassKey(descriptor), descriptor);
    });

    allSessions.forEach((session) => {
      const descriptor = normalizeClassDescriptor({
        branch: session.branch,
        year: session.year,
        division: session.division,
        academicYear: session.academicYear
      });
      classDescriptorMap.set(buildClassKey(descriptor), descriptor);
    });

    const classDescriptors = [...classDescriptorMap.values()];
    const classOrFilters = classDescriptors.map((d) => {
      const filter = {
        branch: d.branch,
        year: d.year,
        division: d.division
      };

      if (d.academicYear) {
        filter.academicYear = d.academicYear;
      }

      return filter;
    });

    // 5. Load unique active students in all mapped classes.
    const students = classOrFilters.length > 0
      ? await Student.find({
          status: "active",
          isDeleted: { $ne: true },
          $or: classOrFilters
        })
          .select("_id branch year division academicYear admissionDate batch")
          .lean()
      : [];

    const studentById = new Map(students.map((student) => [toIdString(student._id), student]));
    const classStudentMap = new Map();

    students.forEach((student) => {
      const key = buildClassKey({
        branch: student.branch,
        year: student.year,
        division: student.division,
        academicYear: student.academicYear
      });
      const list = classStudentMap.get(key) || [];
      list.push(toIdString(student._id));
      classStudentMap.set(key, list);
    });

    const totalStudents = studentById.size;

    // 6. Compute defaulters and alerts from actual attendance.
    const studentStats = new Map();
    const getStudentStats = (studentId) => {
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          total: 0,
          present: 0,
          subject: new Map()
        });
      }
      return studentStats.get(studentId);
    };

    allSessions.forEach((session) => {
      const classKey = buildClassKey({
        branch: session.branch,
        year: session.year,
        division: session.division,
        academicYear: session.academicYear
      });

      const classStudentIds = classStudentMap.get(classKey) || [];
      if (classStudentIds.length === 0) return;

      const subjectKey = toIdString(session.subject);
      const absentSet = new Set((session.absentStudents || []).map((id) => toIdString(id)));
      const sessionBatch = toIdString(session.batch);

      classStudentIds.forEach((studentId) => {
        const student = studentById.get(studentId);
        if (!student) return;

        if (student.admissionDate && new Date(student.admissionDate) > new Date(session.date)) {
          return;
        }

        if (session.sessionType === "PRACTICAL") {
          const studentBatch = toIdString(student.batch);
          if (sessionBatch && studentBatch && sessionBatch !== studentBatch) {
            return;
          }
        }

        const stats = getStudentStats(studentId);
        stats.total += 1;
        if (!absentSet.has(studentId)) {
          stats.present += 1;
        }

        if (subjectKey) {
          const subjectStats = stats.subject.get(subjectKey) || { total: 0, present: 0 };
          subjectStats.total += 1;
          if (!absentSet.has(studentId)) {
            subjectStats.present += 1;
          }
          stats.subject.set(subjectKey, subjectStats);
        }
      });
    });

    const subjectNameMap = new Map();
    assignments.forEach((assignment) => {
      const subjectId = toIdString(assignment.subjectId);
      if (subjectId && assignment.subjectId?.name) {
        subjectNameMap.set(subjectId, assignment.subjectId.name);
      }
    });

    const unknownSubjectIds = [...new Set(allSessions.map((session) => toIdString(session.subject)).filter(Boolean))]
      .filter((subjectId) => !subjectNameMap.has(subjectId));

    if (unknownSubjectIds.length > 0) {
      const subjectDocs = await Subject.find({ _id: { $in: unknownSubjectIds } }).select("name").lean();
      subjectDocs.forEach((subject) => {
        subjectNameMap.set(toIdString(subject._id), subject.name);
      });
    }

    const subjectDefaulterCounts = new Map();
    let totalDefaulters = 0;

    studentStats.forEach((stats) => {
      if (stats.total === 0) return;

      const overallPercent = (stats.present / stats.total) * 100;
      if (overallPercent >= ALERT_THRESHOLD_PERCENT) return;

      totalDefaulters += 1;

      stats.subject.forEach((subjectStats, subjectId) => {
        if (subjectStats.total === 0) return;
        const subjectPercent = (subjectStats.present / subjectStats.total) * 100;
        if (subjectPercent < ALERT_THRESHOLD_PERCENT) {
          subjectDefaulterCounts.set(subjectId, (subjectDefaulterCounts.get(subjectId) || 0) + 1);
        }
      });
    });

    const lowAttendanceAlerts = [...subjectDefaulterCounts.entries()]
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([subjectId, count]) => ({
        subject: subjectNameMap.get(subjectId) || "Subject",
        count,
        threshold: ALERT_THRESHOLD_PERCENT
      }));

    res.json({
      success: true,
      todaySessions,
      avgAttendance,
      totalDefaulters,
      totalStudents,
      recentSessions: formattedRecentSessions,
      weeklyTrend,
      lowAttendanceAlerts
    });

  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error);
    res.status(500).json({ success: false, message: "Error fetching dashboard stats" });
  }
};
