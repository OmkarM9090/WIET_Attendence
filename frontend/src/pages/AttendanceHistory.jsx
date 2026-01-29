import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import DashboardHeader from "../components/DashboardHeader";
import StatsCard from "../components/StatsCard";
import Card from "../components/Card";
import FormSelect from "../components/FormSelect";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import { theme } from "../styles/theme";
import { getTeacherAttendance } from "../services/attendanceService";

export default function AttendanceHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);

  const [filters, setFilters] = useState({
    subjectId: "",
    sessionType: "",
    startDate: "",
    endDate: "",
    query: "",
  });

  const sidebarItems = [
    { label: "Dashboard", path: "/teacher", icon: "🏠" },
    { label: "Mark Attendance", path: "/teacher/mark-attendance", icon: "✓" },
    { label: "View Attendance", path: "/teacher/attendance-history", icon: "📋" },
    { label: "Reports", path: "/teacher/reports", icon: "📊" },
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

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const subjectMatch = filters.subjectId
        ? s.subject?._id === filters.subjectId
        : true;
      const typeMatch = filters.sessionType
        ? s.sessionType === filters.sessionType
        : true;
      const startMatch = filters.startDate
        ? new Date(s.date) >= new Date(filters.startDate)
        : true;
      const endMatch = filters.endDate
        ? new Date(s.date) <= new Date(filters.endDate)
        : true;
      const queryMatch = filters.query
        ? `${s.subject?.name || ""} ${s.subject?.code || ""} ${s.branch?.code || ""} ${s.branch?.name || ""}`
            .toLowerCase()
            .includes(filters.query.toLowerCase())
        : true;
      return subjectMatch && typeMatch && startMatch && endMatch && queryMatch;
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
      <DashboardLayout sidebarItems={sidebarItems}>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <DashboardHeader
        title="Attendance History"
        subtitle="Review your past attendance sessions"
      />

      {error && (
        <div className="mb-4">
          <Alert message={error} type="error" onClose={() => setError("")} />
        </div>
      )}

      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <StatsCard title="Total Sessions" value={summary.total} icon="📚" color="primary" />
        <StatsCard title="Avg Attendance" value={`${summary.avg}%`} icon="📈" color="success" />
        <StatsCard title="Total Absences" value={summary.absences} icon="⚠️" color="warning" />
      </div>

      <Card className="mb-6">
        <div className="grid gap-4 md:grid-cols-5">
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
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() =>
              setFilters({ subjectId: "", sessionType: "", startDate: "", endDate: "", query: "" })
            }
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {filteredSessions.length === 0 ? (
        <Card>
          <p className="text-center text-sm" style={{ color: theme.colors.text.secondary }}>
            No attendance sessions match the selected filters.
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
                  {[
                    "Date",
                    "Subject",
                    "Class",
                    "Type",
                    "Attendance",
                    "Absentees",
                  ].map((label) => (
                    <th
                      key={label}
                      className="px-4 py-2 text-left text-xs font-semibold uppercase"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => {
                  const absent = session.absentStudents?.length || 0;
                  const present = (session.totalStudents || 0) - absent;
                  const percentage = session.totalStudents
                    ? Math.round((present / session.totalStudents) * 100)
                    : 0;

                  return (
                    <tr
                      key={session._id}
                      style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: theme.colors.text.primary }}>
                        {new Date(session.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: theme.colors.text.primary }}>
                        {session.subject?.name || "N/A"} ({session.subject?.code || ""})
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: theme.colors.text.primary }}>
                        {session.branch?.code || session.branch?.name || ""} {session.year}-{session.division}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: theme.colors.text.primary }}>
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
                      <td className="px-4 py-3 text-sm" style={{ color: theme.colors.text.primary }}>
                        {absent}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
