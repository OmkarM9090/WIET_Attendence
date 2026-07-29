import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import FormSelect from "../components/FormSelect";
import FormInput from "../components/FormInput";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import StatsCard from "../components/StatsCard";
import { getMonthlyAttendance } from "../services/attendanceService";
import axiosInstance from "../utils/axios";
import {
  LayoutDashboard,
  UserCheck,
  History,
  FileText,
  BookOpen,
  BarChart3,
  AlertTriangle,
  Filter
} from "lucide-react";

export default function TeacherReports() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [academicYear, setAcademicYear] = useState("2024-25");

  const [reportData, setReportData] = useState(null);

  const sidebarItems = [
    { label: "Dashboard", path: "/teacher", icon: <LayoutDashboard size={18} /> },
    { label: "Mark Attendance", path: "/teacher/mark-attendance", icon: <UserCheck size={18} /> },
    { label: "View Attendance", path: "/teacher/attendance-history", icon: <History size={18} /> },
    { label: "Reports", path: "/teacher/reports", icon: <FileText size={18} /> },
  ];

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const profileRes = await axiosInstance.get("/teacher/me");
      const teacherId = profileRes.data?.data?._id || profileRes.data?._id;

      if (teacherId) {
        const assignmentsRes = await axiosInstance.get(`/teacher/assignments/${teacherId}`);
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
    <DashboardLayout 
      title="Attendance Reports"
      subtitle="Generate detailed attendance reports for your assigned classes"
      sidebarItems={sidebarItems}
    >
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
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Filter size={15} /> Generate Attendance Report
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

        <div className="mt-5 flex justify-end">
          <Button
            onClick={handleGenerateReport}
            disabled={generating || !selectedAssignment}
            loading={generating}
            variant="primary"
          >
            {generating ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </Card>

      {/* Report Summary */}
      {reportData && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <StatsCard
              title="Total Lectures"
              value={stats.totalLectures}
              icon={<BookOpen size={22} />}
              color="primary"
            />
            <StatsCard
              title="Avg Attendance"
              value={`${stats.avgAttendance}%`}
              icon={<BarChart3 size={22} />}
              color="success"
            />
            <StatsCard
              title="Low Attendance"
              value={stats.lowAttendance}
              icon={<AlertTriangle size={22} />}
              color="warning"
            />
          </div>

          {/* Class Info */}
          {assignment && (
            <Card className="mb-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Report Summary Details
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                    Subject
                  </div>
                  <div className="font-extrabold text-slate-900 mt-0.5">
                    {assignment.subject?.name} ({assignment.subject?.code})
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                    Class
                  </div>
                  <div className="font-extrabold text-slate-900 mt-0.5">
                    {assignment.branch?.name} {assignment.year}-{assignment.division}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                    Date Range
                  </div>
                  <div className="font-extrabold text-slate-900 mt-0.5">
                    {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                    Academic Year
                  </div>
                  <div className="font-extrabold text-slate-900 mt-0.5">
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
                <h3 className="text-sm font-bold text-slate-900">
                  Student Attendance Breakdown
                </h3>
              </div>

              {reportData.subjects.map((subj, idx) => (
                <div key={idx} className="mb-6 last:mb-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">
                      {subj.subject?.name || "Subject"} ({subj.subject?.code || ""})
                    </h4>
                    <span className="text-xs font-semibold text-slate-500">
                      Total Lectures: {subj.totalLectures || 0}
                    </span>
                  </div>

                  {subj.students && subj.students.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                          <tr>
                            <th className="px-4 py-2.5 text-left">Roll No</th>
                            <th className="px-4 py-2.5 text-left">Student Name</th>
                            <th className="px-4 py-2.5 text-left">Attended</th>
                            <th className="px-4 py-2.5 text-left">Total</th>
                            <th className="px-4 py-2.5 text-left">Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white font-medium">
                          {subj.students.map((student, studentIdx) => {
                            const percentage = student.percentage || 0;
                            return (
                              <tr key={studentIdx} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-mono font-bold text-slate-800">
                                  {student.rollNo || "N/A"}
                                </td>
                                <td className="px-4 py-2 font-bold text-slate-900">
                                  {student.name || "N/A"}
                                </td>
                                <td className="px-4 py-2 text-slate-700">
                                  {student.attended || 0}
                                </td>
                                <td className="px-4 py-2 text-slate-700">
                                  {subj.totalLectures || 0}
                                </td>
                                <td className="px-4 py-2 font-bold">
                                  <span className={percentage >= 75 ? "text-emerald-600" : "text-rose-600"}>
                                    {percentage.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-xs font-medium text-slate-400 py-4">
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
          <div className="py-12 text-center text-slate-400">
            <BarChart3 size={36} className="mx-auto mb-2 opacity-40 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-700 mb-1">
              No Report Generated
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Select a class, date range, and click "Generate Report" to view attendance statistics.
            </p>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
