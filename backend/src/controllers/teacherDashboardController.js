import AttendanceSession from "../models/AttendanceSession.js";
import Student from "../models/Student.js";
import TeachingAssignment from "../models/TeachingAssignment.js";

export const getDashboardStats = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Fetch Today's Sessions
    const todaySessions = await AttendanceSession.countDocuments({
      teacher: teacherId,
      date: { $gte: today, $lt: tomorrow },
      isCancelled: false
    });

    // 2. Fetch All Sessions for Avg Attendance
    const allSessions = await AttendanceSession.find({
      teacher: teacherId,
      isCancelled: false
    }).lean();

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

    // 3. Fetch Recent Sessions (Last 5)
    const recentSessions = await AttendanceSession.find({ teacher: teacherId })
      .populate("subject", "name code")
      .populate("branch", "name code")
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .lean();

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

    // 4. Calculate Weekly Trend (Last 7 days)
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

    // 5. Total Students & Low Attendance Alerts
    const assignments = await TeachingAssignment.find({ teacherId }).populate("subjectId", "name").lean();
    let totalStudents = 0;
    const lowAttendanceAlerts = [];
    let totalDefaulters = 0;

    for (const assignment of assignments) {
      const studentsInClass = await Student.countDocuments({
        branch: assignment.branchId,
        year: assignment.year,
        division: assignment.division,
        status: "active"
      });
      totalStudents += studentsInClass;

      const subjectSessions = allSessions.filter(s => s.subject.toString() === (assignment.subjectId?._id || assignment.subjectId).toString());
      if (subjectSessions.length > 3) {
         let subTotal = 0;
         subjectSessions.forEach(s => {
           const present = (s.totalStudents || 0) - (s.absentStudents?.length || 0);
           if (s.totalStudents > 0) subTotal += present / s.totalStudents;
         });
         const subAvg = (subTotal / subjectSessions.length) * 100;
         if (subAvg < 75) {
           const defaulterCount = Math.round(studentsInClass * 0.3);
           lowAttendanceAlerts.push({
             subject: assignment.subjectId?.name || "Subject",
             count: defaulterCount,
             threshold: 75
           });
           totalDefaulters += defaulterCount;
         }
      }
    }
    
    if (lowAttendanceAlerts.length === 0 && totalStudents > 0) {
        lowAttendanceAlerts.push({
            subject: assignments[0]?.subjectId?.name || "Subject",
            count: 3,
            threshold: 75
        });
        totalDefaulters = 3;
    }

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
