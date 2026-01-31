import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import DashboardHeader from "../components/DashboardHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import FormSelect from "../components/FormSelect";
import FormInput from "../components/FormInput";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import StatsCard from "../components/StatsCard";
import { theme } from "../styles/theme";
import { getMonthlyAttendance } from "../services/attendanceService";
import axiosInstance from "../utils/axios";

export default function TeacherReports() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Teacher data
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState("");

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [academicYear, setAcademicYear] = useState("2024-25");

  // Report data
  const [reportData, setReportData] = useState(null);

  const sidebarItems = [
    { label: "Dashboard", path: "/teacher", icon: "🏠" },
    { label: "Mark Attendance", path: "/teacher/mark-attendance", icon: "✓" },
    { label: "View Attendance", path: "/teacher/attendance-history", icon: "📋" },
    { label: "Reports", path: "/teacher/reports", icon: "📊" },
  ];

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const profileRes = await axiosInstance.get("/api/teacher/me");
      const teacherId = profileRes.data?.data?._id || profileRes.data?._id;

      if (teacherId) {
        const assignmentsRes = await axiosInstance.get(`/api/teacher/assignments/${teacherId}`);
        const data = assignmentsRes.data?.data || assignmentsRes.data || [];
        setAssignments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError("Failed to load teaching assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedAssignment) {
      setError("Please select a class");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select start and end dates");
      return;
    }
    if (!academicYear) {
      setError("Please enter academic year");
      return;
    }

    const assignment = assignments.find((a) => a._id === selectedAssignment);
    if (!assignment) return;

    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      const response = await getMonthlyAttendance({
        branchId: assignment.branch._id,
        year: assignment.year,
        division: assignment.division,
        academicYear,
        startDate,
        endDate,
        subjectId: assignment.subject._id,
      });

      const payload = response?.data ?? response;
      setReportData(payload);
      setSuccess("Report generated successfully!");
    } catch (err) {
      setError(err.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const stats = useMemo(() => {
    if (!reportData || !reportData.subjects || reportData.subjects.length === 0) {
      return { totalLectures: 0, avgAttendance: 0, lowAttendance: 0 };
    }

    let totalLectures = 0;
    let totalAttendance = 0;
    let lowCount = 0;

    reportData.subjects.forEach((subj) => {
      totalLectures += subj.totalLectures || 0;
      if (subj.students && Array.isArray(subj.students)) {
        subj.students.forEach((student) => {
          const percentage = student.percentage || 0;
          totalAttendance += percentage;
          if (percentage < 75) lowCount++;
        });
      }
    });

    const totalStudents = reportData.subjects.reduce(
      (sum, subj) => sum + (subj.students?.length || 0),
      0
    );
    const avgAttendance = totalStudents > 0 ? Math.round(totalAttendance / totalStudents) : 0;

    return { totalLectures, avgAttendance, lowAttendance: lowCount };
  }, [reportData]);

  const assignment = assignments.find((a) => a._id === selectedAssignment);

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <DashboardHeader
        title="Attendance Reports"
        subtitle="Generate detailed attendance reports for your classes"
      />

      {error && (
        <div className="mb-4">
          <Alert message={error} type="error" onClose={() => setError("")} />
        </div>
      )}

      {success && (
        <div className="mb-4">
          <Alert message={success} type="success" onClose={() => setSuccess("")} />
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <h3
          className="mb-4 text-lg font-semibold"
          style={{ color: theme.colors.text.primary }}
        >
          Generate Report
        </h3>

        <div className="grid gap-4 md:grid-cols-4">
          <FormSelect
            label="Select Class"
            value={selectedAssignment}
            onChange={(e) => setSelectedAssignment(e.target.value)}
            options={[
              { value: "", label: "-- Select Class --" },
              ...assignments.map((a) => ({
                value: a._id,
                label: `${a.subject?.name || "N/A"} - ${a.branch?.code || ""} ${a.year}-${a.division}`,
              })),
            ]}
            required
          />
          <FormInput
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <FormInput
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
          <FormInput
            label="Academic Year"
            type="text"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="e.g., 2024-25"
            required
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleGenerateReport}
            disabled={generating || !selectedAssignment}
            loading={generating}
          >
            {generating ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </Card>

      {/* Report Summary */}
      {reportData && (
        <>
          <div className="mb-6 grid gap-6 md:grid-cols-3">
            <StatsCard
              title="Total Lectures"
              value={stats.totalLectures}
              icon="📚"
              color="primary"
            />
            <StatsCard
              title="Avg Attendance"
              value={`${stats.avgAttendance}%`}
              icon="📈"
              color="success"
            />
            <StatsCard
              title="Low Attendance"
              value={stats.lowAttendance}
              icon="⚠️"
              color="warning"
            />
          </div>

          {/* Class Info */}
          {assignment && (
            <Card className="mb-6">
              <div className="mb-4">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: theme.colors.text.primary }}
                >
                  Report Details
                </h3>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <div
                    className="text-xs font-medium uppercase"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Subject
                  </div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {assignment.subject?.name} ({assignment.subject?.code})
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs font-medium uppercase"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Class
                  </div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {assignment.branch?.name} {assignment.year}-{assignment.division}
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs font-medium uppercase"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Period
                  </div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs font-medium uppercase"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Academic Year
                  </div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {academicYear}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Student-wise Attendance */}
          {reportData.subjects && reportData.subjects.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: theme.colors.text.primary }}
                >
                  Student-wise Attendance
                </h3>
              </div>

              {reportData.subjects.map((subject, idx) => (
                <div key={idx} className="mb-6 last:mb-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h4
                      className="font-semibold"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {subject.subject?.name || "Subject"} ({subject.subject?.code || ""})
                    </h4>
                    <span
                      className="text-sm"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Total Lectures: {subject.totalLectures || 0}
                    </span>
                  </div>

                  {subject.students && subject.students.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead
                          style={{
                            backgroundColor: theme.colors.neutral[50],
                            borderBottom: `2px solid ${theme.colors.border}`,
                          }}
                        >
                          <tr>
                            {["Roll No", "Student Name", "Attended", "Total", "Percentage"].map(
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
                          {subject.students.map((student, studentIdx) => {
                            const percentage = student.percentage || 0;
                            const color =
                              percentage >= 75
                                ? theme.colors.success
                                : percentage >= 50
                                ? theme.colors.warning
                                : theme.colors.error;

                            return (
                              <tr
                                key={studentIdx}
                                style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                              >
                                <td
                                  className="px-4 py-3 text-sm"
                                  style={{ color: theme.colors.text.primary }}
                                >
                                  {student.rollNo || "N/A"}
                                </td>
                                <td
                                  className="px-4 py-3 text-sm"
                                  style={{ color: theme.colors.text.primary }}
                                >
                                  {student.name || "N/A"}
                                </td>
                                <td
                                  className="px-4 py-3 text-sm"
                                  style={{ color: theme.colors.text.primary }}
                                >
                                  {student.attended || 0}
                                </td>
                                <td
                                  className="px-4 py-3 text-sm"
                                  style={{ color: theme.colors.text.primary }}
                                >
                                  {subject.totalLectures || 0}
                                </td>
                                <td
                                  className="px-4 py-3 text-sm font-semibold"
                                  style={{ color }}
                                >
                                  {percentage.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p
                      className="text-center text-sm"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      No student data available
                    </p>
                  )}
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      {!reportData && !generating && (
        <Card>
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">📊</div>
            <h3
              className="mb-2 text-lg font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              No Report Generated
            </h3>
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              Select a class, date range, and click "Generate Report" to view attendance statistics
            </p>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
