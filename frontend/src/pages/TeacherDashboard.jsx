import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../styles/theme";
import DashboardLayout from "../components/DashboardLayout";
import StatsCard from "../components/StatsCard";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import axiosInstance from "../utils/axios";

export default function TeacherDashboard() {
  const navigate = useNavigate();

  // Data
  const [assignments, setAssignments] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    sessionsMarked: 0,
    avgAttendance: 0,
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sidebarItems = [
    { label: "Dashboard", path: "/teacher", icon: "🏠" },
    { label: "Mark Attendance", path: "/teacher/mark-attendance", icon: "✓" },
    { label: "Daily Report", path: "/teacher/daily-report", icon: "📝" },
    { label: "View Attendance", path: "/teacher/attendance-history", icon: "📋" },
    { label: "Reports", path: "/teacher/reports", icon: "📊" },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch teacher's assignments
      const teacherRes = await axiosInstance.get("/teacher/me");
      const teacherId = teacherRes.data?.data?._id;

      if (!teacherId) {
        setError("Teacher profile not found");
        setLoading(false);
        return;
      }

      // Fetch teaching assignments
      const assignmentsRes = await axiosInstance.get(`/teacher/assignments/${teacherId}`);
      const assignmentsData = assignmentsRes.data?.data || [];
      setAssignments(assignmentsData);

      // Fetch recent attendance sessions
      const sessionsRes = await axiosInstance.get("/attendance");
      const sessionsData = sessionsRes.data?.data || [];
      setRecentSessions(sessionsData.slice(0, 5));

      // Calculate stats
      const totalClasses = assignmentsData.length;
      const sessionsMarked = sessionsData.length;
      
      // Calculate average attendance
      let totalAttendance = 0;
      sessionsData.forEach(session => {
        const present = session.totalStudents - (session.absentStudents?.length || 0);
        const percentage = session.totalStudents > 0 ? (present / session.totalStudents) * 100 : 0;
        totalAttendance += percentage;
      });
      const avgAttendance = sessionsData.length > 0 ? Math.round(totalAttendance / sessionsData.length) : 0;

      setStats({
        totalClasses,
        sessionsMarked,
        avgAttendance,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Teacher Dashboard" sidebarItems={sidebarItems}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Teacher Dashboard"
      subtitle="Manage attendance and view your classes"
      sidebarItems={sidebarItems}
    >
      {/* Error Alert */}
      {error && (
        <div className="mb-4">
          <Alert message={error} type="error" onClose={() => setError("")} />
        </div>
      )}

      {/* Stats Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <StatsCard
          title="Assigned Classes"
          value={stats.totalClasses}
          icon="📚"
          iconBg={theme.colors.primary[100]}
          iconColor={theme.colors.primary[600]}
        />
        <StatsCard
          title="Sessions Marked"
          value={stats.sessionsMarked}
          icon="✓"
          iconBg={theme.colors.success + "20"}
          iconColor={theme.colors.success}
        />
        <StatsCard
          title="Avg Attendance"
          value={`${stats.avgAttendance}%`}
          icon="📊"
          iconBg={theme.colors.warning + "20"}
          iconColor={theme.colors.warning}
        />
      </div>

      {/* Quick Actions */}
      <section className="mb-8">
        <h3
          className="mb-4 text-lg font-semibold"
          style={{ color: theme.colors.text.primary }}
        >
          Quick Actions
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => navigate("/teacher/mark-attendance")}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: theme.colors.primary[100] }}
              >
                <span className="text-2xl">✓</span>
              </div>
              <div>
                <h4
                  className="font-semibold"
                  style={{ color: theme.colors.text.primary }}
                >
                  Mark Attendance
                </h4>
                <p
                  className="text-sm"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Record attendance for today's classes
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => navigate("/teacher/attendance-history")}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: theme.colors.success + "20" }}
              >
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h4
                  className="font-semibold"
                  style={{ color: theme.colors.text.primary }}
                >
                  View History
                </h4>
                <p
                  className="text-sm"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Check past attendance records
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Assigned Classes */}
      <section className="mb-8">
        <h3
          className="mb-4 text-lg font-semibold"
          style={{ color: theme.colors.text.primary }}
        >
          Your Assigned Classes ({assignments.length})
        </h3>
        {assignments.length === 0 ? (
          <Card>
            <p
              className="text-center text-sm"
              style={{ color: theme.colors.text.secondary }}
            >
              No classes assigned yet. Contact admin for assignments.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map((assignment) => (
              <Card key={assignment._id} className="transition-shadow hover:shadow-md">
                <div className="mb-2">
                  <h4
                    className="font-semibold"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {assignment.subject?.name || "Unknown Subject"}
                  </h4>
                  <p
                    className="text-xs"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {assignment.subject?.code || "N/A"}
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <p style={{ color: theme.colors.text.secondary }}>
                    <span className="font-medium">Branch:</span>{" "}
                    {assignment.branch?.code || "N/A"}
                  </p>
                  <p style={{ color: theme.colors.text.secondary }}>
                    <span className="font-medium">Class:</span> Year {assignment.year}, Div {assignment.division}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recent Attendance Sessions */}
      <section>
        <h3
          className="mb-4 text-lg font-semibold"
          style={{ color: theme.colors.text.primary }}
        >
          Recent Attendance Sessions
        </h3>
        {recentSessions.length === 0 ? (
          <Card>
            <p
              className="text-center text-sm"
              style={{ color: theme.colors.text.secondary }}
            >
              No attendance sessions recorded yet.
            </p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead
                  style={{
                    backgroundColor: theme.colors.neutral[50],
                    borderBottom: `2px solid ${theme.colors.border}`,
                  }}
                >
                  <tr>
                    <th
                      className="px-4 py-2 text-left text-xs font-semibold uppercase"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Date
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-semibold uppercase"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Subject
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-semibold uppercase"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Class
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-semibold uppercase"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Type
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-semibold uppercase"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Attendance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session) => {
                    const present = session.totalStudents - (session.absentStudents?.length || 0);
                    const percentage = session.totalStudents > 0
                      ? Math.round((present / session.totalStudents) * 100)
                      : 0;

                    return (
                      <tr
                        key={session._id}
                        style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                      >
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: theme.colors.text.primary }}
                        >
                          {new Date(session.date).toLocaleDateString()}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: theme.colors.text.primary }}
                        >
                          {session.subject?.name || "N/A"}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: theme.colors.text.primary }}
                        >
                          {session.year}-{session.division}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: theme.colors.text.primary }}
                        >
                          {session.sessionType}
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-medium"
                          style={{
                            color: percentage >= 75 ? theme.colors.success : theme.colors.error,
                          }}
                        >
                          {present}/{session.totalStudents} ({percentage}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </DashboardLayout>
  );
}
