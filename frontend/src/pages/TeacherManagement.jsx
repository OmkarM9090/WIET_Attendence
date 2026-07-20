import { useEffect, useState, useMemo } from "react";
import { theme } from "../styles/theme";
import DashboardLayout from "../components/DashboardLayout";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Alert from "../components/Alert";
import Table from "../components/Table";
import Modal from "../components/Modal";
import ExcelFormatGuide from "../components/admin/ExcelFormatGuide";
import DataPreviewTable from "../components/admin/DataPreviewTable";
import UploadResultModal from "../components/UploadResultModal";
import axiosInstance from "../utils/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  getBranches,
  getSubjects,
  createTeacher,
  uploadTeachersExcel,
  updateTeacher,
  deleteTeacher,
  getTeachers,
  getTeachingAssignments,
  updateTeachingAssignment,
  deleteTeachingAssignment,
} from "../services/adminService";

export default function TeacherManagement() {
  // Data
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Create Teacher state
  const [tName, setTName] = useState("");
  const [tEmail, setTEmail] = useState("");
  const [tPassword, setTPassword] = useState("");
  const [tDepartment, setTDepartment] = useState("");
  const [tDesignation, setTDesignation] = useState("Assistant Professor");
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Edit Teacher state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Timetable Assignment state
  const [batches, setBatches] = useState([]);
  const [activeTab, setActiveTab] = useState("view"); // "timetable" or "view"
  const [ttFormData, setTtFormData] = useState({
    teacherId: "",
    branchId: "",
    semester: "",
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
  const [ttValidationErrors, setTtValidationErrors] = useState({});
  const [ttSubmitting, setTtSubmitting] = useState(false);
  const [ttSuccess, setTtSuccess] = useState("");
  const [ttError, setTtError] = useState("");
  const [ttDuplicateWarning, setTtDuplicateWarning] = useState("");
  
  // Edit/Delete Assignment state
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);
  const [editAssignmentData, setEditAssignmentData] = useState(null);
  const [editAssignmentLoading, setEditAssignmentLoading] = useState(false);
  const [deleteAssignmentLoading, setDeleteAssignmentLoading] = useState(null);
  const [detailsModalData, setDetailsModalData] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const sidebarItems = [
    { label: "Dashboard", path: "/admin", icon: "🏠" },
    { label: "Branches", path: "/admin/branches", icon: "🌿" },
    { label: "Subjects", path: "/admin/subjects", icon: "📘" },
    { label: "Students", path: "/admin/students", icon: "🎓" },
    { label: "Teachers", path: "/admin/teachers", icon: "👩‍🏫" },
    { label: "Reports", path: "/admin/defaulters", icon: "📊" },
  ];

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const data = await getTeachers(searchTerm || null);
      setTeachers(data);
    } catch (err) {
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const data = await getTeachingAssignments();
      console.log("Fetched assignments - Type:", typeof data, "Is Array:", Array.isArray(data), "Data:", data);
      
      // Ensure we have an array
      const assignmentsArray = Array.isArray(data) ? data : (data?.data ? data.data : []);
      setAssignments(assignmentsArray);
      
      if (assignmentsArray.length > 0) {
        console.log("Sample assignment:", assignmentsArray[0]);
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setAssignments([]);
      setTtError(`Failed to load assignments: ${err.message || err}`);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Timetable Assignment Functions
  const DAY_OPTIONS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const SESSION_TYPES = ["LECTURE", "PRACTICAL"];
  const YEAR_OPTIONS = [1, 2, 3, 4];
  const DIVISION_OPTIONS = ["A", "B", "C"];
  
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = String(timeStr).split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const handleTtChange = (e) => {
    const { name, value } = e.target;
    setTtFormData((prev) => {
      const next = { ...prev, [name]: value };
      
      // Auto-set year based on semester (1-2=FE, 3-4=SE, 5-6=TE, 7-8=BE)
      if (name === "semester") {
        const sem = Number(value);
        if (sem >= 1 && sem <= 2) next.year = "1";
        else if (sem >= 3 && sem <= 4) next.year = "2";
        else if (sem >= 5 && sem <= 6) next.year = "3";
        else if (sem >= 7 && sem <= 8) next.year = "4";
      }
      
      // Clear batch if switching to LECTURE
      if (name === "sessionType" && value === "LECTURE") {
        next.batchId = "";
      }
      return next;
    });
    setTtValidationErrors((prev) => ({ ...prev, [name]: "" }));
    setTtDuplicateWarning(""); // Clear duplicate warning on field change
  };

  const validateTtForm = () => {
    const errors = {};
    if (!ttFormData.teacherId) errors.teacherId = "Teacher is required";
    if (!ttFormData.branchId) errors.branchId = "Branch is required";
    if (!ttFormData.semester) errors.semester = "Semester is required";
    if (!ttFormData.subjectId) errors.subjectId = "Subject is required";
    if (!ttFormData.year) errors.year = "Year is required";
    if (!ttFormData.division) errors.division = "Division is required";
    if (!ttFormData.dayOfWeek) errors.dayOfWeek = "Day of week is required";
    if (!ttFormData.startTime) errors.startTime = "Start time is required";
    if (!ttFormData.endTime) errors.endTime = "End time is required";
    if (!ttFormData.academicYear) errors.academicYear = "Academic year is required";
    if (ttFormData.sessionType === "PRACTICAL" && !ttFormData.batchId) {
      errors.batchId = "Batch is required for PRACTICAL sessions";
    }
    if (ttFormData.startTime && ttFormData.endTime) {
      const start = timeToMinutes(ttFormData.startTime);
      const end = timeToMinutes(ttFormData.endTime);
      if (start !== null && end !== null && end <= start) {
        errors.endTime = "End time must be after start time";
      }
    }
    if (ttFormData.academicYear) {
      const yearRegex = /^\d{4}-\d{4}$/;
      if (!yearRegex.test(ttFormData.academicYear)) {
        errors.academicYear = "Format must be YYYY-YYYY (e.g., 2025-2026)";
      }
    }
    setTtValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkForDuplicateAssignment = () => {
    if (!Array.isArray(assignments) || assignments.length === 0) return false;

    const isDuplicate = assignments.some((a) => {
      // For LECTURE: batchId should be null/undefined
      // For PRACTICAL: batchId should match
      const formBatchId = ttFormData.sessionType === "PRACTICAL" ? ttFormData.batchId : null;
      const assignmentBatchId = a.batchId ? (typeof a.batchId === "string" ? a.batchId : a.batchId._id) : null;
      
      // Match the unique index: teacherId, subjectId, branchId, year, division, batchId, dayOfWeek, startTime, academicYear
      return (
        (a.teacherId?._id || a.teacherId) === ttFormData.teacherId &&
        (a.subjectId?._id || a.subjectId) === ttFormData.subjectId &&
        (a.branchId?._id || a.branchId) === ttFormData.branchId &&
        String(a.year) === String(ttFormData.year) &&
        a.division === ttFormData.division &&
        String(assignmentBatchId) === String(formBatchId) &&
        a.dayOfWeek === ttFormData.dayOfWeek &&
        a.startTime === ttFormData.startTime &&
        a.academicYear === ttFormData.academicYear
      );
    });

    return isDuplicate;
  };

  const handleTtSubmit = async (e) => {
    e.preventDefault();
    setTtError("");
    setTtSuccess("");
    setTtDuplicateWarning("");
    
    if (!validateTtForm()) {
      setTtError("Please fix the validation errors");
      return;
    }

    // Check for duplicate before submission
    const hasDuplicate = checkForDuplicateAssignment();
    console.log("Checking for duplicate:", {
      formData: ttFormData,
      assignmentsCount: Array.isArray(assignments) ? assignments.length : 0,
      hasDuplicate,
      assignments: Array.isArray(assignments) ? assignments.map(a => ({
        teacherId: a.teacherId?._id || a.teacherId,
        subjectId: a.subjectId?._id || a.subjectId,
        branchId: a.branchId?._id || a.branchId,
        year: a.year,
        division: a.division,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        sessionType: a.sessionType,
        academicYear: a.academicYear,
        batchId: a.batchId?._id || a.batchId
      })) : []
    });
    
    if (hasDuplicate) {
      setTtDuplicateWarning("⚠️ This assignment already exists! Check the View All tab or modify the details.");
      return;
    }

    setTtSubmitting(true);
    try {
      await axiosInstance.post("/admin/assign-teacher", {
        teacherId: ttFormData.teacherId,
        subjectId: ttFormData.subjectId,
        branchId: ttFormData.branchId,
        year: Number(ttFormData.year),
        division: ttFormData.division,
        batchId: ttFormData.sessionType === "PRACTICAL" ? ttFormData.batchId : undefined,
        dayOfWeek: ttFormData.dayOfWeek,
        startTime: ttFormData.startTime,
        endTime: ttFormData.endTime,
        sessionType: ttFormData.sessionType,
        academicYear: ttFormData.academicYear,
      });
      // Reset form
      setTtFormData({
        teacherId: "",
        branchId: "",
        semester: "",
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
      // Refresh assignments
      await fetchAssignments();
      // Show success and switch tab
      setTtSuccess("✅ Timetable assignment created successfully!");
      setActiveTab("view");
      // Clear success after 3 seconds
      setTimeout(() => setTtSuccess(""), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to create assignment";
      setTtError(`❌ ${errorMsg}`);
      console.error("Assignment creation error:", err);
    } finally {
      setTtSubmitting(false);
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setEditAssignmentData({
      teacherId: assignment.teacherId?._id || assignment.teacherId,
      subjectId: assignment.subjectId?._id || assignment.subjectId,
      branchId: assignment.branchId?._id || assignment.branchId,
      year: assignment.year,
      division: assignment.division,
      batchId: assignment.batchId?._id || assignment.batchId || "",
      dayOfWeek: assignment.dayOfWeek,
      startTime: assignment.startTime,
      endTime: assignment.endTime,
      sessionType: assignment.sessionType,
      academicYear: assignment.academicYear,
    });
    setIsEditAssignmentOpen(true);
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment || !editAssignmentData) return;
    
    setEditAssignmentLoading(true);
    try {
      await updateTeachingAssignment(editingAssignment._id, {
        ...editAssignmentData,
        batchId: editAssignmentData.sessionType === "PRACTICAL" ? editAssignmentData.batchId : undefined,
      });
      
      await fetchAssignments();
      setTtSuccess("✅ Assignment updated successfully!");
      setIsEditAssignmentOpen(false);
      setTimeout(() => setTtSuccess(""), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to update assignment";
      setTtError(`❌ ${errorMsg}`);
      console.error("Update error:", err);
    } finally {
      setEditAssignmentLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    
    setDeleteAssignmentLoading(assignmentId);
    try {
      await deleteTeachingAssignment(assignmentId);
      await fetchAssignments();
      setTtSuccess("✅ Assignment deleted successfully!");
      setTimeout(() => setTtSuccess(""), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to delete assignment";
      setTtError(`❌ ${errorMsg}`);
      console.error("Delete error:", err);
    } finally {
      setDeleteAssignmentLoading(null);
    }
  };

  const handleShowDetails = (assignment) => {
    setDetailsModalData(assignment);
    setIsDetailsOpen(true);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const branchesRes = await getBranches();
        setBranches(branchesRes);
        await Promise.all([fetchTeachers(), fetchAssignments()]);
      } catch (err) {
        // non-blocking
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch subjects when branch or semester changes in timetable form
  useEffect(() => {
    const fetchTtSubjects = async () => {
      if (!ttFormData.branchId || !ttFormData.semester) {
        setSubjects([]);
        setTtFormData((prev) => ({ ...prev, subjectId: "" }));
        return;
      }
      try {
        const data = await getSubjects(ttFormData.branchId, ttFormData.semester);
        setSubjects(data);
      } catch (err) {
        setSubjects([]);
      }
    };
    fetchTtSubjects();
  }, [ttFormData.branchId, ttFormData.semester]);

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setCreateError("");
      setCreateSuccess("");

      const payload = {
        name: tName.trim(),
        email: tEmail.trim(),
        password: tPassword,
        department: tDepartment,
        designation: tDesignation || undefined,
      };

      const res = await createTeacher(payload);
      setCreateSuccess(res.message || "Teacher created successfully");

      await fetchTeachers();

      // reset form
      setTName("");
      setTEmail("");
      setTPassword("");
      setTDepartment("");
      setTDesignation("Assistant Professor");
      setIsCreateOpen(false);
    } catch (err) {
      setCreateError(err.message || "Failed to create teacher");
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (teacher) => {
    setEditingTeacher({
      id: teacher._id,
      name: teacher.userId?.name || "",
      email: teacher.userId?.email || "",
      department: teacher.department?._id || teacher.department,
      designation: teacher.designation || "",
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!editingTeacher) return;
    try {
      setSavingEdit(true);
      setCreateError("");
      setCreateSuccess("");

      const payload = {
        name: editingTeacher.name.trim(),
        email: editingTeacher.email.trim(),
        department: editingTeacher.department,
        designation: editingTeacher.designation,
      };

      await updateTeacher(editingTeacher.id, payload);
      setCreateSuccess("Teacher updated successfully");
      setIsEditOpen(false);
      setEditingTeacher(null);
      await fetchTeachers();
    } catch (err) {
      setCreateError(err.message || "Failed to update teacher");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setCreateError("Please select an Excel file to upload");
      return;
    }
    try {
      setUploading(true);
      setCreateError("");
      setCreateSuccess("");
      
      const { data } = await uploadTeachersExcel(uploadFile);
      
      setUploadResult(data);
      setIsResultModalOpen(true);
      setUploadFile(null);
      await fetchTeachers();
    } catch (err) {
      setCreateError(err.message || "Failed to upload Excel");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTeacher = async (teacher) => {
    const ok = window.confirm(`Delete teacher ${teacher.userId?.name || ""}? This cannot be undone.`);
    if (!ok) return;
    try {
      setCreateError("");
      setCreateSuccess("");
      await deleteTeacher(teacher._id);
      setCreateSuccess("Teacher deleted");
      await fetchTeachers();
    } catch (err) {
      setCreateError(err.message || "Failed to delete teacher");
    }
  };

  return (
    <DashboardLayout
      title="Teachers Management"
      subtitle="Create and manage teachers"
      sidebarItems={sidebarItems}
    >
      {/* Alerts Container */}
      {(createError || createSuccess || ttError || ttSuccess) && (
        <div className="mb-6 space-y-2">
          {(createError || ttError) && (
            <Alert 
              message={createError || ttError} 
              type="error" 
              onClose={() => {
                setCreateError("");
                setTtError("");
              }} 
            />
          )}
          {(createSuccess || ttSuccess) && (
            <Alert 
              message={createSuccess || ttSuccess} 
              type="success" 
              onClose={() => {
                setCreateSuccess("");
                setTtSuccess("");
              }} 
            />
          )}
        </div>
      )}

      {/* Header Section */}
      <div
        className="mb-8 flex flex-col items-start justify-between gap-4 rounded-xl border p-6 md:flex-row md:items-center"
        style={{
          borderColor: theme.colors.primary[100],
          backgroundColor: theme.colors.primary[50],
          boxShadow: theme.shadows.md,
        }}
      >
        <div>
          <h2 className="text-xl font-bold" style={{ color: theme.colors.primary[600] }}>
            👨‍🏫 Teachers
          </h2>
          <p className="mt-1 text-sm" style={{ color: theme.colors.text.secondary }}>
            Manage teacher profiles and timetable assignments
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-primary-200">
            <label
              className="cursor-pointer rounded-md border border-primary-200 px-3 py-2 text-sm font-medium hover:bg-primary-50 transition text-primary-700"
            >
              Choose File for Preview
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setUploadFile(file);
                    setShowPreview(true);
                  }
                  e.target.value = null; // reset so same file can be selected again
                }}
                className="hidden"
              />
            </label>
            <span className="text-sm px-2 max-w-[150px] truncate text-slate-500">
              {uploadFile && !showPreview ? uploadFile.name : "No file chosen"}
            </span>
          </div>

          <div className="w-full max-w-xs">
            <FormInput
              label=""
              name="search"
              placeholder="🔍 Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>+ Add Teacher</Button>
        </div>
      </div>

      {/* Upload Instructions and Format Guide */}
      <ExcelFormatGuide type="teacher" />

      {/* Teachers Table Section */}
      <div className="mb-10 rounded-xl border p-6" style={{ borderColor: theme.colors.border, boxShadow: theme.shadows.md }}>
        <div className="mb-6 flex items-center gap-3">
          <span className="text-2xl">👥</span>
          <div>
            <h4 className="text-lg font-bold" style={{ color: theme.colors.text.primary }}>
              All Teachers
            </h4>
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              View and manage teacher information
            </p>
          </div>
        </div>
        <Table
          columns={[
            { header: "Name", accessor: "userId", render: (val) => val?.name || "-" },
            { header: "Email", accessor: "userId", render: (val) => val?.email || "-" },
            { header: "Department", accessor: "department", render: (val) => (val ? `${val.name} (${val.code})` : "-") },
            { header: "Designation", accessor: "designation" },
          ]}
          data={teachers.filter((t) =>
            (t.userId?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (t.userId?.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
          )}
          emptyMessage={loadingTeachers ? "Loading teachers..." : "No teachers found"}
          actions={(row) => (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEditModal(row)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteTeacher(row)}>
                Delete
              </Button>
            </div>
          )}
        />
      </div>

      {/* Create Teacher Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="🆕 Add New Teacher"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeacher} disabled={createLoading}>
              {createLoading ? "Creating..." : "Create Teacher"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateTeacher}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Full Name"
              name="modalName"
              placeholder="John Doe"
              value={tName}
              onChange={(e) => setTName(e.target.value)}
              required
            />
            <FormInput
              label="Email Address"
              name="modalEmail"
              type="email"
              placeholder="john@college.com"
              value={tEmail}
              onChange={(e) => setTEmail(e.target.value)}
              required
            />
            <FormInput
              label="Password"
              name="modalPassword"
              type="password"
              placeholder="••••••••"
              value={tPassword}
              onChange={(e) => setTPassword(e.target.value)}
              required
            />
            <FormSelect
              label="Department"
              name="modalDepartment"
              value={tDepartment}
              onChange={(e) => setTDepartment(e.target.value)}
              options={[
                { label: "Select Department", value: "" },
                ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id })),
              ]}
              required
            />
            <FormInput
              label="Designation"
              name="modalDesignation"
              placeholder="e.g., Assistant Professor"
              value={tDesignation}
              onChange={(e) => setTDesignation(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="✏️ Edit Teacher Details"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={savingEdit}>
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        {editingTeacher && (
          <form onSubmit={handleEditSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Full Name"
                name="editName"
                placeholder="John Doe"
                value={editingTeacher.name}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                required
              />
              <FormInput
                label="Email Address"
                name="editEmail"
                type="email"
                placeholder="john@college.com"
                value={editingTeacher.email}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                required
              />
              <FormSelect
                label="Department"
                name="editDepartment"
                value={editingTeacher.department}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, department: e.target.value })}
                options={[
                  { label: "Select Department", value: "" },
                  ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id })),
                ]}
                required
              />
              <FormInput
                label="Designation"
                name="editDesignation"
                placeholder="e.g., Assistant Professor"
                value={editingTeacher.designation}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, designation: e.target.value })}
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Timetable Assignments Section */}
      <div className="mt-12 rounded-xl border p-6" style={{ borderColor: theme.colors.border, boxShadow: theme.shadows.md }}>
        <div className="mb-8 flex items-center gap-3">
          <span className="text-2xl">🗓️</span>
          <div>
            <h4 className="text-lg font-bold" style={{ color: theme.colors.text.primary }}>
              Timetable Assignments
            </h4>
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              Create and manage teacher timetable schedules
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `2px solid ${theme.colors.border}`, marginBottom: "24px", gap: "8px" }}>
          <button
            onClick={() => {
              setActiveTab("timetable");
              setTtError("");
              setTtSuccess("");
            }}
            style={{
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: activeTab === "timetable" ? "600" : "500",
              color: activeTab === "timetable" ? theme.colors.primary : theme.colors.text.secondary,
              borderBottom: activeTab === "timetable" ? `3px solid ${theme.colors.primary}` : "none",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              cursor: "pointer",
              backgroundColor: "transparent",
              transition: "all 0.2s",
            }}
          >
            ➕ Create Assignment
          </button>
          <button
            onClick={() => setActiveTab("view")}
            style={{
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: activeTab === "view" ? "600" : "500",
              color: activeTab === "view" ? theme.colors.primary : theme.colors.text.secondary,
              borderBottom: activeTab === "view" ? `3px solid ${theme.colors.primary}` : "none",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              cursor: "pointer",
              backgroundColor: "transparent",
              transition: "all 0.2s",
            }}
          >
            📋 View All ({(Array.isArray(assignments) ? assignments.length : 0)})
          </button>
        </div>

        {/* Create Timetable Tab */}
        {activeTab === "timetable" && (
          <div>
            <div
              style={{
                backgroundColor: theme.colors.primary[50],
                borderRadius: "8px",
                border: `1px solid ${theme.colors.primary[100]}`,
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <p style={{ fontSize: "14px", color: theme.colors.text.primary, margin: "0" }}>
                <strong>💡 Tip:</strong> Fill out all fields to create a new timetable assignment. The system will prevent duplicate assignments automatically.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                border: `1px solid ${theme.colors.border}`,
                padding: "24px",
                maxWidth: "600px",
              }}
            >
              {/* Form Feedback Messages */}
              {ttDuplicateWarning && (
                <div style={{ marginBottom: "16px" }}>
                  <Alert
                    type="warning"
                    message="Duplicate Assignment Detected"
                    description={ttDuplicateWarning}
                  />
                </div>
              )}
              {ttError && (
                <div style={{ marginBottom: "16px" }}>
                  <Alert
                    type="error"
                    message="Error"
                    description={ttError}
                  />
                </div>
              )}
              {ttSuccess && (
                <div style={{ marginBottom: "16px" }}>
                  <Alert
                    type="success"
                    message="Success"
                    description={ttSuccess}
                  />
                </div>
              )}

              <form onSubmit={handleTtSubmit} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <FormSelect
                    label="Teacher"
                    name="teacherId"
                    value={ttFormData.teacherId}
                    onChange={handleTtChange}
                    options={[
                      { value: "", label: "Select teacher" },
                      ...teachers.map((t) => ({
                        value: t.userId?._id || t._id,
                        label: `${t.userId?.name || "Unknown"} (${t.userId?.email || ""})`,
                      })),
                    ]}
                    required
                  />
                  {ttValidationErrors.teacherId && (
                    <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                      {ttValidationErrors.teacherId}
                    </p>
                  )}
                </div>

                <div>
                  <FormSelect
                    label="Branch"
                    name="branchId"
                    value={ttFormData.branchId}
                    onChange={handleTtChange}
                    options={[
                      { value: "", label: "Select branch" },
                      ...branches.map((b) => ({ value: b._id, label: `${b.name} (${b.code})` })),
                    ]}
                    required
                  />
                  {ttValidationErrors.branchId && (
                    <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                      {ttValidationErrors.branchId}
                    </p>
                  )}
                </div>

                <div>
                  <FormSelect
                    label="Semester"
                    name="semester"
                    value={ttFormData.semester}
                    onChange={handleTtChange}
                    options={[
                      { value: "", label: "Select semester" },
                      { value: 1, label: "1" },
                      { value: 2, label: "2" },
                      { value: 3, label: "3" },
                      { value: 4, label: "4" },
                      { value: 5, label: "5" },
                      { value: 6, label: "6" },
                      { value: 7, label: "7" },
                      { value: 8, label: "8" },
                    ]}
                    required
                  />
                  {ttValidationErrors.semester && (
                    <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                      {ttValidationErrors.semester}
                    </p>
                  )}
                </div>

                <div>
                  <FormSelect
                    label="Subject"
                    name="subjectId"
                    value={ttFormData.subjectId}
                    onChange={handleTtChange}
                    options={[
                      { value: "", label: "Select subject" },
                      ...subjects.map((s) => ({ value: s._id, label: `${s.name} (${s.code})` })),
                    ]}
                    required
                  />
                  {ttValidationErrors.subjectId && (
                    <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                      {ttValidationErrors.subjectId}
                    </p>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                      Year <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: "6px",
                        backgroundColor: "#f3f4f6",
                        border: `1px solid ${ttFormData.year ? "#3b82f6" : "#d1d5db"}`,
                        fontSize: "14px",
                        color: ttFormData.year ? "#1f2937" : "#9ca3af",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        {ttFormData.year ? `Year ${ttFormData.year} (${ttFormData.semester ? `Sem ${ttFormData.semester}` : ""})` : "Select semester first"}
                      </span>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>Auto-calculated</span>
                    </div>
                  </div>
                  <div>
                    <FormSelect
                      label="Division"
                      name="division"
                      value={ttFormData.division}
                      onChange={handleTtChange}
                      options={[
                        { value: "", label: "Select division" },
                        ...DIVISION_OPTIONS.map((d) => ({ value: d, label: d })),
                      ]}
                      required
                    />
                    {ttValidationErrors.division && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        {ttValidationErrors.division}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <FormSelect
                    label="Session Type"
                    name="sessionType"
                    value={ttFormData.sessionType}
                    onChange={handleTtChange}
                    options={SESSION_TYPES.map((s) => ({ value: s, label: s }))}
                    required
                  />
                </div>

                {ttFormData.sessionType === "PRACTICAL" && (
                  <div>
                    <FormSelect
                      label="Batch"
                      name="batchId"
                      value={ttFormData.batchId}
                      onChange={handleTtChange}
                      options={[
                        { value: "", label: "Select batch" },
                        ...batches.map((b) => ({ value: b._id, label: b.name })),
                      ]}
                      required
                    />
                    {ttValidationErrors.batchId && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        {ttValidationErrors.batchId}
                      </p>
                    )}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <FormSelect
                      label="Day"
                      name="dayOfWeek"
                      value={ttFormData.dayOfWeek}
                      onChange={handleTtChange}
                      options={DAY_OPTIONS.map((d) => ({ value: d, label: d }))}
                      required
                    />
                    {ttValidationErrors.dayOfWeek && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        {ttValidationErrors.dayOfWeek}
                      </p>
                    )}
                  </div>
                  <div>
                    <FormInput
                      label="Start Time"
                      name="startTime"
                      type="time"
                      value={ttFormData.startTime}
                      onChange={handleTtChange}
                      required
                    />
                    {ttValidationErrors.startTime && (
                      <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        {ttValidationErrors.startTime}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <FormInput
                    label="End Time"
                    name="endTime"
                    type="time"
                    value={ttFormData.endTime}
                    onChange={handleTtChange}
                    required
                  />
                  {ttValidationErrors.endTime && (
                    <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                      {ttValidationErrors.endTime}
                    </p>
                  )}
                </div>

                <div>
                  <FormInput
                    label="Academic Year"
                    name="academicYear"
                    type="text"
                    placeholder="2025-2026"
                    value={ttFormData.academicYear}
                    onChange={handleTtChange}
                    required
                  />
                  {ttValidationErrors.academicYear && (
                    <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                      {ttValidationErrors.academicYear}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  loading={ttSubmitting} 
                  disabled={ttSubmitting || !!ttDuplicateWarning} 
                  style={{ width: "100%" }}
                  title={ttDuplicateWarning ? "Cannot submit - duplicate assignment detected" : ""}
                >
                  {ttSubmitting ? "Creating..." : ttDuplicateWarning ? "Fix Duplicate to Submit" : "Create Assignment"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* View All Timetable Tab */}
        {activeTab === "view" && (
          <div>
            <div
              style={{
                backgroundColor: theme.colors.primary[50],
                borderRadius: "8px",
                border: `1px solid ${theme.colors.primary[100]}`,
                padding: "16px",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p style={{ fontSize: "14px", color: theme.colors.text.primary, margin: "0" }}>
                <strong>📋 Info:</strong> All timetable assignments are listed below. Click on any assignment to view details, edit, or delete it.
              </p>
              <button
                onClick={() => {
                  console.log("Manual refresh clicked");
                  fetchAssignments();
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "white",
                  color: theme.colors.primary,
                  border: `1px solid ${theme.colors.primary}`,
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = theme.colors.primary[50];
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "white";
                }}
                title="Manually refresh the assignments list"
              >
                🔄 Reload Now
              </button>
            </div>
            {/* Success/Error Messages for View Tab */}
            {ttSuccess && (
              <div style={{ marginBottom: "16px" }}>
                <Alert
                  type="success"
                  message="Success"
                  description={ttSuccess}
                  onClose={() => setTtSuccess("")}
                />
              </div>
            )}
            {ttError && (
              <div style={{ marginBottom: "16px" }}>
                <Alert
                  type="error"
                  message="Error"
                  description={ttError}
                  onClose={() => setTtError("")}
                />
              </div>
            )}

            {loadingAssignments ? (
              <LoadingSpinner />
            ) : !Array.isArray(assignments) || assignments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: theme.colors.text.secondary }}>
                <p style={{ fontSize: "40px", marginBottom: "12px" }}>📭</p>
                <p>No timetable assignments yet</p>
                <p style={{ fontSize: "13px", marginTop: "8px", color: theme.colors.text.secondary }}>
                  Start by creating one using the "Create Assignment" tab
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "12px", backgroundColor: theme.colors.neutral[50], borderRadius: "8px" }}>
                  <p style={{ fontSize: "14px", color: theme.colors.text.secondary }}>
                    Total Assignments: <strong style={{ color: theme.colors.text.primary }}>{assignments.length}</strong>
                  </p>
                  <button
                    onClick={fetchAssignments}
                    disabled={loadingAssignments}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#e0e7ff",
                      color: "#4338ca",
                      border: "none",
                      borderRadius: "4px",
                      cursor: loadingAssignments ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      if (!loadingAssignments) {
                        e.target.style.backgroundColor = "#c7d2fe";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!loadingAssignments) {
                        e.target.style.backgroundColor = "#e0e7ff";
                      }
                    }}
                  >
                    {loadingAssignments ? "⏳ Refreshing..." : "🔄 Refresh"}
                  </button>
                </div>
                <Table
                  columns={[
                    { 
                      header: "TEACHER", 
                      accessor: "teacherId", 
                      render: (v) => (
                        <div style={{ fontWeight: "500" }}>
                          {v?.name || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Not assigned</span>}
                        </div>
                      )
                    },
                    { 
                      header: "SUBJECT", 
                      accessor: "subjectId", 
                      render: (v) => (
                        <div>
                          {v ? (
                            <>
                              <div style={{ fontWeight: "500" }}>{v.name}</div>
                              <div style={{ fontSize: "11px", color: theme.colors.text.secondary }}>({v.code})</div>
                            </>
                          ) : (
                            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Not assigned</span>
                          )}
                        </div>
                      )
                    },
                    { 
                      header: "BRANCH", 
                      accessor: "branchId", 
                      render: (v) => (
                        <div>
                          {v?.name ? (
                            <>
                              <div style={{ fontWeight: "500" }}>{v.name}</div>
                              {v.code && <div style={{ fontSize: "11px", color: theme.colors.text.secondary }}>({v.code})</div>}
                            </>
                          ) : (
                            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>N/A</span>
                          )}
                        </div>
                      )
                    },
                    { 
                      header: "YEAR", 
                      accessor: "year",
                      render: (v) => (
                        <div style={{ textAlign: "center", fontWeight: "600", color: theme.colors.primary }}>
                          {v ? `Year ${v}` : "-"}
                        </div>
                      )
                    },
                    { 
                      header: "DIV", 
                      accessor: "division",
                      render: (v) => (
                        <div style={{ 
                          textAlign: "center", 
                          fontWeight: "700", 
                          fontSize: "14px",
                          color: theme.colors.primary,
                          backgroundColor: theme.colors.primary[50],
                          padding: "4px 8px",
                          borderRadius: "4px",
                          display: "inline-block"
                        }}>
                          {v || "-"}
                        </div>
                      )
                    },
                    { 
                      header: "DAY", 
                      accessor: "dayOfWeek",
                      render: (v) => (
                        <div style={{ fontWeight: "500", textTransform: "capitalize" }}>
                          {v ? v.charAt(0) + v.slice(1).toLowerCase() : "-"}
                        </div>
                      )
                    },
                    { 
                      header: "TIME", 
                      accessor: "startTime", 
                      render: (v, r) => (
                        <div style={{ fontFamily: "monospace", fontSize: "13px" }}>
                          {v && r.endTime ? (
                            `${v} - ${r.endTime}`
                          ) : (
                            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Not set</span>
                          )}
                        </div>
                      )
                    },
                    {
                      header: "TYPE",
                      accessor: "sessionType",
                      render: (v) => (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: v === "PRACTICAL" ? "#fef3c7" : "#dbeafe",
                            color: v === "PRACTICAL" ? "#92400e" : "#1e40af",
                          }}
                        >
                          {v}
                        </span>
                      ),
                    },
                    {
                      header: "ACTIONS",
                      accessor: "_id",
                      render: (v, row) => (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
                          <button
                            onClick={() => handleShowDetails(row)}
                            title="View Details"
                            style={{
                              padding: "6px 10px",
                              backgroundColor: "#e0f2fe",
                              color: "#0369a1",
                              border: "1px solid #bae6fd",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: "600",
                              transition: "all 0.2s",
                            }}
                            onMouseOver={(e) => {
                              e.target.style.backgroundColor = "#bae6fd";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.backgroundColor = "#e0f2fe";
                            }}
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => handleEditAssignment(row)}
                            title="Edit Assignment"
                            style={{
                              padding: "6px 10px",
                              backgroundColor: "#fef3c7",
                              color: "#92400e",
                              border: "1px solid #fde68a",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: "600",
                              transition: "all 0.2s",
                            }}
                            onMouseOver={(e) => {
                              e.target.style.backgroundColor = "#fde68a";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.backgroundColor = "#fef3c7";
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(v)}
                            disabled={deleteAssignmentLoading === v}
                            title="Delete Assignment"
                            style={{
                              padding: "6px 10px",
                              backgroundColor: deleteAssignmentLoading === v ? "#fca5a5" : "#fee2e2",
                              color: "#991b1b",
                              border: deleteAssignmentLoading === v ? "1px solid #fca5a5" : "1px solid #fecaca",
                              borderRadius: "6px",
                              cursor: deleteAssignmentLoading === v ? "not-allowed" : "pointer",
                              fontSize: "11px",
                              fontWeight: "600",
                              transition: "all 0.2s",
                            }}
                            onMouseOver={(e) => {
                              if (deleteAssignmentLoading !== v) {
                                e.target.style.backgroundColor = "#fecaca";
                              }
                            }}
                            onMouseOut={(e) => {
                              if (deleteAssignmentLoading !== v) {
                                e.target.style.backgroundColor = "#fee2e2";
                              }
                            }}
                          >
                            {deleteAssignmentLoading === v ? "⏳ Deleting..." : "🗑️ Delete"}
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  data={Array.isArray(assignments) ? assignments : []}
                />
              </div>
            )}
          </div>
        )}

        {/* Details Modal */}
        <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Assignment Details">
          {detailsModalData && (
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <p style={{ fontSize: "12px", color: theme.colors.text.secondary, marginBottom: "4px" }}>
                    Teacher
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: "600" }}>
                    {detailsModalData.teacherId?.name || "-"}
                  </p>
                  <p style={{ fontSize: "12px", color: theme.colors.text.secondary }}>
                    {detailsModalData.teacherId?.email}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: theme.colors.text.secondary, marginBottom: "4px" }}>
                    Subject
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: "600" }}>
                    {detailsModalData.subjectId?.name}
                  </p>
                  <p style={{ fontSize: "12px", color: theme.colors.text.secondary }}>
                    Code: {detailsModalData.subjectId?.code}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <p style={{ fontSize: "12px", color: theme.colors.text.secondary, marginBottom: "4px" }}>
                    Class
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: "600" }}>
                    {detailsModalData.branchId?.name} - Year {detailsModalData.year} Division {detailsModalData.division}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: theme.colors.text.secondary, marginBottom: "4px" }}>
                    Academic Year
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: "600" }}>
                    {detailsModalData.academicYear}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <p style={{ fontSize: "12px", color: theme.colors.text.secondary, marginBottom: "4px" }}>
                    Day
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: "600" }}>
                    {detailsModalData.dayOfWeek}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: theme.colors.text.secondary, marginBottom: "4px" }}>
                    Time
                  </p>
                  <p style={{ fontSize: "16px", fontWeight: "600" }}>
                    {detailsModalData.startTime} - {detailsModalData.endTime}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <p style={{ fontSize: "12px", color: theme.colors.text.secondary, marginBottom: "4px" }}>
                    Session Type
                  </p>
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontWeight: "600",
                      backgroundColor: detailsModalData.sessionType === "PRACTICAL" ? "#fef3c7" : "#dbeafe",
                      color: detailsModalData.sessionType === "PRACTICAL" ? "#92400e" : "#1e40af",
                      display: "inline-block",
                    }}
                  >
                    {detailsModalData.sessionType}
                  </span>
                </div>
                {detailsModalData.batchId && (
                  <div>
                    <p style={{ fontSize: "12px", color: theme.colors.text.secondary, marginBottom: "4px" }}>
                      Batch
                    </p>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      {detailsModalData.batchId?.name || "-"}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <Button
                  onClick={() => {
                    handleEditAssignment(detailsModalData);
                    setIsDetailsOpen(false);
                  }}
                  style={{ flex: 1 }}
                >
                  ✏️ Edit
                </Button>
                <Button
                  onClick={() => {
                    handleDeleteAssignment(detailsModalData._id);
                    setIsDetailsOpen(false);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    border: "none",
                  }}
                >
                  🗑️ Delete
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Assignment Modal */}
        <Modal
          isOpen={isEditAssignmentOpen}
          onClose={() => setIsEditAssignmentOpen(false)}
          title="Edit Assignment"
        >
          {editAssignmentData && (
            <div style={{ display: "grid", gap: "16px" }}>
              <FormSelect
                label="Teacher"
                value={editAssignmentData.teacherId}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({ ...prev, teacherId: e.target.value }))
                }
                options={[
                  { value: "", label: "Select teacher" },
                  ...teachers.map((t) => ({
                    value: t.userId?._id || t._id,
                    label: `${t.userId?.name || "Unknown"} (${t.userId?.email || ""})`,
                  })),
                ]}
              />

              <FormSelect
                label="Branch"
                value={editAssignmentData.branchId}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({ ...prev, branchId: e.target.value }))
                }
                options={[
                  { value: "", label: "Select branch" },
                  ...branches.map((b) => ({ value: b._id, label: b.name })),
                ]}
              />

              <FormSelect
                label="Year"
                value={editAssignmentData.year}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({ ...prev, year: e.target.value }))
                }
                options={[
                  { value: "", label: "Select year" },
                  { value: "1", label: "Year 1" },
                  { value: "2", label: "Year 2" },
                  { value: "3", label: "Year 3" },
                  { value: "4", label: "Year 4" },
                ]}
              />

              <FormSelect
                label="Division"
                value={editAssignmentData.division}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({ ...prev, division: e.target.value }))
                }
                options={[
                  { value: "", label: "Select division" },
                  { value: "A", label: "A" },
                  { value: "B", label: "B" },
                  { value: "C", label: "C" },
                ]}
              />

              <FormSelect
                label="Subject"
                value={editAssignmentData.subjectId}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({ ...prev, subjectId: e.target.value }))
                }
                options={[
                  { value: "", label: "Select subject" },
                  ...subjects.map((s) => ({ value: s._id, label: `${s.name} (${s.code})` })),
                ]}
              />

              <FormSelect
                label="Session Type"
                value={editAssignmentData.sessionType}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({ ...prev, sessionType: e.target.value, batchId: e.target.value === "LECTURE" ? "" : prev.batchId }))
                }
                options={[
                  { value: "LECTURE", label: "Lecture" },
                  { value: "PRACTICAL", label: "Practical" },
                ]}
              />

              {editAssignmentData.sessionType === "PRACTICAL" && (
                <FormSelect
                  label="Batch"
                  value={editAssignmentData.batchId}
                  onChange={(e) =>
                    setEditAssignmentData((prev) => ({ ...prev, batchId: e.target.value }))
                  }
                  options={[
                    { value: "", label: "Select batch" },
                    ...batches.map((b) => ({ value: b._id, label: b.name })),
                  ]}
                />
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FormSelect
                  label="Day"
                  value={editAssignmentData.dayOfWeek}
                  onChange={(e) =>
                    setEditAssignmentData((prev) => ({ ...prev, dayOfWeek: e.target.value }))
                  }
                  options={["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].map((d) => ({
                    value: d,
                    label: d,
                  }))}
                />

                <FormInput
                  label="Start Time"
                  type="time"
                  value={editAssignmentData.startTime}
                  onChange={(e) =>
                    setEditAssignmentData((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                />
              </div>

              <FormInput
                label="End Time"
                type="time"
                value={editAssignmentData.endTime}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({ ...prev, endTime: e.target.value }))
                }
              />

              <FormInput
                label="Academic Year"
                type="text"
                placeholder="2025-2026"
                value={editAssignmentData.academicYear}
              <div style={{ display: "flex", gap: "12px" }}>
                <Button
                  onClick={handleUpdateAssignment}
                  loading={editAssignmentLoading}
                  style={{ flex: 1 }}
                >
                  {editAssignmentLoading ? "Updating..." : "Update Assignment"}
                </Button>
                <Button
                  onClick={() => setIsEditAssignmentOpen(false)}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.neutral[100],
                    color: theme.colors.text.primary,
                    border: "none",
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Modal>

      {/* Upload Result Modal */}
      <UploadResultModal 
        isOpen={isResultModalOpen} 
        onClose={() => setIsResultModalOpen(false)} 
        result={uploadResult} 
        type="teacher"
      />

      {/* Data Preview Overlay */}
      {showPreview && uploadFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-6xl w-full">
            <DataPreviewTable 
              file={uploadFile} 
              type="teacher" 
              onCancel={() => {
                setShowPreview(false);
                setUploadFile(null);
              }}
              onConfirm={async (file) => {
                await handleUpload();
                setShowPreview(false);
              }} 
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
