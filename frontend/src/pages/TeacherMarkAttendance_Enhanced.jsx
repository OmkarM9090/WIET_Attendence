/**
 * TEACHER MARK ATTENDANCE PAGE - ENHANCED UI
 * 
 * Modern, professional UI with:
 * - Gradient headers and cards
 * - Step-by-step visual indicators
 * - Enhanced attendance summary cards with icons
 * - Better table design with hover effects
 * - Improved button styling
 * - Smooth transitions and animations
 * 
 * All existing logic preserved - only UI enhancements
 */

import { useEffect, useState } from "react";
import { theme } from "../styles/theme";
import DashboardLayout from "../components/DashboardLayout";
import FormSelect from "../components/FormSelect";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import ReportPreview from "../components/ReportPreview";
import EditAttendanceModal from "../components/EditAttendanceModal";
import { getMyTeachingAssignments } from "../services/teacherService";
import axiosInstance from "../utils/axios";

export default function TeacherMarkAttendance() {
  // State management
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dateError, setDateError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Student state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentError, setStudentError] = useState("");
  const [selectedAbsentStudents, setSelectedAbsentStudents] = useState([]);
  const [rollNumberInput, setRollNumberInput] = useState("");
  const [rollNumberError, setRollNumberError] = useState("");

  // Report state
  const [savingReport, setSavingReport] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportError, setReportError] = useState("");

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [existingAttendanceId, setExistingAttendanceId] = useState(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Sidebar navigation items
  const sidebarItems = [
    { label: "Dashboard", path: "/teacher", icon: "🏠" },
    { label: "Mark Attendance", path: "/teacher/mark-attendance", icon: "✓" },
    { label: "View Attendance", path: "/teacher/view-attendance", icon: "👁️" },
    { label: "Reports", path: "/teacher/reports", icon: "📊" },
  ];

  /**
   * Fetch teaching assignments on component mount
   */
  useEffect(() => {
    fetchAssignments();
  }, []);

  /**
   * Fetch students when session and valid date are selected
   */
  useEffect(() => {
    if (selectedAssignment && selectedDate && !dateError) {
      fetchStudentsForSession();
    } else {
      // Clear students if session or date becomes invalid
      setStudents([]);
      setSelectedAbsentStudents([]);
      setRollNumberInput("");
      setRollNumberError("");
      setReportText("");
      setReportError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssignment, selectedDate, dateError]);

  /**
   * Fetch all active teaching assignments for logged-in teacher
   */
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyTeachingAssignments();
      setAssignments(data || []);

      if (!data || data.length === 0) {
        setError(
          "No teaching assignments found for the current academic year. Please contact admin."
        );
      }
    } catch (err) {
      console.error("Fetch assignments error:", err);
      setError(err.message || "Failed to load teaching assignments");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch students for the selected teaching session
   * Different logic for LECTURE vs PRACTICAL
   */
  const fetchStudentsForSession = async () => {
    try {
      setLoadingStudents(true);
      setStudentError("");
      setStudents([]);
      setSelectedAbsentStudents([]);

      const { sessionType, batch, branch, year, division, academicYear } =
        selectedAssignment;

      const params = {
        sessionType,
        branch: branch?._id || branch,
        year,
        division,
        academicYear,
      };

      if (sessionType === "PRACTICAL") {
        if (!batch || !batch._id) {
          setStudentError("Batch information is missing for this practical session");
          return;
        }
        params.batch = batch._id;
      }

      const response = await axiosInstance.get("/students/for-session", {
        params,
      });

      if (response.data?.success) {
        const studentList = response.data.students || [];
        setStudents(studentList);

        if (studentList.length === 0) {
          setStudentError("No students found for this session");
        }
      } else {
        setStudentError(response.data?.message || "Failed to load students");
      }
    } catch (err) {
      console.error("Fetch students error:", err);
      setStudentError(
        err.response?.data?.message || "Failed to load students"
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  /**
   * Handle assignment selection
   */
  const handleAssignmentChange = (e) => {
    const assignmentId = e.target.value;
    if (!assignmentId) {
      setSelectedAssignment(null);
      return;
    }

    const assignment = assignments.find((a) => a._id === assignmentId);
    setSelectedAssignment(assignment || null);

    // Reset student-related state
    setStudents([]);
    setSelectedAbsentStudents([]);
    setRollNumberInput("");
    setRollNumberError("");
    setReportText("");
    setReportError("");
  };

  /**
   * Validate date (today or yesterday only)
   */
  const validateDate = (dateStr) => {
    const selected = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Set times to midnight for comparison
    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    const selectedTime = selected.getTime();
    const todayTime = today.getTime();
    const yesterdayTime = yesterday.getTime();

    if (selectedTime > todayTime) {
      return "Cannot mark attendance for future dates";
    }

    if (selectedTime < yesterdayTime) {
      return "Can only mark attendance for today or yesterday";
    }

    return ""; // Valid
  };

  /**
   * Handle date change
   */
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);

    const error = validateDate(newDate);
    setDateError(error);

    // Clear report if date becomes invalid
    if (error) {
      setReportText("");
      setReportError("");
    }
  };

  /**
   * Toggle absent status for a student
   */
  const toggleAbsentStudent = (studentId) => {
    setSelectedAbsentStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  /**
   * Handle quick add by roll numbers
   */
  const handleQuickAddRollNumbers = () => {
    setRollNumberError("");

    if (!rollNumberInput.trim()) {
      setRollNumberError("Please enter roll numbers");
      return;
    }

    // Parse comma or space-separated roll numbers
    const inputRolls = rollNumberInput
      .split(/[,\s]+/)
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r) => parseInt(r, 10));

    // Validate all are numbers
    if (inputRolls.some(isNaN)) {
      setRollNumberError("Invalid roll numbers. Use numbers only.");
      return;
    }

    // Find matching students
    const studentMap = new Map(students.map((s) => [s.rollNo, s._id]));
    const validIds = [];
    const invalidRolls = [];

    inputRolls.forEach((roll) => {
      if (studentMap.has(roll)) {
        validIds.push(studentMap.get(roll));
      } else {
        invalidRolls.push(roll);
      }
    });

    if (invalidRolls.length > 0) {
      setRollNumberError(
        `Roll numbers not found: ${invalidRolls.join(", ")}`
      );
      return;
    }

    // Add to absent list (avoid duplicates)
    setSelectedAbsentStudents((prev) => {
      const combined = [...new Set([...prev, ...validIds])];
      return combined;
    });

    // Clear input
    setRollNumberInput("");
  };

  /**
   * Check if Continue button should be enabled
   */
  const isContinueEnabled = () => {
    return (
      selectedAssignment &&
      selectedDate &&
      !dateError &&
      students.length > 0 &&
      !loadingStudents &&
      !studentError &&
      !rollNumberError
    );
  };

  /**
   * Save attendance and generate report
   */
  const handleSaveAttendance = async () => {
    try {
      setSavingReport(true);
      setReportError("");
      setReportText("");

      // Validate
      if (!selectedAssignment || !selectedDate) {
        setReportError("Please select a session and date");
        return;
      }

      if (students.length === 0) {
        setReportError("No students available for this session");
        return;
      }

      // Convert selected student IDs to roll numbers
      const studentMap = new Map(students.map((s) => [s._id, s]));
      const absentRollNumbers = selectedAbsentStudents
        .map((id) => studentMap.get(id))
        .filter(Boolean)
        .map((s) => s.rollNo);

      const missingIds = selectedAbsentStudents.filter((id) => !studentMap.has(id));
      if (missingIds.length > 0) {
        setReportError("Some selected students are missing roll numbers");
        return;
      }

      const response = await axiosInstance.post(
        "/attendance/mark-and-generate",
        {
          teachingAssignmentId: selectedAssignment._id,
          date: selectedDate,
          absentRollNumbers
        }
      );

      // Check if attendance already exists (200 OK with alreadyExists flag)
      if (response.data?.alreadyExists === true) {
        setExistingAttendanceId(response.data.attendanceId);
        setShowEditModal(true);
        return;
      }

      // New attendance created successfully
      if (response.data?.success) {
        setReportText(response.data.reportText || "");
        setReportError(""); // Clear any previous errors
      } else {
        setReportError(response.data?.message || "Failed to save attendance");
      }
    } catch (err) {
      console.error("Save attendance error:", err);
      
      // Handle 409 Conflict - duplicate attendance detected
      if (err.response?.status === 409 && err.response?.data?.alreadyExists) {
        // Backend should return attendanceId, but if not, we need to fetch it
        const attendanceId = err.response?.data?.attendanceId;
        if (attendanceId) {
          setExistingAttendanceId(attendanceId);
          setShowEditModal(true);
        } else {
          // Fallback: Show modal without ID (user will need to retry)
          setReportError(
            "Attendance already exists. Please refresh and try editing the existing record."
          );
        }
        return;
      }
      
      // Other errors
      setReportError(
        err.response?.data?.message || "Failed to save attendance"
      );
    } finally {
      setSavingReport(false);
    }
  };

  /**
   * Handle editing existing attendance
   * Called when user clicks "Edit Attendance" in modal
   */
  const handleEditAttendance = async () => {
    try {
      setSavingReport(true);
      setShowEditModal(false);
      setReportError("");

      if (!existingAttendanceId) {
        setReportError("Missing attendance ID. Please try again.");
        return;
      }

      // Convert selected student IDs to roll numbers
      const studentMap = new Map(students.map((s) => [s._id, s]));
      const absentRollNumbers = selectedAbsentStudents
        .map((id) => studentMap.get(id))
        .filter(Boolean)
        .map((s) => s.rollNo);

      const response = await axiosInstance.put(
        `/attendance/update/${existingAttendanceId}`,
        { absentRollNumbers }
      );

      if (response.data?.success) {
        setReportText(response.data.reportText || "");
        setIsEditingExisting(true);
        setReportError("");
        // Don't close modal here, it's already closed above
      } else {
        setReportError(response.data?.message || "Failed to update attendance");
        setShowEditModal(true); // Reopen modal on error
      }
    } catch (err) {
      console.error("Edit attendance error:", err);
      setReportError(
        err.response?.data?.message || "Failed to update attendance"
      );
      setShowEditModal(true); // Reopen modal on error
    } finally {
      setSavingReport(false);
    }
  };

  /**
   * Handle cancel edit (close modal without saving)
   */
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setExistingAttendanceId(null);
    // Don't clear selectedAbsentStudents - user might want to modify and retry
  };

  /**
   * Copy report to clipboard
   */
  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      alert("Report copied to clipboard!");
    } catch (err) {
      console.error("Copy error:", err);
      alert("Failed to copy report");
    }
  };

  /**
   * Share to WhatsApp
   */
  const handleShareWhatsApp = () => {
    const encodedText = encodeURIComponent(reportText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
  };

  /**
   * Format assignment dropdown label
   */
  const formatAssignmentLabel = (assignment) => {
    const {
      branch,
      subject,
      year,
      division,
      startTime,
      endTime,
      sessionType,
      batch,
    } = assignment;

    const branchName = branch?.name || branch?.code || "N/A";
    const subjectName = subject?.name || subject?.code || "N/A";
    const time = `${startTime || "?"} – ${endTime || "?"}`;
    const yearDiv = `${year || "?"}${division || "?"}`;

    if (sessionType === "PRACTICAL" && batch) {
      const batchName = batch.name || "N/A";
      return `${branchName} - ${subjectName} (${yearDiv} Batch ${batchName}) ${time} ${sessionType}`;
    }

    return `${branchName} - ${subjectName} (${yearDiv}) ${time} ${sessionType}`;
  };

  /**
   * Render selected session details card
   */
  const renderSessionDetailsCard = () => {
    if (!selectedAssignment) return null;

    const {
      branch,
      subject,
      year,
      division,
      startTime,
      endTime,
      sessionType,
      batch,
      academicYear,
    } = selectedAssignment;

    return (
      <div
        style={{
          marginTop: "20px",
          padding: "24px",
          backgroundColor: theme.colors.surface,
          borderRadius: "12px",
          border: `2px solid ${theme.colors.primary[200]}`,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        }}
      >
        <h4
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: theme.colors.primary[600],
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>📚</span>
          Selected Session Details
        </h4>

        <div style={{ display: "grid", gap: "14px" }}>
          {/* Branch & Subject */}
          <div style={{ display: "flex", gap: "12px" }}>
            <span
              style={{
                width: "140px",
                fontWeight: "600",
                color: theme.colors.text.secondary,
              }}
            >
              Branch & Subject:
            </span>
            <span style={{ color: theme.colors.text.primary, fontWeight: "500" }}>
              {branch?.name || "N/A"} - {subject?.name || "N/A"}
            </span>
          </div>

          {/* Year & Division */}
          <div style={{ display: "flex", gap: "12px" }}>
            <span
              style={{
                width: "140px",
                fontWeight: "600",
                color: theme.colors.text.secondary,
              }}
            >
              Year & Division:
            </span>
            <span style={{ color: theme.colors.text.primary, fontWeight: "500" }}>
              Year {year} - Division {division}
            </span>
          </div>

          {/* Batch (if practical) */}
          {sessionType === "PRACTICAL" && batch && (
            <div style={{ display: "flex", gap: "12px" }}>
              <span
                style={{
                  width: "140px",
                  fontWeight: "600",
                  color: theme.colors.text.secondary,
                }}
              >
                Batch:
              </span>
              <span
                style={{
                  padding: "4px 12px",
                  backgroundColor: theme.colors.warning + "20",
                  color: theme.colors.warning,
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                {batch.name || "N/A"}
              </span>
            </div>
          )}

          {/* Time Slot */}
          <div style={{ display: "flex", gap: "12px" }}>
            <span
              style={{
                width: "140px",
                fontWeight: "600",
                color: theme.colors.text.secondary,
              }}
            >
              Time Slot:
            </span>
            <span
              style={{
                color: theme.colors.text.primary,
                fontWeight: "500",
                fontFamily: "monospace",
              }}
            >
              {startTime} – {endTime}
            </span>
          </div>

          {/* Session Type */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span
              style={{
                width: "140px",
                fontWeight: "600",
                color: theme.colors.text.secondary,
              }}
            >
              Session Type:
            </span>
            <span
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
                backgroundColor:
                  sessionType === "PRACTICAL"
                    ? theme.colors.warning + "20"
                    : theme.colors.info + "20",
                color:
                  sessionType === "PRACTICAL"
                    ? theme.colors.warning
                    : theme.colors.info,
              }}
            >
              {sessionType}
            </span>
          </div>

          {/* Academic Year */}
          <div style={{ display: "flex", gap: "12px" }}>
            <span
              style={{
                width: "140px",
                fontWeight: "600",
                color: theme.colors.text.secondary,
              }}
            >
              Academic Year:
            </span>
            <span style={{ color: theme.colors.text.primary, fontWeight: "500" }}>
              {academicYear}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout
      title="Mark Attendance"
      subtitle="Select your teaching session to mark attendance"
      sidebarItems={sidebarItems}
    >
      {/* Modern Header Section */}
      <div
        style={{
          marginBottom: "32px",
          padding: "28px 32px",
          background: `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.primary[600]} 100%)`,
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(107, 125, 255, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "120px",
            height: "120px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            filter: "blur(40px)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
              ✓
            </div>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#ffffff",
                margin: 0,
              }}
            >
              Mark Attendance
            </h2>
          </div>
          <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.9)", margin: 0 }}>
            Select your teaching session and mark student attendance for today
          </p>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading ? (
        <LoadingSpinner message="Loading your teaching sessions..." />
      ) : error ? (
        <Alert type="error" message="Error" description={error} />
      ) : (
        <>
          {/* Step 1: Select Teaching Assignment */}
          <div
            style={{
              marginBottom: "32px",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: theme.colors.primary[500],
                  color: "#ffffff",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: "700",
                }}
              >
                1
              </div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: theme.colors.text.primary,
                  margin: 0,
                }}
              >
                Select Your Teaching Session
              </h3>
            </div>

            <FormSelect
              label="Select Session"
              value={selectedAssignment?._id || ""}
              onChange={handleAssignmentChange}
              options={[
                { value: "", label: "-- Select a session --" },
                ...assignments.map((assignment) => ({
                  value: assignment._id,
                  label: formatAssignmentLabel(assignment),
                })),
              ]}
              required
            />

            {renderSessionDetailsCard()}
          </div>

          {/* Step 2: Select Date */}
          {selectedAssignment && (
            <div
              style={{
                marginBottom: "32px",
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "28px",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: theme.colors.primary[500],
                    color: "#ffffff",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: "700",
                  }}
                >
                  2
                </div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: theme.colors.text.primary,
                    margin: 0,
                  }}
                >
                  Select Date
                </h3>
              </div>

              <FormInput
                label="Attendance Date"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split("T")[0]}
                error={dateError}
                required
              />

              {dateError && (
                <div style={{ marginTop: "12px" }}>
                  <Alert
                    type="error"
                    message="Invalid Date"
                    description={dateError}
                  />
                </div>
              )}
            </div>
          )}

              {/* Student List */}
              {selectedAssignment && !dateError && (
                <div
                  style={{
                    marginBottom: "32px",
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    padding: "28px",
                    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        backgroundColor: theme.colors.primary[500],
                        color: "#ffffff",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        fontWeight: "700",
                      }}
                    >
                      3
                    </div>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: theme.colors.text.primary,
                        margin: 0,
                      }}
                    >
                      Mark Absent Students
                    </h3>
                  </div>

                  {loadingStudents ? (
                    <LoadingSpinner message="Loading students..." />
                  ) : studentError ? (
                    <Alert
                      type="error"
                      message="Error"
                      description={studentError}
                    />
                  ) : (
                    <>
                    {/* Attendance Summary - Modern Design */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "20px",
                        marginBottom: "28px",
                      }}
                    >
                      {/* Total Students */}
                      <div
                        style={{
                          padding: "20px",
                          background: `linear-gradient(135deg, ${theme.colors.neutral[100]} 0%, ${theme.colors.neutral[50]} 100%)`,
                          borderRadius: "12px",
                          border: `2px solid ${theme.colors.neutral[200]}`,
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "-10px",
                            right: "-10px",
                            width: "60px",
                            height: "60px",
                            backgroundColor: "rgba(107, 114, 128, 0.1)",
                            borderRadius: "50%",
                            filter: "blur(20px)",
                          }}
                        />
                        <div style={{ position: "relative", zIndex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "20px" }}>👥</span>
                            <p
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: theme.colors.text.secondary,
                                margin: 0,
                              }}
                            >
                              Total Students
                            </p>
                          </div>
                          <p
                            style={{
                              fontSize: "32px",
                              fontWeight: "700",
                              color: theme.colors.text.primary,
                              margin: 0,
                            }}
                          >
                            {students.length}
                          </p>
                        </div>
                      </div>

                      {/* Present Students */}
                      <div
                        style={{
                          padding: "20px",
                          background: `linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)`,
                          borderRadius: "12px",
                          border: `2px solid ${theme.colors.success}`,
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "-10px",
                            right: "-10px",
                            width: "60px",
                            height: "60px",
                            backgroundColor: "rgba(16, 185, 129, 0.2)",
                            borderRadius: "50%",
                            filter: "blur(20px)",
                          }}
                        />
                        <div style={{ position: "relative", zIndex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "20px" }}>✅</span>
                            <p
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: theme.colors.success,
                                margin: 0,
                              }}
                            >
                              Present
                            </p>
                          </div>
                          <p
                            style={{
                              fontSize: "32px",
                              fontWeight: "700",
                              color: theme.colors.success,
                              margin: 0,
                            }}
                          >
                            {students.length - selectedAbsentStudents.length}
                          </p>
                        </div>
                      </div>

                      {/* Absent Students */}
                      <div
                        style={{
                          padding: "20px",
                          background: `linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)`,
                          borderRadius: "12px",
                          border: `2px solid ${theme.colors.error}`,
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "-10px",
                            right: "-10px",
                            width: "60px",
                            height: "60px",
                            backgroundColor: "rgba(239, 68, 68, 0.2)",
                            borderRadius: "50%",
                            filter: "blur(20px)",
                          }}
                        />
                        <div style={{ position: "relative", zIndex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "20px" }}>❌</span>
                            <p
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: theme.colors.error,
                                margin: 0,
                              }}
                            >
                              Absent
                            </p>
                          </div>
                          <p
                            style={{
                              fontSize: "32px",
                              fontWeight: "700",
                              color: theme.colors.error,
                              margin: 0,
                            }}
                          >
                            {selectedAbsentStudents.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Add by Roll Numbers */}
                    <div
                      style={{
                        marginBottom: "24px",
                        padding: "20px",
                        background: `linear-gradient(135deg, ${theme.colors.info}15 0%, ${theme.colors.info}05 100%)`,
                        borderRadius: "12px",
                        border: `2px solid ${theme.colors.info}40`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                        <span style={{ fontSize: "20px" }}>⚡</span>
                        <h4
                          style={{
                            fontSize: "15px",
                            fontWeight: "700",
                            color: theme.colors.text.primary,
                            margin: 0,
                          }}
                        >
                          Quick Add Absent Students by Roll Numbers
                        </h4>
                      </div>

                      <p
                        style={{
                          fontSize: "13px",
                          color: theme.colors.text.secondary,
                          marginBottom: "14px",
                        }}
                      >
                        Enter roll numbers separated by commas or spaces (e.g., 1, 5, 9 or 1 5 9)
                      </p>

                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <FormInput
                            label=""
                            value={rollNumberInput}
                            onChange={(e) => setRollNumberInput(e.target.value)}
                            placeholder="e.g., 1, 5, 9, 12"
                            error={rollNumberError}
                          />
                        </div>
                        <Button
                          onClick={handleQuickAddRollNumbers}
                          style={{
                            marginTop: "0px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Add All
                        </Button>
                      </div>
                    </div>

                      {/* Student Table */}
                      <div
                        style={{
                          overflowX: "auto",
                          border: `2px solid ${theme.colors.border}`,
                          borderRadius: "12px",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        }}
                      >
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            backgroundColor: "white",
                          }}
                        >
                          <thead>
                            <tr style={{ background: `linear-gradient(135deg, ${theme.colors.primary[50]} 0%, ${theme.colors.primary[100]} 100%)` }}>
                              <th
                                style={{
                                  padding: "14px 20px",
                                  textAlign: "left",
                                  fontSize: "13px",
                                  fontWeight: "700",
                                  color: theme.colors.primary[700],
                                  borderBottom: `2px solid ${theme.colors.primary[200]}`,
                                  width: "50px",
                                }}
                              >
                                ❌ Absent
                              </th>
                              <th
                                style={{
                                  padding: "14px 20px",
                                  textAlign: "left",
                                  fontSize: "13px",
                                  fontWeight: "700",
                                  color: theme.colors.primary[700],
                                  borderBottom: `2px solid ${theme.colors.primary[200]}`,
                                  width: "100px",
                                }}
                              >
                                🔢 Roll No
                              </th>
                              <th
                                style={{
                                  padding: "14px 20px",
                                  textAlign: "left",
                                  fontSize: "13px",
                                  fontWeight: "700",
                                  color: theme.colors.primary[700],
                                  borderBottom: `2px solid ${theme.colors.primary[200]}`,
                                }}
                              >
                                👤 Student Name
                              </th>
                              {selectedAssignment.sessionType === "PRACTICAL" && (
                                <th
                                  style={{
                                    padding: "14px 20px",
                                    textAlign: "left",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    color: theme.colors.primary[700],
                                    borderBottom: `2px solid ${theme.colors.primary[200]}`,
                                  }}
                                >
                                  📋 Batch
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((student, index) => {
                              const isAbsent = selectedAbsentStudents.includes(
                                student._id
                              );
                              return (
                                <tr
                                  key={student._id}
                                  style={{
                                    backgroundColor: isAbsent
                                      ? "rgba(239, 68, 68, 0.05)"
                                      : index % 2 === 0
                                      ? "white"
                                      : theme.colors.neutral[50],
                                    transition: "all 0.2s ease",
                                    borderLeft: isAbsent ? `3px solid ${theme.colors.error}` : "3px solid transparent",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = isAbsent
                                      ? "rgba(239, 68, 68, 0.1)"
                                      : theme.colors.primary[50];
                                    e.currentTarget.style.transform = "scale(1.005)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = isAbsent
                                      ? "rgba(239, 68, 68, 0.05)"
                                      : index % 2 === 0
                                      ? "white"
                                      : theme.colors.neutral[50];
                                    e.currentTarget.style.transform = "scale(1)";
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "14px 20px",
                                      borderBottom: `1px solid ${theme.colors.border}`,
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isAbsent}
                                      onChange={() =>
                                        toggleAbsentStudent(student._id)
                                      }
                                      style={{
                                        width: "20px",
                                        height: "20px",
                                        cursor: "pointer",
                                        accentColor: theme.colors.error,
                                      }}
                                    />
                                  </td>
                                  <td
                                    style={{
                                      padding: "14px 20px",
                                      fontSize: "15px",
                                      fontWeight: "700",
                                      color: isAbsent ? theme.colors.error : theme.colors.primary[600],
                                      borderBottom: `1px solid ${theme.colors.border}`,
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {student.rollNo ?? "--"}
                                  </td>
                                  <td
                                    style={{
                                      padding: "14px 20px",
                                      fontSize: "15px",
                                      fontWeight: isAbsent ? "600" : "500",
                                      color: isAbsent
                                        ? theme.colors.error
                                        : theme.colors.text.primary,
                                      textDecoration: isAbsent
                                        ? "line-through"
                                        : "none",
                                      borderBottom: `1px solid ${theme.colors.border}`,
                                      opacity: isAbsent ? 0.7 : 1,
                                    }}
                                  >
                                    {student.name || "Unnamed Student"}
                                  </td>
                                  {selectedAssignment.sessionType ===
                                    "PRACTICAL" && (
                                    <td
                                      style={{
                                        padding: "14px 20px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        color: theme.colors.text.secondary,
                                        borderBottom: `1px solid ${theme.colors.border}`,
                                      }}
                                    >
                                      <span
                                        style={{
                                          padding: "4px 12px",
                                          backgroundColor: theme.colors.warning + "20",
                                          color: theme.colors.warning,
                                          borderRadius: "6px",
                                          fontSize: "13px",
                                          fontWeight: "600",
                                        }}
                                      >
                                        {student.batch || "N/A"}
                                      </span>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Continue Button */}
              {selectedAssignment && (
                <div
                  style={{
                    marginTop: "32px",
                    display: "flex",
                    justifyContent: "center",
                    gap: "12px",
                  }}
                >
                  <Button
                    onClick={handleSaveAttendance}
                    disabled={
                      !isContinueEnabled() ||
                      loadingStudents ||
                      !!studentError ||
                      !!rollNumberError ||
                      students.length === 0 ||
                      savingReport
                    }
                    style={{
                      padding: "16px 48px",
                      fontSize: "17px",
                      fontWeight: "700",
                      background: isContinueEnabled()
                        ? `linear-gradient(135deg, ${theme.colors.success} 0%, ${theme.colors.success}dd 100())`
                        : theme.colors.neutral[300],
                      cursor: isContinueEnabled() ? "pointer" : "not-allowed",
                      boxShadow: isContinueEnabled() ? "0 4px 20px rgba(16, 185, 129, 0.3)" : "none",
                      transform: isContinueEnabled() ? "translateY(0)" : "none",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (isContinueEnabled() && !savingReport) {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 6px 25px rgba(16, 185, 129, 0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isContinueEnabled()) {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 4px 20px rgba(16, 185, 129, 0.3)";
                      }
                    }}
                  >
                    {savingReport ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span>⏳</span>
                        Saving...
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span>💾</span>
                        Save Attendance & Generate Report
                      </span>
                    )}
                  </Button>
                </div>
              )}

              {reportError && (
                <div style={{ marginTop: "16px" }}>
                  <Alert type="error" message="Error" description={reportError} />
                </div>
              )}

              {reportText && (
                <ReportPreview
                  reportText={reportText}
                  onCopy={handleCopyReport}
                  onShare={handleShareWhatsApp}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Edit Attendance Modal Component */}
      <EditAttendanceModal
        isOpen={showEditModal}
        onClose={handleCancelEdit}
        onEdit={handleEditAttendance}
        isLoading={savingReport}
      />

      {/* Info Footer */}
      <div
        style={{
          marginTop: "40px",
          padding: "20px 24px",
          background: `linear-gradient(135deg, ${theme.colors.info}15 0%, ${theme.colors.info}05 100%)`,
          border: `2px solid ${theme.colors.info}40`,
          borderRadius: "12px",
          borderLeft: `4px solid ${theme.colors.info}`,
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "20px", flexShrink: 0 }}>💡</span>
          <p
            style={{
              fontSize: "14px",
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: "1.6",
            }}
          >
            <strong style={{ color: theme.colors.text.primary }}>Quick Tip:</strong> Only your assigned teaching sessions for the
            current academic year are displayed. After selecting a session, you'll be
            able to mark attendance for students in the next step. Use the quick add feature to mark multiple students absent at once.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
