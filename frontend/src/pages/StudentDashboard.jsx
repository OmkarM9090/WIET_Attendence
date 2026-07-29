import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import Card from "../components/Card";
import StatsCard from "../components/StatsCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import axiosInstance from "../utils/axios";
import { 
  LayoutDashboard, 
  BarChart3, 
  User, 
  BookOpen, 
  GraduationCap, 
  AlertTriangle,
  Lightbulb,
  CheckCircle2
} from "lucide-react";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);

  const sidebarItems = [
    { label: "Dashboard", path: "/student", icon: <LayoutDashboard size={20} /> },
    { label: "My Attendance", path: "/student/attendance", icon: <BarChart3 size={20} /> },
    { label: "Profile", path: "/student/profile", icon: <User size={20} /> },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get("/student/attendance");
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setAttendanceData(data);

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
      <DashboardLayout sidebarItems={sidebarItems} title="Student Dashboard">
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      sidebarItems={sidebarItems} 
      title="Student Dashboard"
      subtitle="Track your course attendance and academic progress"
    >
      {error && (
        <div className="mb-4">
          <Alert message={error} type="error" onClose={() => setError("")} />
        </div>
      )}

      {/* Overall Attendance Alert */}
      {stats.overallPercentage < 75 && (
        <div className="mb-6">
          <Alert
            message={`Your overall attendance is ${stats.overallPercentage}%. Minimum 75% is required for exam eligibility.`}
            type="warning"
          />
        </div>
      )}

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Overall Attendance"
          value={`${stats.overallPercentage}%`}
          icon={<BarChart3 size={24} />}
          color={stats.overallPercentage >= 75 ? "success" : "error"}
        />
        <StatsCard title="Total Subjects" value={stats.totalSubjects} icon={<BookOpen size={24} />} color="primary" />
        <StatsCard title="Total Lectures" value={stats.totalLectures} icon={<GraduationCap size={24} />} color="info" />
        <StatsCard
          title="Low Attendance"
          value={stats.lowAttendance}
          icon={<AlertTriangle size={24} />}
          color="warning"
        />
      </div>

      {/* Student Info Card */}
      {studentInfo && (
        <Card className="mb-6">
          <h3 className="mb-4 text-base font-bold text-slate-900">
            Academic Information
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Branch
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {studentInfo.branch}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Year
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {studentInfo.year}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Division
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {studentInfo.division}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Subject-wise Attendance */}
      <Card>
        <h3 className="mb-4 text-base font-bold text-slate-900">
          Subject-wise Attendance Breakdown
        </h3>

        {attendanceData.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <BookOpen size={36} className="mx-auto mb-2 opacity-40 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-700 mb-1">
              No Attendance Records Found
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Your attendance records will appear here once your teachers log sessions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar border border-slate-200/80 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                  {["Subject", "Code", "Attended", "Total", "Percentage", "Status"].map(
                    (label) => (
                      <th key={label} className="px-5 py-3.5 whitespace-nowrap">
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {attendanceData.map((item, idx) => {
                  const percentage = item.percentage || 0;
                  const isGood = percentage >= 75;
                  const isWarning = percentage >= 50 && percentage < 75;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 text-sm font-bold text-slate-900 whitespace-nowrap">
                        {item.subject?.name || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono font-bold text-slate-600 whitespace-nowrap">
                        {item.subject?.code || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {item.attended || 0}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {item.totalLectures || 0}
                      </td>
                      <td className={`px-5 py-4 text-sm font-extrabold whitespace-nowrap ${
                        isGood ? "text-emerald-600" : isWarning ? "text-amber-600" : "text-rose-600"
                      }`}>
                        {percentage}%
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isGood 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : isWarning 
                            ? "bg-amber-50 text-amber-700 border-amber-200" 
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {isGood ? "Good" : isWarning ? "Warning" : "Critical"}
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
        <Card className="mt-6 border-amber-200/80 bg-amber-50/50">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
              <Lightbulb size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950 mb-1">
                Attendance Requirements & Tips
              </h3>
              <ul className="space-y-1 text-xs text-amber-900 font-medium">
                <li>• Attend classes regularly to maintain good attendance standing.</li>
                <li>• Minimum 75% aggregate attendance is mandatory for exam eligibility.</li>
                <li>• Prioritize subjects currently marked below 75%.</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
