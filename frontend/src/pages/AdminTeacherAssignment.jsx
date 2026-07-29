import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../utils/axios";
import DashboardLayout from "../components/DashboardLayout";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Alert from "../components/Alert";
import Table from "../components/Table";
import LoadingSpinner from "../components/LoadingSpinner";
import { 
  LayoutDashboard, 
  Building2, 
  BookOpen, 
  GraduationCap, 
  Users, 
  Calendar, 
  FileText, 
  AlertTriangle,
  Plus,
  Clock
} from "lucide-react";

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
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    { label: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} /> },
    { label: "Branches", path: "/admin/branches", icon: <Building2 size={18} /> },
    { label: "Subjects", path: "/admin/subjects", icon: <BookOpen size={18} /> },
    { label: "Students", path: "/admin/students", icon: <GraduationCap size={18} /> },
    { label: "Teachers", path: "/admin/teachers", icon: <Users size={18} /> },
    { label: "Timetable", path: "/admin/teacher-assignments", icon: <Calendar size={18} /> },
    { label: "Reports", path: "/admin/defaulters", icon: <AlertTriangle size={18} /> },
  ];

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "sessionType" && value === "LECTURE") {
        next.batchId = "";
      }
      return next;
    });
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.teacherId) errors.teacherId = "Teacher is required";
    if (!formData.branchId) errors.branchId = "Branch is required";
    if (!formData.subjectId) errors.subjectId = "Subject is required";
    if (!formData.year) errors.year = "Year is required";
    if (!formData.division) errors.division = "Division is required";
    if (!formData.dayOfWeek) errors.dayOfWeek = "Day of week is required";
    if (!formData.startTime) errors.startTime = "Start time is required";
    if (!formData.endTime) errors.endTime = "End time is required";
    if (!formData.academicYear) errors.academicYear = "Academic year is required";

    if (formData.sessionType === "PRACTICAL" && !formData.batchId) {
      errors.batchId = "Batch is required for PRACTICAL sessions";
    }
    if (formData.sessionType === "LECTURE" && formData.batchId) {
      errors.batchId = "Batch must be empty for LECTURE sessions";
    }

    if (formData.startTime && formData.endTime) {
      const start = timeToMinutes(formData.startTime);
      const end = timeToMinutes(formData.endTime);
      if (start !== null && end !== null && end <= start) {
        errors.endTime = "End time must be after start time";
      }
    }

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

      setSuccess("Teacher assignment created successfully!");
      resetForm();
      await fetchAssignments();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to create assignment";
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

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

  const tableColumns = useMemo(
    () => [
      {
        header: "Teacher",
        accessor: "teacherId",
        render: (value) => {
          if (!value) return "N/A";
          return (
            <div className="font-bold text-slate-900">
              {value.name || "Unknown"} <span className="text-xs text-slate-500 font-medium">({value.email || ""})</span>
            </div>
          );
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
        render: (value) => <span className="font-semibold text-slate-700">{value}</span>,
      },
      {
        header: "Time",
        accessor: "startTime",
        render: (value, row) => (
          <span className="font-mono text-xs font-bold text-slate-700">
            {value || "—"} - {row.endTime || ""}
          </span>
        ),
      },
      {
        header: "Type",
        accessor: "sessionType",
        render: (value) => (
          <span
            className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${
              value === "PRACTICAL"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {value}
          </span>
        ),
      },
      {
        header: "Academic Year",
        accessor: "academicYear",
        render: (value) => <span className="text-xs text-slate-500 font-medium">{value}</span>
      },
    ],
    []
  );

  return (
    <DashboardLayout 
      sidebarItems={sidebarItems} 
      title="Timetable Management"
      subtitle="Schedule & Assign Teacher Timetable Slots"
    >
      <div className="space-y-6">
        {error && <Alert message={error} type="error" onClose={() => setError("")} />}
        {success && <Alert message={success} type="success" onClose={() => setSuccess("")} />}

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Form Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus size={16} className="text-blue-600" /> Create Assignment
            </h2>

            {loadingDropdowns ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormSelect
                  label="Teacher"
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleChange}
                  options={teacherOptions}
                  required
                />
                {validationErrors.teacherId && (
                  <p className="text-xs text-rose-600 font-semibold">{validationErrors.teacherId}</p>
                )}

                <FormSelect
                  label="Branch"
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  options={branchOptions}
                  required
                />
                {validationErrors.branchId && (
                  <p className="text-xs text-rose-600 font-semibold">{validationErrors.branchId}</p>
                )}

                <FormSelect
                  label="Subject"
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleChange}
                  options={subjectOptions}
                  required
                />
                {validationErrors.subjectId && (
                  <p className="text-xs text-rose-600 font-semibold">{validationErrors.subjectId}</p>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <FormSelect
                    label="Year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    options={yearOptions}
                    required
                  />
                  <FormSelect
                    label="Division"
                    name="division"
                    value={formData.division}
                    onChange={handleChange}
                    options={divisionOptions}
                    required
                  />
                  <FormSelect
                    label="Type"
                    name="sessionType"
                    value={formData.sessionType}
                    onChange={handleChange}
                    options={sessionTypeOptions}
                    required
                  />
                </div>

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
                      <p className="text-xs text-rose-600 font-semibold">{validationErrors.batchId}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <FormSelect
                    label="Day of Week"
                    name="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={handleChange}
                    options={dayOptions}
                    required
                  />
                  <FormInput
                    label="Academic Year"
                    name="academicYear"
                    type="text"
                    placeholder="2025-2026"
                    value={formData.academicYear}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    label="Start Time"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                  />
                  <FormInput
                    label="End Time"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  loading={submitting}
                  disabled={submitting}
                  fullWidth
                  variant="primary"
                >
                  Assign Teacher
                </Button>
              </form>
            )}
          </div>

          {/* Table Card */}
          <div className="lg:col-span-7 bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" /> Assigned Timetables
            </h2>

            {loadingAssignments ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Clock size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-500">No teaching assignments created yet</p>
              </div>
            ) : (
              <Table columns={tableColumns} data={assignments} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
