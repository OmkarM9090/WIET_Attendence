/**
 * ADMIN TEACHER ASSIGNMENT PAGE
 * Manage timetable assignments for teachers
 * 
 * Features:
 * - Create teacher assignments with full timetable details
 * - View all assignments in sortable table
 * - Real-time validation
 * - Responsive design
 */

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../utils/axios";
import { theme } from "../styles/theme";

import DashboardLayout from "../components/DashboardLayout";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Alert from "../components/Alert";
import Table from "../components/Table";
import LoadingSpinner from "../components/LoadingSpinner";

// Constants
const DAY_OPTIONS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const SESSION_TYPES = ["LECTURE", "PRACTICAL"];
const YEAR_OPTIONS = [1, 2, 3, 4];
const DIVISION_OPTIONS = ["A", "B", "C"];

const dayOrder = new Map(DAY_OPTIONS.map((day, index) => [day, index]));

const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = String(timeStr).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

export default function AdminTeacherAssignment() {
  // Dropdown data
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // UI state
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    teacherId: "",
    branchId: "",
    subjectId: "",
    year: "",
    division: "",
    sessionType: "LECTURE",
    batchId: "",
    dayOfWeek: "MONDAY",
    startTime: "",
    endTime: "",
    academicYear: "",
  });

  const [validationErrors, setValidationErrors] = useState({});

  const sidebarItems = [
    { label: "Dashboard", path: "/admin", icon: "🏠" },
    { label: "Branches", path: "/admin/branches", icon: "🌿" },
    { label: "Subjects", path: "/admin/subjects", icon: "📘" },
    { label: "Students", path: "/admin/students", icon: "🎓" },
    { label: "Teachers", path: "/admin/teachers", icon: "👩‍🏫" },
    { label: "Timetable", path: "/admin/teacher-assignments", icon: "🗓️" },
    { label: "Reports", path: "/admin/defaulters", icon: "📊" },
  ];

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoadingDropdowns(true);
        setLoadingAssignments(true);
        await Promise.all([
          fetchTeachers(),
          fetchBranches(),
          fetchSubjects(),
          fetchBatches(),
        ]);
        await fetchAssignments();
      } finally {
        setLoadingDropdowns(false);
        setLoadingAssignments(false);
      }
    };

    initialize();
  }, []);

  // ============================================
  // API CALLS
  // ============================================

  const fetchTeachers = async () => {
    try {
      const response = await axiosInstance.get("/admin/teachers");
      const data = response?.data?.data || response?.data || [];
      setTeachers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setTeachers([]);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axiosInstance.get("/admin/branches");
      const data = response?.data?.data || response?.data || [];
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching branches:", err);
      setBranches([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axiosInstance.get("/admin/subjects");
      const data = response?.data?.data || response?.data || [];
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setSubjects([]);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await axiosInstance.get("/admin/batches");
      const data = response?.data?.data || response?.data || [];
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching batches:", err);
      setBatches([]);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axiosInstance.get("/admin/teacher-assignments");
      const data = response?.data?.data || response?.data || [];
      const dataArray = Array.isArray(data) ? data : [];
      
      // Sort by day and time
      const sorted = [...dataArray].sort((a, b) => {
        const dayA = dayOrder.get(a.dayOfWeek) ?? 99;
        const dayB = dayOrder.get(b.dayOfWeek) ?? 99;
        if (dayA !== dayB) return dayA - dayB;
        const timeA = timeToMinutes(a.startTime) ?? 0;
        const timeB = timeToMinutes(b.startTime) ?? 0;
        return timeA - timeB;
      });
      
      setAssignments(sorted);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setAssignments([]);
    }
  };

  // ============================================
  // FORM HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-clear batch when switching to LECTURE
      if (name === "sessionType" && value === "LECTURE") {
        next.batchId = "";
      }
      return next;
    });
    // Clear validation error for this field
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};

    // Required fields
    if (!formData.teacherId) errors.teacherId = "Teacher is required";
    if (!formData.branchId) errors.branchId = "Branch is required";
    if (!formData.subjectId) errors.subjectId = "Subject is required";
    if (!formData.year) errors.year = "Year is required";
    if (!formData.division) errors.division = "Division is required";
    if (!formData.dayOfWeek) errors.dayOfWeek = "Day of week is required";
    if (!formData.startTime) errors.startTime = "Start time is required";
    if (!formData.endTime) errors.endTime = "End time is required";
    if (!formData.academicYear) errors.academicYear = "Academic year is required";

    // Session type validation
    if (formData.sessionType === "PRACTICAL" && !formData.batchId) {
      errors.batchId = "Batch is required for PRACTICAL sessions";
    }
    if (formData.sessionType === "LECTURE" && formData.batchId) {
      errors.batchId = "Batch must be empty for LECTURE sessions";
    }

    // Time validation
    if (formData.startTime && formData.endTime) {
      const start = timeToMinutes(formData.startTime);
      const end = timeToMinutes(formData.endTime);
      if (start !== null && end !== null && end <= start) {
        errors.endTime = "End time must be after start time";
      }
    }

    // Academic year format (YYYY-YYYY)
    if (formData.academicYear) {
      const yearRegex = /^\d{4}-\d{4}$/;
      if (!yearRegex.test(formData.academicYear)) {
        errors.academicYear = "Format must be YYYY-YYYY (e.g., 2025-2026)";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      teacherId: "",
      branchId: "",
      subjectId: "",
      year: "",
      division: "",
      sessionType: "LECTURE",
      batchId: "",
      dayOfWeek: "MONDAY",
      startTime: "",
      endTime: "",
      academicYear: "",
    });
    setValidationErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      setError("Please fix the validation errors below");
      return;
    }

    setSubmitting(true);

    try {
      await axiosInstance.post("/admin/assign-teacher", {
        teacherId: formData.teacherId,
        subjectId: formData.subjectId,
        branchId: formData.branchId,
        year: Number(formData.year),
        division: formData.division,
        batchId: formData.sessionType === "PRACTICAL" ? formData.batchId : undefined,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        sessionType: formData.sessionType,
        academicYear: formData.academicYear,
      });

      setSuccess("✅ Teacher assignment created successfully!");
      resetForm();
      await fetchAssignments();
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to create assignment";
      setError(`❌ ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // DROPDOWN OPTIONS (MEMOIZED)
  // ============================================

  const teacherOptions = useMemo(
    () => [
      { value: "", label: "Select teacher" },
      ...teachers.map((t) => ({
        value: t.userId?._id || t._id || "",
        label: `${t.userId?.name || t.name || "Unknown"} (${t.userId?.email || t.email || ""})`,
      })),
    ],
    [teachers]
  );

  const branchOptions = useMemo(
    () => [
      { value: "", label: "Select branch" },
      ...branches.map((b) => ({
        value: b._id,
        label: `${b.name} (${b.code})`,
      })),
    ],
    [branches]
  );

  const subjectOptions = useMemo(
    () => [
      { value: "", label: "Select subject" },
      ...subjects.map((s) => ({
        value: s._id,
        label: `${s.name} (${s.code})`,
      })),
    ],
    [subjects]
  );

  const batchOptions = useMemo(
    () => [
      { value: "", label: "Select batch" },
      ...batches.map((b) => ({
        value: b._id,
        label: b.name,
      })),
    ],
    [batches]
  );

  const yearOptions = useMemo(
    () => [
      { value: "", label: "Select year" },
      ...YEAR_OPTIONS.map((y) => ({
        value: y,
        label: `Year ${y}`,
      })),
    ],
    []
  );

  const divisionOptions = useMemo(
    () => [
      { value: "", label: "Select division" },
      ...DIVISION_OPTIONS.map((d) => ({
        value: d,
        label: d,
      })),
    ],
    []
  );

  const dayOptions = useMemo(
    () => DAY_OPTIONS.map((d) => ({
      value: d,
      label: d,
    })),
    []
  );

  const sessionTypeOptions = useMemo(
    () => SESSION_TYPES.map((s) => ({
      value: s,
      label: s,
    })),
    []
  );

  // ============================================
  // TABLE COLUMNS (MEMOIZED)
  // ============================================

  const tableColumns = useMemo(
    () => [
      {
        header: "Teacher",
        accessor: "teacherId",
        render: (value) => {
          if (!value) return "N/A";
          return `${value.name || "Unknown"} (${value.email || ""})`;
        },
      },
      {
        header: "Subject",
        accessor: "subjectId",
        render: (value) => {
          if (!value) return "N/A";
          return `${value.name} (${value.code})`;
        },
      },
      {
        header: "Class",
        accessor: "branchId",
        render: (value, row) => {
          const branch = value?.name || "N/A";
          const year = row.year || "";
          const division = row.division || "";
          return `${branch} ${year}${division ? division : ""}`;
        },
      },
      {
        header: "Batch",
        accessor: "batchId",
        render: (value) => value?.name || "—",
      },
      {
        header: "Day",
        accessor: "dayOfWeek",
      },
      {
        header: "Time",
        accessor: "startTime",
        render: (value, row) => `${value || "—"} - ${row.endTime || ""}`,
      },
      {
        header: "Type",
        accessor: "sessionType",
        render: (value) => (
          <span
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
              backgroundColor:
                value === "PRACTICAL"
                  ? "#fef3c7"
                  : value === "LECTURE"
                  ? "#dbeafe"
                  : "#f3f4f6",
              color:
                value === "PRACTICAL"
                  ? "#92400e"
                  : value === "LECTURE"
                  ? "#1e40af"
                  : "#4b5563",
            }}
          >
            {value}
          </span>
        ),
      },
      {
        header: "Academic Year",
        accessor: "academicYear",
      },
    ],
    []
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Timetable Management">
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>
            🗓️ Timetable Management
          </h1>
          <p style={{ color: theme.colors.text.secondary, fontSize: "14px" }}>
            Create and manage teacher assignments across days and time slots
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert message={error} type="error" onClose={() => setError("")} />
        )}
        {success && (
          <Alert message={success} type="success" onClose={() => setSuccess("")} />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          {/* ======================== FORM SECTION ======================== */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              border: `1px solid ${theme.colors.border}`,
              padding: "24px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
              ➕ Create Assignment
            </h2>

            {loadingDropdowns ? (
              <LoadingSpinner />
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Row 1: Teacher, Branch, Subject */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <FormSelect
                      label="Teacher"
                      name="teacherId"
                      value={formData.teacherId}
                      onChange={handleChange}
                      options={teacherOptions}
                      required
                    />
                    {validationErrors.teacherId && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        {validationErrors.teacherId}
                      </p>
                    )}
                  </div>

                  <div>
                    <FormSelect
                      label="Branch"
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleChange}
                      options={branchOptions}
                      required
                    />
                    {validationErrors.branchId && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        {validationErrors.branchId}
                      </p>
                    )}
                  </div>

                  <div>
                    <FormSelect
                      label="Subject"
                      name="subjectId"
                      value={formData.subjectId}
                      onChange={handleChange}
                      options={subjectOptions}
                      required
                    />
                    {validationErrors.subjectId && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        {validationErrors.subjectId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 2: Year, Division, Session Type */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <FormSelect
                      label="Year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      options={yearOptions}
                      required
                    />
                    {validationErrors.year && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        {validationErrors.year}
                      </p>
                    )}
                  </div>

                  <div>
                    <FormSelect
                      label="Division"
                      name="division"
                      value={formData.division}
                      onChange={handleChange}
                      options={divisionOptions}
                      required
                    />
                    {validationErrors.division && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        {validationErrors.division}
                      </p>
                    )}
                  </div>

                  <div>
                    <FormSelect
                      label="Session Type"
                      name="sessionType"
                      value={formData.sessionType}
                      onChange={handleChange}
                      options={sessionTypeOptions}
                      required
                    />
                  </div>
                </div>

                {/* Row 3: Batch (conditional), Day, Academic Year */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  {formData.sessionType === "PRACTICAL" && (
                    <div>
                      <FormSelect
                        label="Batch (Practical Only)"
                        name="batchId"
                        value={formData.batchId}
                        onChange={handleChange}
                        options={batchOptions}
                        required={formData.sessionType === "PRACTICAL"}
                      />
                      {validationErrors.batchId && (
                        <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                          {validationErrors.batchId}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <FormSelect
                      label="Day of Week"
                      name="dayOfWeek"
                      value={formData.dayOfWeek}
                      onChange={handleChange}
                      options={dayOptions}
                      required
                    />
                    {validationErrors.dayOfWeek && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        {validationErrors.dayOfWeek}
                      </p>
                    )}
                  </div>

                  <div>
                    <FormInput
                      label="Academic Year"
                      name="academicYear"
                      type="text"
                      placeholder="2025-2026"
                      value={formData.academicYear}
                      onChange={handleChange}
                      required
                    />
                    {validationErrors.academicYear && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        {validationErrors.academicYear}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 4: Start Time, End Time */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  <div>
                    <FormInput
                      label="Start Time"
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleChange}
                      required
                    />
                    {validationErrors.startTime && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        {validationErrors.startTime}
                      </p>
                    )}
                  </div>

                  <div>
                    <FormInput
                      label="End Time"
                      name="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={handleChange}
                      required
                    />
                    {validationErrors.endTime && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        {validationErrors.endTime}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={submitting}
                  style={{ width: "100%" }}
                >
                  Assign Teacher
                </Button>
              </form>
            )}
          </div>

          {/* ======================== TABLE SECTION ======================== */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              border: `1px solid ${theme.colors.border}`,
              padding: "24px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
              📋 Assigned Timetable
            </h2>

            {loadingAssignments ? (
              <LoadingSpinner />
            ) : assignments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: theme.colors.text.secondary,
                }}
              >
                <p style={{ fontSize: "48px", marginBottom: "8px" }}>📭</p>
                <p>No teaching assignments created yet</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <Table columns={tableColumns} data={assignments} />
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
