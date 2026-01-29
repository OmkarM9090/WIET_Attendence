import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import DashboardHeader from "../components/DashboardHeader";
import Card from "../components/Card";
import StatsCard from "../components/StatsCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import { theme } from "../styles/theme";
import axiosInstance from "../utils/axios";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);

  const sidebarItems = [
    { label: "Dashboard", path: "/student", icon: "🏠" },
    { label: "My Attendance", path: "/student/attendance", icon: "📊" },
    { label: "Profile", path: "/student/profile", icon: "👤" },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch student attendance
      const response = await axiosInstance.get("/api/student/attendance");
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setAttendanceData(data);

      // Extract student info from first attendance record if available
      if (data.length > 0) {
        const firstRecord = data[0];
        setStudentInfo({
          branch: firstRecord.subject?.branch || "N/A",
          year: firstRecord.year || "N/A",
          division: firstRecord.division || "N/A",
        });
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.response?.data?.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (attendanceData.length === 0) {
      return {
        totalSubjects: 0,
        overallPercentage: 0,
        totalLectures: 0,
        lowAttendance: 0,
      };
    }

    const totalSubjects = attendanceData.length;
    const totalLectures = attendanceData.reduce((sum, item) => sum + item.totalLectures, 0);
    const totalAttended = attendanceData.reduce((sum, item) => sum + item.attended, 0);
    const overallPercentage = totalLectures > 0 ? Math.round((totalAttended / totalLectures) * 100) : 0;
    const lowAttendance = attendanceData.filter((item) => item.percentage < 75).length;

    return { totalSubjects, overallPercentage, totalLectures, lowAttendance };
  }, [attendanceData]);

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <DashboardHeader title="Student Dashboard" subtitle="View your attendance and academic progress" />

      {error && (
        <div className="mb-4">
          <Alert message={error} type="error" onClose={() => setError("")} />
        </div>
      )}

      {/* Overall Attendance Alert */}
      {stats.overallPercentage < 75 && (
        <div className="mb-6">
          <Alert
            message={`⚠️ Your overall attendance is ${stats.overallPercentage}%. You need at least 75% to be eligible for exams.`}
            type="warning"
          />
        </div>
      )}

      {/* Stats Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <StatsCard
          title="Overall Attendance"
          value={`${stats.overallPercentage}%`}
          icon="📊"
          color={stats.overallPercentage >= 75 ? "success" : "error"}
        />
        <StatsCard title="Total Subjects" value={stats.totalSubjects} icon="📚" color="primary" />
        <StatsCard title="Total Lectures" value={stats.totalLectures} icon="🎓" color="info" />
        <StatsCard
          title="Low Attendance"
          value={stats.lowAttendance}
          icon="⚠️"
          color="warning"
        />
      </div>

      {/* Student Info Card */}
      {studentInfo && (
        <Card className="mb-6">
          <h3 className="mb-4 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
            My Information
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div
                className="text-xs font-medium uppercase"
                style={{ color: theme.colors.text.secondary }}
              >
                Branch
              </div>
              <div
                className="text-sm font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                {studentInfo.branch}
              </div>
            </div>
            <div>
              <div
                className="text-xs font-medium uppercase"
                style={{ color: theme.colors.text.secondary }}
              >
                Year
              </div>
              <div
                className="text-sm font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                {studentInfo.year}
              </div>
            </div>
            <div>
              <div
                className="text-xs font-medium uppercase"
                style={{ color: theme.colors.text.secondary }}
              >
                Division
              </div>
              <div
                className="text-sm font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                {studentInfo.division}
              </div>
            </div>
          </div>
        </Card>
      )}
      {/* Subject-wise Attendance */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
          Subject-wise Attendance
        </h3>

        {attendanceData.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">📚</div>
            <h3
              className="mb-2 text-lg font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              No Attendance Records
            </h3>
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              Your attendance will appear here once your teachers mark it.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead
                style={{
                  backgroundColor: theme.colors.neutral[50],
                  borderBottom: `2px solid ${theme.colors.border}`,
                }}
              >
                <tr>
                  {["Subject", "Code", "Attended", "Total", "Percentage", "Status"].map(
                    (label) => (
                      <th
                        key={label}
                        className="px-4 py-2 text-left text-xs font-semibold uppercase"
                        style={{ color: theme.colors.text.secondary }}
                      >
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((item, idx) => {
                  const percentage = item.percentage || 0;
                  const status =
                    percentage >= 75 ? "Good" : percentage >= 50 ? "Warning" : "Critical";
                  const statusColor =
                    percentage >= 75
                      ? theme.colors.success
                      : percentage >= 50
                      ? theme.colors.warning
                      : theme.colors.error;

                  return (
                    <tr
                      key={idx}
                      style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                    >
                      <td
                        className="px-4 py-3 text-sm font-medium"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {item.subject?.name || "N/A"}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: theme.colors.text.secondary }}
                      >
                        {item.subject?.code || "N/A"}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {item.attended || 0}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {item.totalLectures || 0}
                      </td>
                      <td
                        className="px-4 py-3 text-sm font-bold"
                        style={{ color: statusColor }}
                      >
                        {percentage}%
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${statusColor}20`,
                            color: statusColor,
                          }}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Tips Section */}
      {stats.lowAttendance > 0 && (
        <Card className="mt-6" style={{ backgroundColor: `${theme.colors.warning}10` }}>
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h3
                className="mb-2 font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                Attendance Tips
              </h3>
              <ul className="space-y-1 text-sm" style={{ color: theme.colors.text.secondary }}>
                <li>• Attend classes regularly to maintain good attendance</li>
                <li>• Contact your teachers if you have genuine reasons for absence</li>
                <li>• You need at least 75% attendance to be eligible for exams</li>
                <li>
                  • Focus on improving attendance in subjects where you are below 75%
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
