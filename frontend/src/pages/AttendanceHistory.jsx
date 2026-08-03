import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import StatsCard from "../components/StatsCard";
import Card from "../components/Card";
import FormSelect from "../components/FormSelect";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import AttendanceDetailPanel from "../components/AttendanceDetailPanel";
import { getTeacherAttendance } from "../services/attendanceService";
import { 
  LayoutDashboard, 
  UserCheck, 
  History, 
  FileText, 
  Search, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Filter,
  ChevronDown
} from "lucide-react";

export default function AttendanceHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  const [filters, setFilters] = useState({
    subjectId: "",
    sessionType: "",
    batch: "",
    startDate: "",
    endDate: "",
    query: "",
  });

  const sidebarItems = [
    { label: "Dashboard", path: "/teacher", icon: <LayoutDashboard size={20} /> },
    { label: "Mark Attendance", path: "/teacher/mark-attendance", icon: <UserCheck size={20} /> },
    { label: "View Attendance", path: "/teacher/attendance-history", icon: <History size={20} /> },
    { label: "Reports", path: "/teacher/reports", icon: <FileText size={20} /> },
  ];

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getTeacherAttendance();
      const payload = response?.data ?? response ?? {};
      const data = payload?.data ?? payload;
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load attendance history");
    } finally {
      setLoading(false);
    }
  };

  const subjectOptions = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      if (s.subject?._id) {
        map.set(s.subject._id, `${s.subject.name || "Subject"} (${s.subject.code || ""})`);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [sessions]);

  const batchOptions = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      const bName = s.batch?.name || (typeof s.batch === "string" ? s.batch : null);
      if (bName) {
        map.set(bName, bName);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const subjectMatch = filters.subjectId
        ? s.subject?._id === filters.subjectId
        : true;
      const typeMatch = filters.sessionType
        ? s.sessionType === filters.sessionType
        : true;
      const sessionBatchName = s.batch?.name || (typeof s.batch === "string" ? s.batch : "");
      const batchMatch = filters.batch
        ? sessionBatchName === filters.batch
        : true;
      const startMatch = filters.startDate
        ? new Date(s.date) >= new Date(filters.startDate)
        : true;
      const endMatch = filters.endDate
        ? new Date(s.date) <= new Date(filters.endDate)
        : true;
      const queryMatch = filters.query
        ? `${s.subject?.name || ""} ${s.subject?.code || ""} ${s.branch?.code || ""} ${s.branch?.name || ""} ${sessionBatchName}`
            .toLowerCase()
            .includes(filters.query.toLowerCase())
        : true;
      return subjectMatch && typeMatch && batchMatch && startMatch && endMatch && queryMatch;
    });
  }, [sessions, filters]);

  const summary = useMemo(() => {
    if (filteredSessions.length === 0) {
      return { total: 0, avg: 0, absences: 0 };
    }
    let totalAttendance = 0;
    let totalAbsences = 0;
    filteredSessions.forEach((s) => {
      const absent = s.absentStudents?.length || 0;
      const present = (s.totalStudents || 0) - absent;
      const percentage = s.totalStudents ? (present / s.totalStudents) * 100 : 0;
      totalAttendance += percentage;
      totalAbsences += absent;
    });
    return {
      total: filteredSessions.length,
      avg: Math.round(totalAttendance / filteredSessions.length),
      absences: totalAbsences,
    };
  }, [filteredSessions]);

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems} title="Attendance History">
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Attendance History"
      subtitle="Review past sessions, inspect roll calls, and export data"
      sidebarItems={sidebarItems}
    >
      {error && (
        <div className="mb-6">
          <Alert message={error} type="error" onClose={() => setError("")} />
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatsCard title="Total Sessions" value={summary.total} icon={<BookOpen size={24} />} color="primary" />
        <StatsCard title="Avg Attendance" value={`${summary.avg}%`} icon={<TrendingUp size={24} />} color="success" />
        <StatsCard title="Total Absences" value={summary.absences} icon={<AlertTriangle size={24} />} color="warning" />
      </div>

      {/* Filter Section */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Filter size={14} /> Filter Sessions
        </div>
        <div className="grid gap-4 md:grid-cols-6">
          <FormSelect
            label="Subject"
            value={filters.subjectId}
            onChange={(e) => setFilters((prev) => ({ ...prev, subjectId: e.target.value }))}
            options={[{ value: "", label: "All Subjects" }, ...subjectOptions]}
          />
          <FormSelect
            label="Session Type"
            value={filters.sessionType}
            onChange={(e) => setFilters((prev) => ({ ...prev, sessionType: e.target.value }))}
            options={[
              { value: "", label: "All Types" },
              { value: "LECTURE", label: "Lecture" },
              { value: "PRACTICAL", label: "Practical" },
            ]}
          />
          <FormSelect
            label="Batch"
            value={filters.batch}
            onChange={(e) => setFilters((prev) => ({ ...prev, batch: e.target.value }))}
            options={[{ value: "", label: "All Batches" }, ...batchOptions]}
          />
          <FormInput
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
          />
          <FormInput
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
          />
          <FormInput
            label="Search"
            type="text"
            placeholder="Subject or branch"
            value={filters.query}
            onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
            icon={<Search size={16} />}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() =>
              setFilters({ subjectId: "", sessionType: "", batch: "", startDate: "", endDate: "", query: "" })
            }
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Sessions Table */}
      {filteredSessions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm font-semibold text-slate-500">
            No attendance sessions match the selected filters.
          </p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Class</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Batch</th>
                  <th className="px-6 py-3.5">Attendance</th>
                  <th className="px-6 py-3.5">Absentees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSessions.map((session) => {
                  const absent = session.absentStudents?.length || 0;
                  const present = (session.totalStudents || 0) - absent;
                  const percentage = session.totalStudents
                    ? Math.round((present / session.totalStudents) * 100)
                    : 0;

                  const isExpanded = expandedSessionId === session._id;
                  const batchName = session.batch?.name || (typeof session.batch === "string" ? session.batch : null);

                  return (
                    <React.Fragment key={session._id}>
                      <tr
                        onClick={() => setExpandedSessionId(isExpanded ? null : session._id)}
                        className={`transition-colors duration-150 cursor-pointer group hover:bg-slate-50/80 ${
                          isExpanded ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800 whitespace-nowrap">
                          {new Date(session.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 whitespace-nowrap">
                          {session.subject?.name || "N/A"} <span className="text-slate-500 font-mono text-xs font-normal">({session.subject?.code || ""})</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                          {session.branch?.code || session.branch?.name || ""} {session.year}-{session.division}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${
                            session.sessionType === "PRACTICAL"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {session.sessionType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700 whitespace-nowrap">
                          {session.sessionType === "PRACTICAL" && batchName ? (
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                              {batchName}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold whitespace-nowrap">
                          <span className={percentage >= 75 ? "text-emerald-600" : "text-rose-600"}>
                            {present}/{session.totalStudents} ({percentage}%)
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-rose-600 whitespace-nowrap">
                          {absent}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="7" className="p-0 border-b border-slate-200">
                            <div className="animate-in fade-in duration-200">
                              <AttendanceDetailPanel 
                                sessionId={session._id} 
                                onClose={() => setExpandedSessionId(null)} 
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
