/**
 * TEACHER MARK ATTENDANCE PAGE
 * 
 * Step 1-4 Complete:
 * - Step 1: Select assigned teaching session from dropdown
 * - Step 2: Select date (today or yesterday only) 
 * - Step 3: Date validation with error handling
 * - Step 4: Auto-load student list for selected session
 * 
 * Features:
 * - Dropdown showing all assigned teaching sessions
 * - Format: Branch - Subject (Year Division) Time SessionType
 * - Display selected session details in card
 * - Date picker with today/yesterday restriction
 * - Student list with checkbox selection for absent students
 * - Quick add by roll numbers (comma/space separated)
 * - Real-time present/absent count
 * - Different student lists for LECTURE vs PRACTICAL sessions
 * 
 * Next: Step 5 - Save attendance to backend
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
  const [reportSuccess, setReportSuccess] = useState("");
  const [isUpdatingExcel, setIsUpdatingExcel] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [savedAttendanceId, setSavedAttendanceId] = useState(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [existingAttendanceId, setExistingAttendanceId] = useState(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Sidebar navigation items
  const sidebarItems = [
    { label: "Dashboard", path: "/teacher", icon: "🏠" },
    { label: "Mark Attendance", path: "/teacher/mark-attendance", icon: "✓" },
    { label: "View Attendance", path: "/teacher/attendance-history", icon: "📋" },
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
      setAssignments(data);
    } catch (err) {
      setError(err.message || "Failed to fetch teaching assignments");
      console.error("Error fetching assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle dropdown selection change
   * @param {Event} e - Change event
   */
  const handleSessionSelect = (e) => {
    const assignmentId = e.target.value;
    
    if (!assignmentId) {
      setSelectedAssignment(null);
      return;
    }

    // Find selected assignment from list
    const selected = assignments.find((a) => a._id === assignmentId);
    setSelectedAssignment(selected);
  };

  /**
   * Handle date selection change
   * Validates that date is today or yesterday only
   * 
   * @param {Event} e - Change event
   */
  const handleDateChange = (e) => {
    const selectedDateValue = e.target.value;
    setSelectedDate(selectedDateValue);

    // Validate date
    const validation = validateDate(selectedDateValue);
    if (validation.isValid) {
      setDateError("");
    } else {
      setDateError(validation.error);
    }
  };

  /**
   * Validate if selected date is allowed (today or yesterday only)
   * 
   * @param {String} dateString - Date in YYYY-MM-DD format
   * @returns {Object} - { isValid: boolean, error: string }
   */
  const validateDate = (dateString) => {
    if (!dateString) {
      return { isValid: false, error: "Please select a date" };
    }

    // Convert to Date object (midnight)
    const selectedDate = new Date(dateString + "T00:00:00");
    
    // Get today at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get yesterday at midnight
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if date is in the future
    if (selectedDate > today) {
      return {
        isValid: false,
        error: "Cannot mark attendance for future dates. Please select today or yesterday.",
      };
    }

    // Check if date is older than yesterday
    if (selectedDate < yesterday) {
      return {
        isValid: false,
        error: "Cannot mark attendance for dates older than yesterday. Please select today or yesterday.",
      };
    }

    // Date is valid (today or yesterday)
    return { isValid: true, error: "" };
  };

  /**
   * Get min and max date for date picker
   * Min: yesterday, Max: today
   */
  const getDatePickerLimits = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return {
      min: yesterday.toISOString().split("T")[0],
      max: today.toISOString().split("T")[0],
    };
  };

  /**
   * Check if Continue button should be enabled
   * Requires: valid session selected + valid date
   */
  const isContinueEnabled = () => {
    return selectedAssignment && selectedDate && !dateError;
  };

  /**
   * Fetch students for selected teaching session
   * Calls backend API with teachingAssignmentId
   */
  const fetchStudentsForSession = async () => {
    try {
      setLoadingStudents(true);
      setStudentError("");

      const response = await axiosInstance.get(
        "/attendance/students-for-session",
        {
          params: {
            teachingAssignmentId: selectedAssignment._id,
          },
        }
      );

      if (response.data.success) {
        let fetchedStudents = response.data.data || [];
        // Sort by Roll Number first, then Alphabetically by Name
        fetchedStudents.sort((a, b) => {
          const rollA = String(a.rollNo || "").padStart(15, '0');
          const rollB = String(b.rollNo || "").padStart(15, '0');
          if (rollA !== rollB) return rollA.localeCompare(rollB);
          
          const nameA = String(a.name || "").toLowerCase();
          const nameB = String(b.name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setStudents(fetchedStudents);
        setReportText("");
        setReportError("");
        setReportSuccess("");
      } else {
        setStudentError(response.data.message || "Failed to fetch students");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudentError(
        err.response?.data?.message || "Failed to fetch students for this session"
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  /**
   * Toggle student absent status
   * @param {String} studentId - Student ID to toggle
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
   * Add students by roll numbers
   * Parses comma/space separated roll numbers
   */
  const handleAddRollNumbers = () => {
    if (!rollNumberInput.trim()) return;

    // Parse roll numbers (support comma and space separation)
    const rollNumbers = rollNumberInput
      .split(/[,\s]+/)
      .map((roll) => roll.trim())
      .filter((roll) => roll);

    // Find students with matching roll numbers
    const matchingStudents = students.filter((student) =>
      rollNumbers.includes(student.rollNo?.toString())
    );

    const missingRolls = rollNumbers.filter(
      (roll) => !students.some((student) => student.rollNo?.toString() === roll)
    );

    if (missingRolls.length > 0) {
      setRollNumberError(`Invalid roll numbers: ${missingRolls.join(", ")}`);
    } else {
      setRollNumberError("");
    }

    // Add to absent list
    const newAbsentIds = matchingStudents
      .map((s) => s._id)
      .filter((id) => !selectedAbsentStudents.includes(id));

    if (newAbsentIds.length > 0) {
      setSelectedAbsentStudents((prev) => [...prev, ...newAbsentIds]);
    }

    // Clear input
    setRollNumberInput("");
  };

  /**
   * Save attendance and generate WhatsApp report
   */
  /**
   * Save attendance to backend
   * If attendance already exists for this session+date, show edit modal
   */
  const handleSaveAttendance = async () => {
    try {
      setSavingReport(true);
      setReportError("");

      if (!selectedAssignment || !selectedDate) {
        setReportError("Please select a session and date");
        return;
      }

      if (studentError) {
        setReportError("Fix student list errors before saving");
        return;
      }

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
        setSavedAttendanceId(response.data.attendance?._id || null);
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

      const studentMap = new Map(students.map((s) => [s._id, s]));
      const absentRollNumbers = selectedAbsentStudents
        .map((id) => studentMap.get(id))
        .filter(Boolean)
        .map((s) => s.rollNo);

      // Call PUT endpoint to update attendance
      const response = await axiosInstance.put(
        `/attendance/update/${existingAttendanceId}`,
        {
          absentRollNumbers
        }
      );

      if (response.data?.success) {
        setReportText(response.data.reportText || "");
        setSavedAttendanceId(existingAttendanceId);
        setIsEditingExisting(true);
        setReportError("");
      } else {
        setReportError(response.data?.message || "Failed to update attendance");
        setShowEditModal(true); // Show modal again if update fails
      }
    } catch (err) {
      console.error("Edit attendance error:", err);
      setReportError(
        err.response?.data?.message || "Failed to update attendance"
      );
      setShowEditModal(true); // Show modal again if update fails
    } finally {
      setSavingReport(false);
    }
  };

  /**
   * Handle manual Excel update
   * Called when user clicks "Update Excel" button
   */
  const handleUpdateExcel = async () => {
    try {
      setIsUpdatingExcel(true);
      setReportError("");
      setReportSuccess("");

      if (!savedAttendanceId) {
        setReportError("No attendance session to update Excel for");
        return;
      }

      const response = await axiosInstance.post(
        `/attendance/update-excel/${savedAttendanceId}`
      );

      if (response.data?.success) {
        if (response.data.skipped) {
          setReportError("Excel update skipped (cancelled/holiday session)");
        } else {
          setReportError(""); 
          setReportSuccess("Excel file updated successfully!");
          setTimeout(() => {
            setReportSuccess("");
          }, 3000);
        }
      } else {
        setReportError(response.data?.message || "Failed to update Excel");
      }
    } catch (err) {
      console.error("Excel update error:", err);
      setReportError(
        err.response?.data?.message || "Failed to update Excel file"
      );
    } finally {
      setIsUpdatingExcel(false);
    }
  };

  /**
   * Handle downloading Excel file
   */
  const handleDownloadExcel = async () => {
    try {
      setIsDownloadingExcel(true);
      setReportError("");
      setReportSuccess("");

      if (!savedAttendanceId) {
        setReportError("No attendance session to download Excel for");
        return;
      }

      // We need responseType 'blob' to handle binary file download
      const response = await axiosInstance.get(
        `/attendance/download-excel/${savedAttendanceId}`,
        { responseType: 'blob' }
      );

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'Attendance.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch.length === 2)
          filename = filenameMatch[1];
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setReportError("");
      setReportSuccess("Download started!");
      setTimeout(() => {
        setReportSuccess("");
      }, 3000);
      
    } catch (err) {
      console.error("Excel download error:", err);
      
      // If response was blob, we need to read it as text to get the error message
      if (err.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            setReportError(errorData.message || "Failed to download Excel file");
          } catch (e) {
            setReportError("Failed to download Excel file");
          }
        };
        reader.readAsText(err.response.data);
      } else {
        setReportError(
          err.response?.data?.message || "Failed to download Excel file"
        );
      }
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  /**
   * Cancel editing and close modal
   */
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setExistingAttendanceId(null);
  };

  const handleCopyReport = async () => {
    if (!reportText) return;
    await navigator.clipboard.writeText(reportText);
  };

  const handleShareWhatsApp = () => {
    if (!reportText) return;
    const url = `https://wa.me/?text=${encodeURIComponent(reportText)}`;
    window.open(url, "_blank");
  };

  /**
   * Format dropdown option label
   * Format: Branch - Subject (Year Division) Time SessionType
   * Example: Computer Engineering - Maths (TE A) 2:00–3:00 Lecture
   * 
   * @param {Object} assignment - Teaching assignment object
   * @returns {String} Formatted label
   */
  const formatDropdownLabel = (assignment) => {
    const branchCode = assignment.branch?.code || assignment.branch?.name || "Unknown";
    const subjectName = assignment.subject?.name || "Unknown Subject";
    const yearMap = { 1: "FE", 2: "SE", 3: "TE", 4: "BE" };
    const yearStr = assignment.year ? (yearMap[assignment.year] || `Y${assignment.year}`) : "";
    const divStr = assignment.division || "";
    const time = `${assignment.startTime}-${assignment.endTime}`;
    const type = assignment.sessionType === "PRACTICAL" ? "Prac" : "Lec";
    const batch = assignment.batch ? ` (B: ${assignment.batch.name})` : "";

    return `${branchCode} • ${subjectName} • ${yearStr}-${divStr} • ${time} • ${type}${batch}`;
  };

  /**
   * Render session details card
   */
  const renderSessionDetails = () => {
    if (!selectedAssignment) return null;

    const {
      subject,
      branch,
      year,
      division,
      batch,
      dayOfWeek,
      startTime,
      endTime,
      sessionType,
      academicYear,
    } = selectedAssignment;

    return (
      <div
        style={{
          marginTop: "24px",
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: "12px",
          padding: "24px",
          boxShadow: theme.shadows.md,
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: theme.colors.text.primary,
            marginBottom: "20px",
            paddingBottom: "12px",
            borderBottom: `2px solid ${theme.colors.primary}`,
          }}
        >
          📋 Selected Session Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          {/* Subject */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
            <span className="text-sm font-semibold text-slate-500 sm:w-28 shrink-0">Subject:</span>
            <span className="text-sm font-medium text-slate-900">{subject?.name} ({subject?.code})</span>
          </div>

          {/* Branch */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
            <span className="text-sm font-semibold text-slate-500 sm:w-28 shrink-0">Branch:</span>
            <span className="text-sm font-medium text-slate-900">{branch?.name}</span>
          </div>

          {/* Class */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
            <span className="text-sm font-semibold text-slate-500 sm:w-28 shrink-0">Class:</span>
            <span className="text-sm font-medium text-slate-900">Year {year} Division {division}</span>
          </div>

          {/* Batch (if practical) */}
          {batch && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
              <span className="text-sm font-semibold text-slate-500 sm:w-28 shrink-0">Batch:</span>
              <span className="text-sm font-medium text-slate-900">{batch.name}</span>
            </div>
          )}

          {/* Day */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
            <span className="text-sm font-semibold text-slate-500 sm:w-28 shrink-0">Day of Week:</span>
            <span className="text-sm font-medium text-slate-900">{dayOfWeek}</span>
          </div>

          {/* Time Slot */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
            <span className="text-sm font-semibold text-slate-500 sm:w-28 shrink-0">Time Slot:</span>
            <span className="text-sm font-medium text-slate-900 font-mono">{startTime} – {endTime}</span>
          </div>

          {/* Session Type */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
            <span className="text-sm font-semibold text-slate-500 sm:w-28 shrink-0">Session Type:</span>
            <div>
              <span
                className={`inline-block px-3 py-1 rounded-md text-xs font-semibold ${
                  sessionType === "PRACTICAL"
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "bg-blue-50 text-blue-600 border border-blue-200"
                }`}
              >
                {sessionType}
              </span>
            </div>
          </div>

          {/* Academic Year */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
            <span className="text-sm font-semibold text-slate-500 sm:w-28 shrink-0">Academic Year:</span>
            <span className="text-sm font-medium text-slate-900">{academicYear}</span>
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


      {/* Error Alert */}
      {error && (
        <div style={{ marginBottom: "20px" }}>
          <Alert type="error" message="Error" description={error} />
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <LoadingSpinner />
          <p style={{ marginTop: "16px", color: theme.colors.text.secondary }}>
            Loading your teaching sessions...
          </p>
        </div>
      ) : (
        <>
          {/* No Assignments State */}
          {assignments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: "12px",
              }}
            >
              <p style={{ fontSize: "48px", marginBottom: "16px" }}>📭</p>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: theme.colors.text.primary,
                  marginBottom: "8px",
                }}
              >
                No Teaching Sessions Assigned
              </h3>
              <p style={{ fontSize: "14px", color: theme.colors.text.secondary }}>
                You don't have any active teaching assignments for this academic year.
                <br />
                Please contact the admin if you believe this is an error.
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Dropdown Section */}
              <div className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6 shadow-sm mb-5">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <span
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: "white",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    1
                  </span>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: theme.colors.text.primary,
                    }}
                  >
                    Select Teaching Session
                  </h3>
                </div>

                <FormSelect
                  label="Assigned Sessions"
                  value={selectedAssignment?._id || ""}
                  onChange={handleSessionSelect}
                  options={[
                    { value: "", label: "-- Select a teaching session --" },
                    ...assignments.map((assignment) => ({
                      value: assignment._id,
                      label: formatDropdownLabel(assignment),
                    })),
                  ]}
                  required
                />

                {assignments.length > 0 && (
                  <p
                    style={{
                      marginTop: "12px",
                      fontSize: "13px",
                      color: theme.colors.text.secondary,
                      fontStyle: "italic",
                    }}
                  >
                    💡 Found {assignments.length} teaching session
                    {assignments.length > 1 ? "s" : ""} assigned to you
                  </p>
                )}
              </div>

              {/* Step 2: Date Selection */}
              <div
                className="bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6 shadow-sm mb-5 transition-opacity duration-200"
                style={{
                  opacity: selectedAssignment ? 1 : 0.5,
                  pointerEvents: selectedAssignment ? "auto" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <span
                    style={{
                      backgroundColor: selectedAssignment
                        ? theme.colors.primary
                        : theme.colors.neutral[300],
                      color: "white",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    2
                  </span>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: theme.colors.text.primary,
                    }}
                  >
                    Select Attendance Date
                  </h3>
                </div>

                <FormInput
                  label="Date"
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={getDatePickerLimits().min}
                  max={getDatePickerLimits().max}
                  required
                  disabled={!selectedAssignment}
                />

                {/* Helper text */}
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    color: theme.colors.text.secondary,
                    fontStyle: "italic",
                  }}
                >
                  📅 You can mark attendance only for today or yesterday
                </p>

                {/* Date validation error */}
                {dateError && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "12px 16px",
                      backgroundColor: theme.colors.error + "10",
                      border: `1px solid ${theme.colors.error}`,
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "start",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>⚠️</span>
                    <p
                      style={{
                        fontSize: "14px",
                        color: theme.colors.error,
                        margin: 0,
                        fontWeight: "500",
                      }}
                    >
                      {dateError}
                    </p>
                  </div>
                )}
              </div>

              {/* Session Details Card */}
              {renderSessionDetails()}

              {/* Step 3: Student List */}
              {selectedAssignment && selectedDate && !dateError && (
                <div className="mt-6 bg-white rounded-2xl border border-slate-100/80 p-5 sm:p-6 shadow-sm">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "20px",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: "white",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      3
                    </span>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: theme.colors.text.primary,
                      }}
                    >
                      Student List
                    </h3>
                  </div>

                  {/* Student Error */}
                  {studentError && (
                    <div style={{ marginBottom: "16px" }}>
                      <Alert
                        type="error"
                        message="Error"
                        description={studentError}
                      />
                    </div>
                  )}

                  {/* Loading Students */}
                  {loadingStudents ? (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                      <LoadingSpinner />
                      <p
                        style={{
                          marginTop: "12px",
                          color: theme.colors.text.secondary,
                        }}
                      >
                        Loading students...
                      </p>
                    </div>
                  ) : students.length === 0 && !studentError ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        backgroundColor: theme.colors.neutral[50],
                        borderRadius: "8px",
                      }}
                    >
                      <p style={{ fontSize: "48px", marginBottom: "12px" }}>
                        📚
                      </p>
                      <p
                        style={{
                          fontSize: "14px",
                          color: theme.colors.text.secondary,
                        }}
                      >
                        No students found for this session
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Roll Number Input */}
                      <div
                        style={{
                          marginBottom: "20px",
                          padding: "16px",
                          backgroundColor: theme.colors.neutral[50],
                          borderRadius: "8px",
                          border: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: theme.colors.text.primary,
                            marginBottom: "8px",
                          }}
                        >
                          Quick Add Absent Students by Roll Numbers
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <FormInput
                            placeholder="Enter roll numbers (e.g., 12 34 35 or 12, 34, 35)"
                            value={rollNumberInput}
                            onChange={(e) => setRollNumberInput(e.target.value)}
                            className="flex-1 w-full text-base sm:text-sm min-h-[44px]"
                          />
                          <Button
                            onClick={handleAddRollNumbers}
                            disabled={!rollNumberInput.trim()}
                            className="w-full sm:w-auto min-h-[44px] px-6 whitespace-nowrap"
                          >
                            Add to Absent List
                          </Button>
                        </div>
                        <p
                          style={{
                            fontSize: "12px",
                            color: theme.colors.text.secondary,
                            marginTop: "8px",
                            fontStyle: "italic",
                          }}
                        >
                          💡 Separate roll numbers with commas or spaces
                        </p>
                        {rollNumberError && (
                          <p
                            style={{
                              marginTop: "8px",
                              fontSize: "12px",
                              color: theme.colors.error,
                              fontWeight: "600",
                            }}
                          >
                            {rollNumberError}
                          </p>
                        )}
                      </div>

                      {/* Student Count Summary */}
                      <div className="mb-4 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3" style={{ backgroundColor: theme.colors.info + "10" }}>
                        <div className="flex flex-wrap items-center">
                          <span className="text-sm font-semibold" style={{ color: theme.colors.text.primary }}>
                            Total Students: {students.length}
                          </span>
                          {selectedAssignment.sessionType === "PRACTICAL" && (
                            <span className="ml-2 text-xs sm:text-sm text-slate-500">
                              (Batch: {selectedAssignment.batch?.name})
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 items-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                          <span className="text-sm font-semibold" style={{ color: theme.colors.error }}>
                            Absent: {selectedAbsentStudents.length}
                          </span>
                          <span className="text-sm font-semibold" style={{ color: theme.colors.success }}>
                            Present: {students.length - selectedAbsentStudents.length}
                          </span>
                        </div>
                      </div>

                      {/* Student List */}
                      <div
                        className="overflow-x-auto w-full"
                        style={{
                          maxHeight: "400px",
                          overflowY: "auto",
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: "8px",
                        }}
                      >
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
                          <thead
                            style={{
                              backgroundColor: theme.colors.neutral[100],
                              position: "sticky",
                              top: 0,
                              zIndex: 1,
                            }}
                          >
                            <tr>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "left",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: theme.colors.text.primary,
                                  borderBottom: `2px solid ${theme.colors.border}`,
                                }}
                              >
                                Absent
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "left",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: theme.colors.text.primary,
                                  borderBottom: `2px solid ${theme.colors.border}`,
                                }}
                              >
                                Roll No
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "left",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: theme.colors.text.primary,
                                  borderBottom: `2px solid ${theme.colors.border}`,
                                }}
                              >
                                Name
                              </th>
                              {selectedAssignment.sessionType === "PRACTICAL" && (
                                <th
                                  style={{
                                    padding: "12px 16px",
                                    textAlign: "left",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: theme.colors.text.primary,
                                    borderBottom: `2px solid ${theme.colors.border}`,
                                  }}
                                >
                                  Batch
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
                                  onClick={() => toggleAbsentStudent(student._id)}
                                  className="cursor-pointer transition-colors"
                                  style={{
                                    backgroundColor:
                                      index % 2 === 0
                                        ? "white"
                                        : theme.colors.neutral[50],
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      theme.colors.neutral[100];
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      index % 2 === 0
                                        ? "white"
                                        : theme.colors.neutral[50];
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "12px 16px",
                                      borderBottom: `1px solid ${theme.colors.border}`,
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isAbsent}
                                      onChange={() => {}} 
                                      className="w-6 h-6 md:w-4 md:h-4 cursor-pointer"
                                    />
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px 16px",
                                      fontSize: "14px",
                                      fontWeight: "600",
                                      color: theme.colors.text.primary,
                                      borderBottom: `1px solid ${theme.colors.border}`,
                                    }}
                                  >
                                    {student.rollNo ?? "--"}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px 16px",
                                      fontSize: "14px",
                                      color: isAbsent
                                        ? theme.colors.error
                                        : theme.colors.text.primary,
                                      textDecoration: isAbsent
                                        ? "line-through"
                                        : "none",
                                      borderBottom: `1px solid ${theme.colors.border}`,
                                    }}
                                  >
                                    {student.name || "Unnamed Student"}
                                  </td>
                                  {selectedAssignment.sessionType ===
                                    "PRACTICAL" && (
                                    <td
                                      style={{
                                        padding: "12px 16px",
                                        fontSize: "14px",
                                        color: theme.colors.text.secondary,
                                        borderBottom: `1px solid ${theme.colors.border}`,
                                      }}
                                    >
                                      {student.batch || "N/A"}
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
                <div className="mt-6 flex flex-wrap justify-end gap-3 w-full">
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
                      padding: "12px 32px",
                      fontSize: "16px",
                      fontWeight: "600",
                      backgroundColor: isContinueEnabled()
                        ? theme.colors.primary
                        : theme.colors.neutral[300],
                      cursor: isContinueEnabled() ? "pointer" : "not-allowed",
                    }}
                  >
                    {savingReport ? "Saving..." : "Save Attendance & Generate Report"}
                  </Button>
                </div>
              )}

              {reportError && (
                <div style={{ marginTop: "16px" }}>
                  <Alert type="error" message="Error" description={reportError} />
                </div>
              )}
              {reportSuccess && (
                <div style={{ marginTop: "16px" }}>
                  <Alert type="success" message="Success" description={reportSuccess} />
                </div>
              )}

              {reportText && (
                <ReportPreview
                  reportText={reportText}
                  onCopy={handleCopyReport}
                  onShare={handleShareWhatsApp}
                  onUpdateExcel={handleUpdateExcel}
                  isUpdatingExcel={isUpdatingExcel}
                  onDownloadExcel={handleDownloadExcel}
                  isDownloadingExcel={isDownloadingExcel}
                  attendanceId={savedAttendanceId}
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
          marginTop: "32px",
          padding: "16px",
          backgroundColor: theme.colors.neutral[50],
          border: `1px solid ${theme.colors.border}`,
          borderRadius: "8px",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            color: theme.colors.text.secondary,
            margin: 0,
          }}
        >
          <strong>ℹ️ Note:</strong> Only your assigned teaching sessions for the
          current academic year are displayed. After selecting a session, you'll be
          able to mark attendance for students in the next step.
        </p>
      </div>
    </DashboardLayout>
  );
}
