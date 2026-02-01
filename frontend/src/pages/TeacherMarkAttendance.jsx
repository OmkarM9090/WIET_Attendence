/**
 * TEACHER MARK ATTENDANCE PAGE
 * Step 2: Select Assigned Teaching Session from dropdown
 * 
 * Features:
 * - Dropdown showing all assigned teaching sessions
 * - Format: Branch - Subject (Year Division) Time SessionType
 * - Display selected session details in card
 * - No attendance marking yet (Step 3)
 */

import { useEffect, useState } from "react";
import { theme } from "../styles/theme";
import DashboardLayout from "../components/DashboardLayout";
import FormSelect from "../components/FormSelect";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import { getMyTeachingAssignments } from "../services/teacherService";

export default function TeacherMarkAttendance() {
  // State management
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
   * Format dropdown option label
   * Format: Branch - Subject (Year Division) Time SessionType
   * Example: Computer Engineering - Maths (TE A) 2:00–3:00 Lecture
   * 
   * @param {Object} assignment - Teaching assignment object
   * @returns {String} Formatted label
   */
  const formatDropdownLabel = (assignment) => {
    const branch = assignment.branch?.name || "Unknown Branch";
    const subject = assignment.subject?.name || "Unknown Subject";
    const year = assignment.year ? `Year ${assignment.year}` : "";
    const division = assignment.division || "";
    const time = `${assignment.startTime}–${assignment.endTime}`;
    const sessionType =
      assignment.sessionType === "PRACTICAL" ? "Practical" : "Lecture";
    const batch = assignment.batch ? ` Batch ${assignment.batch.name}` : "";

    return `${branch} - ${subject} (${year} ${division}) ${time} ${sessionType}${batch}`;
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

        <div style={{ display: "grid", gap: "16px" }}>
          {/* Subject */}
          <div style={{ display: "flex", gap: "12px" }}>
            <span
              style={{
                width: "140px",
                fontWeight: "600",
                color: theme.colors.text.secondary,
              }}
            >
              Subject:
            </span>
            <span style={{ color: theme.colors.text.primary, fontWeight: "500" }}>
              {subject?.name} ({subject?.code})
            </span>
          </div>

          {/* Branch */}
          <div style={{ display: "flex", gap: "12px" }}>
            <span
              style={{
                width: "140px",
                fontWeight: "600",
                color: theme.colors.text.secondary,
              }}
            >
              Branch:
            </span>
            <span style={{ color: theme.colors.text.primary, fontWeight: "500" }}>
              {branch?.name}
            </span>
          </div>

          {/* Class */}
          <div style={{ display: "flex", gap: "12px" }}>
            <span
              style={{
                width: "140px",
                fontWeight: "600",
                color: theme.colors.text.secondary,
              }}
            >
              Class:
            </span>
            <span style={{ color: theme.colors.text.primary, fontWeight: "500" }}>
              Year {year} Division {division}
            </span>
          </div>

          {/* Batch (if practical) */}
          {batch && (
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
              <span style={{ color: theme.colors.text.primary, fontWeight: "500" }}>
                {batch.name}
              </span>
            </div>
          )}

          {/* Day */}
          <div style={{ display: "flex", gap: "12px" }}>
            <span
              style={{
                width: "140px",
                fontWeight: "600",
                color: theme.colors.text.secondary,
              }}
            >
              Day of Week:
            </span>
            <span style={{ color: theme.colors.text.primary, fontWeight: "500" }}>
              {dayOfWeek}
            </span>
          </div>

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
      {/* Header Section */}
      <div
        style={{
          marginBottom: "24px",
          padding: "20px",
          backgroundColor: theme.colors.primary[50],
          border: `1px solid ${theme.colors.primary[100]}`,
          borderRadius: "12px",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: theme.colors.primary[700],
            marginBottom: "8px",
          }}
        >
          🎯 Select Your Teaching Session
        </h2>
        <p style={{ fontSize: "14px", color: theme.colors.text.secondary }}>
          Choose the class and time slot for which you want to mark attendance
        </p>
      </div>

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
              {/* Dropdown Section */}
              <div
                style={{
                  backgroundColor: "white",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: theme.shadows.sm,
                }}
              >
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

              {/* Session Details Card */}
              {renderSessionDetails()}
            </>
          )}
        </>
      )}

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
