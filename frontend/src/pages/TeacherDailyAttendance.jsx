import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import DashboardHeader from "../components/DashboardHeader";
import Button from "../components/Button";
import FormSelect from "../components/FormSelect";
import FormInput from "../components/FormInput";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import Card from "../components/Card";
import AttendanceReportCard from "../components/AttendanceReportCard";
import { theme } from "../styles/theme";
import { createDailyAttendanceReport } from "../services/attendanceService";
import { getStudents } from "../services/adminService";
import axiosInstance from "../utils/axios";

const TeacherDailyAttendance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });

  // Data states
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);

  // Form states
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [sessionType, setSessionType] = useState("LECTURE");
  const [batch, setBatch] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [absentRollInput, setAbsentRollInput] = useState("");
  const [absentRollNos, setAbsentRollNos] = useState(new Set());

  // Report states
  const [reportText, setReportText] = useState("");
  const [absentStudents, setAbsentStudents] = useState([]);

  const todayDate = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const sidebarItems = [
    { path: "/teacher", label: "Dashboard", icon: "📊" },
    { path: "/teacher/mark-attendance", label: "Mark Attendance", icon: "✓" },
    { path: "/teacher/daily-report", label: "Daily Report", icon: "📝" },
    { path: "/teacher/attendance-history", label: "View Attendance", icon: "📖" },
    { path: "/teacher/reports", label: "Reports", icon: "📄" },
  ];

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      fetchStudents();
    }
  }, [selectedAssignment]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const profileResponse = await axiosInstance.get("/teacher/me");
      const profileData = profileResponse.data;

      if (profileData.success) {
        const teacherId = profileData.data._id;
        const assignmentsResponse = await axiosInstance.get(`/teacher/assignments/${teacherId}`);
        const assignmentsData = assignmentsResponse.data;

        if (assignmentsData.success) {
          setAssignments(assignmentsData.data || []);
        }
      }
    } catch (error) {
      setAlert({
        message: error.response?.data?.message || "Failed to load assignments",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    const assignment = assignments.find((a) => a._id === selectedAssignment);
    if (!assignment) return;

    try {
      const response = await getStudents(
        assignment.branch?._id,
        assignment.year,
        assignment.division
      );

      if (response.success) {
        setStudents(response.data || []);
        setAbsentRollNos(new Set());
        setAbsentStudents([]);
        setReportText("");
      }
    } catch (error) {
      setAlert({ message: "Failed to load students", type: "error" });
    }
  };

  const handleAssignmentChange = (e) => {
    setSelectedAssignment(e.target.value);
    setStudents([]);
    setAbsentRollNos(new Set());
    setReportText("");
    setBatch("");
  };

  const handleAddRolls = () => {
    if (!absentRollInput.trim()) return;

    const parsed = absentRollInput
      .split(",")
      .map((r) => Number(r.trim()))
      .filter((r) => !Number.isNaN(r));

    if (parsed.length === 0) {
      setAlert({ message: "Enter valid roll numbers", type: "error" });
      return;
    }

    const studentRollSet = new Set(students.map((s) => s.rollNo));
    const invalid = parsed.filter((r) => !studentRollSet.has(r));
    const valid = parsed.filter((r) => studentRollSet.has(r));

    const updated = new Set(absentRollNos);
    valid.forEach((r) => updated.add(r));

    setAbsentRollNos(updated);
    setAbsentRollInput("");

    if (invalid.length > 0) {
      setAlert({
        message: `Invalid roll numbers for this class: ${invalid.join(", ")}`,
        type: "error",
      });
    }
  };

  const toggleAbsentRoll = (rollNo) => {
    const updated = new Set(absentRollNos);
    if (updated.has(rollNo)) {
      updated.delete(rollNo);
    } else {
      updated.add(rollNo);
    }
    setAbsentRollNos(updated);
  };

  const handleGenerateReport = async () => {
    const assignment = assignments.find((a) => a._id === selectedAssignment);
    if (!assignment) {
      setAlert({ message: "Please select a subject", type: "error" });
      return;
    }

    if (!startTime || !endTime) {
      setAlert({ message: "Please select time range", type: "error" });
      return;
    }

    if (sessionType === "PRACTICAL" && !batch) {
      setAlert({ message: "Batch is required for practical sessions", type: "error" });
      return;
    }

    if (sessionType === "LECTURE" && batch) {
      setAlert({ message: "Batch should not be sent for lecture", type: "error" });
      return;
    }

    if (absentRollNos.size === 0) {
      setAlert({ message: "Please add at least one absent roll number", type: "error" });
      return;
    }

    const payload = {
      subjectId: assignment.subject._id,
      branchId: assignment.branch._id,
      year: assignment.year,
      division: assignment.division,
      sessionType,
      batch: sessionType === "PRACTICAL" ? batch : undefined,
      startTime,
      endTime,
      absentRollNos: Array.from(absentRollNos),
    };

    try {
      setSubmitting(true);
      const response = await createDailyAttendanceReport(payload);
      setReportText(response.reportText || "");
      setAbsentStudents(response.absentStudents || []);
      setAlert({ message: "Report generated successfully", type: "success" });
    } catch (error) {
      setAlert({ message: error.message || "Failed to generate report", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!reportText) return;
    await navigator.clipboard.writeText(reportText);
    setAlert({ message: "Report copied to clipboard", type: "success" });
  };

  const handleWhatsApp = () => {
    if (!reportText) return;
    const url = `https://wa.me/?text=${encodeURIComponent(reportText)}`;
    window.open(url, "_blank");
  };

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
        title="Daily Attendance Report"
        subtitle="Generate a WhatsApp-ready attendance report"
      />

      {alert.message && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ message: "", type: "" })}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="space-y-6">
              <FormSelect
                label="Subject"
                value={selectedAssignment}
                onChange={handleAssignmentChange}
                required
                options={[
                  { value: "", label: "-- Select Subject --" },
                  ...assignments.map((a) => ({
                    value: a._id,
                    label: `${a.subject?.name || "N/A"} (${a.subject?.code || ""}) - ${a.branch?.name || "N/A"} ${a.year}-${a.division}`,
                  })),
                ]}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                  label="Session Type"
                  value={sessionType}
                  onChange={(e) => {
                    setSessionType(e.target.value);
                    if (e.target.value === "LECTURE") setBatch("");
                  }}
                  required
                  options={[
                    { value: "LECTURE", label: "Lecture" },
                    { value: "PRACTICAL", label: "Practical" },
                  ]}
                />

                {sessionType === "PRACTICAL" && (
                  <FormSelect
                    label="Batch"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    required
                    options={[
                      { value: "", label: "-- Select Batch --" },
                      { value: "A1", label: "Batch A1" },
                      { value: "A2", label: "Batch A2" },
                      { value: "A3", label: "Batch A3" },
                      { value: "B1", label: "Batch B1" },
                      { value: "B2", label: "Batch B2" },
                      { value: "B3", label: "Batch B3" },
                      { value: "C1", label: "Batch C1" },
                      { value: "C2", label: "Batch C2" },
                      { value: "C3", label: "Batch C3" },
                    ]}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label="Date"
                  type="date"
                  value={todayDate}
                  disabled
                />
                <FormInput
                  label="Start Time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
                <FormInput
                  label="End Time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <FormInput
                    label="Absent Roll Numbers (comma separated)"
                    type="text"
                    value={absentRollInput}
                    onChange={(e) => setAbsentRollInput(e.target.value)}
                    placeholder="e.g., 9,12,15"
                  />
                </div>
                <Button variant="secondary" onClick={handleAddRolls}>
                  Add
                </Button>
              </div>

              {/* Students List */}
              {selectedAssignment && students.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block" style={{ fontSize: theme.typography.body, fontWeight: 500 }}>
                      Student List
                    </label>
                    <span className="text-sm" style={{ color: theme.colors.neutral.textSecondary }}>
                      Absent: {absentRollNos.size}
                    </span>
                  </div>

                  <div
                    className="border rounded-lg max-h-80 overflow-y-auto"
                    style={{ borderColor: theme.colors.neutral.border }}
                  >
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left">
                        <tr>
                          <th className="p-3">Absent</th>
                          <th className="p-3">Roll No</th>
                          <th className="p-3">Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student._id} className="border-t">
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={absentRollNos.has(student.rollNo)}
                                onChange={() => toggleAbsentRoll(student.rollNo)}
                                className="h-4 w-4"
                                style={{ accentColor: theme.colors.error.main }}
                              />
                            </td>
                            <td className="p-3">{student.rollNo}</td>
                            <td className="p-3">{student.userId?.name || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedAssignment && students.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-500">
                  No students found for this class
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="success"
                  onClick={handleGenerateReport}
                  loading={submitting}
                  className="flex-1"
                >
                  Generate Report
                </Button>
                <Button variant="outline" onClick={() => navigate("/teacher")}
                  disabled={submitting}
                >
                  Back
                </Button>
              </div>
            </div>
          </Card>

          <AttendanceReportCard reportText={reportText} />

          {reportText && (
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleCopy} className="flex-1">
                Copy
              </Button>
              <Button variant="success" onClick={handleWhatsApp} className="flex-1">
                WhatsApp
              </Button>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-3">Selected Session</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Date:</strong> {todayDate}</div>
              <div><strong>Time:</strong> {startTime} - {endTime}</div>
              <div><strong>Session Type:</strong> {sessionType}</div>
              {sessionType === "PRACTICAL" && batch && (
                <div><strong>Batch:</strong> {batch}</div>
              )}
              <div><strong>Absent Rolls:</strong> {absentRollNos.size}</div>
            </div>
          </Card>

          {absentStudents.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold mb-3">Absent Students</h3>
              <ul className="text-sm space-y-2">
                {absentStudents.map((s) => (
                  <li key={s.rollNo}>
                    <strong>{s.rollNo}</strong> - {s.name}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDailyAttendance;
