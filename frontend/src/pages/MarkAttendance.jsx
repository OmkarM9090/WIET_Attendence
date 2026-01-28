import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import DashboardHeader from "../components/DashboardHeader";
import Button from "../components/Button";
import FormSelect from "../components/FormSelect";
import FormInput from "../components/FormInput";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import Card from "../components/Card";
import { theme } from "../styles/theme";
import { createAttendance } from "../services/attendanceService";
import { getStudents } from "../services/adminService";
import axiosInstance from "../utils/axios";

const MarkAttendance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });

  // Data states
  const [teacherId, setTeacherId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Form states
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [academicYear, setAcademicYear] = useState("2024-25");
  const [sessionType, setSessionType] = useState("LECTURE");
  const [batch, setBatch] = useState("");
  const [absentStudents, setAbsentStudents] = useState(new Set());

  const sidebarItems = [
    { path: "/teacher", label: "Dashboard", icon: "📊" },
    { path: "/teacher/mark-attendance", label: "Mark Attendance", icon: "✓" },
    { path: "/teacher/attendance-history", label: "View Attendance", icon: "📖" },
    { path: "/teacher/reports", label: "Reports", icon: "📄" },
  ];

  // Fetch teacher assignments on mount
  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // Get teacher profile first
      const profileResponse = await axiosInstance.get("/teacher/me");
      const profileData = profileResponse.data;
      
      if (profileData.success) {
        const teacherIdValue = profileData.data._id;
        setTeacherId(teacherIdValue);
        
        // Fetch assignments
        const assignmentsResponse = await axiosInstance.get(
          `/teacher/assignments/${teacherIdValue}`
        );
        const assignmentsData = assignmentsResponse.data;
        
        if (assignmentsData.success) {
          setAssignments(assignmentsData.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setAlert({ 
        message: error.response?.data?.message || "Failed to load assignments", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch students when assignment is selected
  useEffect(() => {
    if (selectedAssignment) {
      fetchStudents();
    }
  }, [selectedAssignment, academicYear]);

  const fetchStudents = async () => {
    const assignment = assignments.find((a) => a._id === selectedAssignment);
    if (!assignment) return;

    try {
      const response = await getStudents({
        branch: assignment.branch?._id,
        year: assignment.year,
        division: assignment.division,
      });

      if (response.success) {
        // Filter students by academic year and active status
        const filteredStudents = response.data.filter(
          (student) =>
            student.status === "active" &&
            student.admissionYear <= academicYear.split("-")[0]
        );
        setStudents(filteredStudents);
        setAbsentStudents(new Set()); // Reset selections
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setAlert({ message: "Failed to load students", type: "error" });
    }
  };

  const handleAssignmentChange = (e) => {
    setSelectedAssignment(e.target.value);
    setStudents([]);
    setAbsentStudents(new Set());
    setBatch(""); // Reset batch when changing assignment
  };

  const toggleStudentAbsence = (studentId) => {
    const newAbsent = new Set(absentStudents);
    if (newAbsent.has(studentId)) {
      newAbsent.delete(studentId);
    } else {
      newAbsent.add(studentId);
    }
    setAbsentStudents(newAbsent);
  };

  const toggleAllStudents = () => {
    if (absentStudents.size === students.length) {
      // If all selected, clear all
      setAbsentStudents(new Set());
    } else {
      // Select all
      setAbsentStudents(new Set(students.map((s) => s._id)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!selectedAssignment) {
      setAlert({ message: "Please select a class", type: "error" });
      return;
    }

    if (!date) {
      setAlert({ message: "Please select a date", type: "error" });
      return;
    }

    if (!academicYear) {
      setAlert({ message: "Please enter academic year", type: "error" });
      return;
    }

    if (sessionType === "PRACTICAL" && !batch) {
      setAlert({ message: "Batch is required for practical sessions", type: "error" });
      return;
    }

    if (students.length === 0) {
      setAlert({ message: "No students found for this class", type: "error" });
      return;
    }

    const assignment = assignments.find((a) => a._id === selectedAssignment);

    const attendanceData = {
      date,
      subjectId: assignment.subject._id,
      branchId: assignment.branch._id,
      year: assignment.year,
      division: assignment.division,
      academicYear,
      sessionType,
      absentStudentIds: Array.from(absentStudents),
    };

    if (sessionType === "PRACTICAL") {
      attendanceData.batch = batch;
    }

    try {
      setSubmitting(true);
      const response = await createAttendance(attendanceData);

      if (response.success) {
        setAlert({
          message: `Attendance marked successfully! Present: ${students.length - absentStudents.size}/${students.length}`,
          type: "success",
        });
        
        // Reset form after 2 seconds
        setTimeout(() => {
          setSelectedAssignment("");
          setStudents([]);
          setAbsentStudents(new Set());
          setBatch("");
          setSessionType("LECTURE");
          setAlert({ message: "", type: "" });
        }, 2000);
      } else {
        setAlert({
          message: response.message || "Failed to mark attendance",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      setAlert({
        message: error.response?.data?.message || "Failed to mark attendance",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  const assignment = assignments.find((a) => a._id === selectedAssignment);
  const presentCount = students.length - absentStudents.size;
  const attendancePercentage = students.length > 0
    ? ((presentCount / students.length) * 100).toFixed(1)
    : 0;

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <DashboardHeader
        title="Mark Attendance"
        subtitle="Record student attendance for your classes"
      />

      {alert.message && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ message: "", type: "" })}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Class Selection */}
              <div>
                <FormSelect
                  label="Select Class"
                  value={selectedAssignment}
                  onChange={handleAssignmentChange}
                  options={[
                    { value: "", label: "-- Select Class --" },
                    ...assignments.map((a) => ({
                      value: a._id,
                      label: `${a.subject?.name || "N/A"} (${a.subject?.code || ""}) - ${
                        a.branch?.name || "N/A"
                      } ${a.year}-${a.division}`,
                    })),
                  ]}
                  required
                />
              </div>

              {/* Date and Academic Year */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  max={new Date().toISOString().split("T")[0]}
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

              {/* Session Type and Batch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                  label="Session Type"
                  value={sessionType}
                  onChange={(e) => {
                    setSessionType(e.target.value);
                    if (e.target.value === "LECTURE") {
                      setBatch("");
                    }
                  }}
                  options={[
                    { value: "LECTURE", label: "Lecture" },
                    { value: "PRACTICAL", label: "Practical" },
                  ]}
                  required
                />
                {sessionType === "PRACTICAL" && (
                  <FormSelect
                    label="Batch"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
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
                    required
                  />
                )}
              </div>

              {/* Students List */}
              {selectedAssignment && students.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block" style={{ fontSize: theme.typography.body, fontWeight: 500 }}>
                      Mark Absent Students ({students.length} total)
                    </label>
                    <button
                      type="button"
                      onClick={toggleAllStudents}
                      className="text-sm hover:underline"
                      style={{ color: theme.colors.primary.main }}
                    >
                      {absentStudents.size === students.length ? "Clear All" : "Mark All Absent"}
                    </button>
                  </div>

                  <div
                    className="border rounded-lg max-h-96 overflow-y-auto"
                    style={{ borderColor: theme.colors.neutral.border }}
                  >
                    {students.map((student) => (
                      <label
                        key={student._id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        style={{ borderColor: theme.colors.neutral.border }}
                      >
                        <input
                          type="checkbox"
                          checked={absentStudents.has(student._id)}
                          onChange={() => toggleStudentAbsence(student._id)}
                          className="mr-3 h-4 w-4 rounded"
                          style={{ accentColor: theme.colors.error.main }}
                        />
                        <div className="flex-1">
                          <div style={{ fontSize: theme.typography.body, fontWeight: 500 }}>
                            {student.userId?.name || "N/A"}
                          </div>
                          <div style={{ fontSize: theme.typography.small, color: theme.colors.neutral.textSecondary }}>
                            Roll No: {student.rollNo} | Batch: {student.batch || "N/A"}
                          </div>
                        </div>
                        {absentStudents.has(student._id) && (
                          <span
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: theme.colors.error.light,
                              color: theme.colors.error.main,
                            }}
                          >
                            Absent
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedAssignment && students.length === 0 && (
                <div
                  className="text-center py-8 rounded-lg"
                  style={{ backgroundColor: theme.colors.neutral.light, color: theme.colors.neutral.textSecondary }}
                >
                  No students found for this class and academic year
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  variant="success"
                  disabled={!selectedAssignment || students.length === 0 || submitting}
                  loading={submitting}
                  className="flex-1"
                >
                  {submitting ? "Submitting..." : "Submit Attendance"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/teacher")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Class Info Card */}
          {assignment && (
            <Card>
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: theme.colors.primary.light }}
                >
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h3 style={{ fontSize: theme.typography.h3, fontWeight: 600, marginBottom: theme.spacing.xs }}>
                    Class Details
                  </h3>
                  <p style={{ fontSize: theme.typography.small, color: theme.colors.neutral.textSecondary }}>
                    Selected session information
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div style={{ fontSize: theme.typography.small, color: theme.colors.neutral.textSecondary }}>
                    Subject
                  </div>
                  <div style={{ fontSize: theme.typography.body, fontWeight: 500 }}>
                    {assignment.subject?.name} ({assignment.subject?.code})
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: theme.typography.small, color: theme.colors.neutral.textSecondary }}>
                    Class
                  </div>
                  <div style={{ fontSize: theme.typography.body, fontWeight: 500 }}>
                    {assignment.branch?.name} {assignment.year}-{assignment.division}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: theme.typography.small, color: theme.colors.neutral.textSecondary }}>
                    Session Type
                  </div>
                  <div style={{ fontSize: theme.typography.body, fontWeight: 500 }}>
                    {sessionType}
                    {sessionType === "PRACTICAL" && batch && ` - Batch ${batch}`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: theme.typography.small, color: theme.colors.neutral.textSecondary }}>
                    Date
                  </div>
                  <div style={{ fontSize: theme.typography.body, fontWeight: 500 }}>
                    {new Date(date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Attendance Summary Card */}
          {students.length > 0 && (
            <Card>
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: theme.colors.success.light }}
                >
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 style={{ fontSize: theme.typography.h3, fontWeight: 600, marginBottom: theme.spacing.xs }}>
                    Attendance Summary
                  </h3>
                  <p style={{ fontSize: theme.typography.small, color: theme.colors.neutral.textSecondary }}>
                    Current session status
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center py-4">
                  <div
                    style={{
                      fontSize: "3rem",
                      fontWeight: 700,
                      color:
                        attendancePercentage >= 75
                          ? theme.colors.success.main
                          : attendancePercentage >= 50
                          ? theme.colors.warning.main
                          : theme.colors.error.main,
                    }}
                  >
                    {attendancePercentage}%
                  </div>
                  <div style={{ fontSize: theme.typography.small, color: theme.colors.neutral.textSecondary }}>
                    Overall Attendance
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: theme.colors.success.light }}>
                    <div style={{ fontSize: theme.typography.h2, fontWeight: 700, color: theme.colors.success.main }}>
                      {presentCount}
                    </div>
                    <div style={{ fontSize: theme.typography.small, color: theme.colors.neutral.textSecondary }}>
                      Present
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: theme.colors.error.light }}>
                    <div style={{ fontSize: theme.typography.h2, fontWeight: 700, color: theme.colors.error.main }}>
                      {absentStudents.size}
                    </div>
                    <div style={{ fontSize: theme.typography.small, color: theme.colors.neutral.textSecondary }}>
                      Absent
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2" style={{ borderTop: `1px solid ${theme.colors.neutral.border}` }}>
                  <div style={{ fontSize: theme.typography.body, color: theme.colors.neutral.textSecondary }}>
                    Total Students: <span style={{ fontWeight: 600 }}>{students.length}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;
