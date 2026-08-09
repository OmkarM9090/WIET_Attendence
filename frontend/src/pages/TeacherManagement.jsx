import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { DEFAULT_ADMIN_SIDEBAR_ITEMS } from "../config/navigation";
import { getCurrentAcademicYear } from "../utils/academicYear";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Alert from "../components/Alert";
import Table from "../components/Table";
import Modal from "../components/Modal";
import ExcelFormatGuide from "../components/admin/ExcelFormatGuide";
import DataPreviewTable from "../components/admin/DataPreviewTable";
import TimetableView from "../components/admin/TimetableView";
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
  deleteAllTeachers,
  getTeachers,
  getTeachingAssignments,
  updateTeachingAssignment,
  deleteTeachingAssignment,
} from "../services/adminService";
import { 
  LayoutDashboard, 
  Building2, 
  BookOpen, 
  GraduationCap, 
  Users, 
  FileText, 
  AlertTriangle,
  Plus,
  Upload,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Calendar,
  Info,
  Clock
} from "lucide-react";

export default function TeacherManagement() {
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [tName, setTName] = useState("");
  const [tEmail, setTEmail] = useState("");
  const [tPassword, setTPassword] = useState("");
  const [tDepartment, setTDepartment] = useState("");
  const [tDesignation, setTDesignation] = useState("Assistant Professor");
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [uploadFile, setUploadFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [batches, setBatches] = useState([]);
  const [activeTab, setActiveTab] = useState("view");
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
    academicYear: getCurrentAcademicYear(),
  });
  const [ttValidationErrors, setTtValidationErrors] = useState({});
  const [ttSubmitting, setTtSubmitting] = useState(false);
  const [ttSuccess, setTtSuccess] = useState("");
  const [ttError, setTtError] = useState("");
  const [ttDuplicateWarning, setTtDuplicateWarning] = useState("");

  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);
  const [editAssignmentData, setEditAssignmentData] = useState(null);
  const [editAssignmentLoading, setEditAssignmentLoading] = useState(false);
  const [editAssignmentError, setEditAssignmentError] = useState("");
  const [editSubjects, setEditSubjects] = useState([]);
  const [editBatches, setEditBatches] = useState([]);
  const [deleteAssignmentLoading, setDeleteAssignmentLoading] = useState(null);
  const [detailsModalData, setDetailsModalData] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const sidebarItems = DEFAULT_ADMIN_SIDEBAR_ITEMS;

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
      const assignmentsArray = Array.isArray(data)
        ? data
        : data?.data
          ? data.data
          : [];
      setAssignments(assignmentsArray);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setAssignments([]);
      setTtError(`Failed to load assignments: ${err.message || err}`);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Dynamically fetch batches for selected class parameters
  useEffect(() => {
    if (ttFormData.branchId && ttFormData.year && ttFormData.division) {
      const fetchBatchesForClass = async () => {
        try {
          const res = await axiosInstance.get("/admin/batches", {
            params: {
              branchId: ttFormData.branchId,
              year: ttFormData.year,
              division: ttFormData.division,
            },
          });
          setBatches(res.data?.batches || []);
        } catch (err) {
          console.error("Failed to load batches for timetable assignment", err);
          setBatches([]);
        }
      };
      fetchBatchesForClass();
    } else {
      setBatches([]);
    }
  }, [ttFormData.branchId, ttFormData.year, ttFormData.division]);

  const DAY_OPTIONS = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
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

      if (name === "semester") {
        const sem = Number(value);
        if (sem >= 1 && sem <= 2) next.year = "1";
        else if (sem >= 3 && sem <= 4) next.year = "2";
        else if (sem >= 5 && sem <= 6) next.year = "3";
        else if (sem >= 7 && sem <= 8) next.year = "4";
      }

      if (name === "sessionType" && value === "LECTURE") {
        next.batchId = "";
      }
      return next;
    });
    setTtValidationErrors((prev) => ({ ...prev, [name]: "" }));
    setTtDuplicateWarning("");
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
    if (!ttFormData.academicYear)
      errors.academicYear = "Academic year is required";
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
    if (Object.keys(errors).length > 0) {
      setTtError("Please fix the validation errors: " + Object.values(errors).join(", "));
      return false;
    }
    return true;
  };

  const checkForDuplicateAssignment = () => {
    if (!Array.isArray(assignments) || assignments.length === 0) return false;

    const isDuplicate = assignments.some((a) => {
      const formBatchId =
        ttFormData.sessionType === "PRACTICAL" ? ttFormData.batchId : null;
      const assignmentBatchId = a.batchId
        ? typeof a.batchId === "string"
          ? a.batchId
          : a.batchId._id
        : null;

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

    const hasDuplicate = checkForDuplicateAssignment();
    if (hasDuplicate) {
      setTtDuplicateWarning(
        "This assignment already exists! Check the View All tab or modify details.",
      );
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
        batchId:
          ttFormData.sessionType === "PRACTICAL"
            ? ttFormData.batchId
            : undefined,
        dayOfWeek: ttFormData.dayOfWeek,
        startTime: ttFormData.startTime,
        endTime: ttFormData.endTime,
        sessionType: ttFormData.sessionType,
        academicYear: ttFormData.academicYear,
      });

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
        academicYear: getCurrentAcademicYear(),
      });

      await fetchAssignments();
      setTtSuccess("Timetable assignment created successfully!");
      setActiveTab("view");
      setTimeout(() => setTtSuccess(""), 3000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to create assignment";
      setTtError(errorMsg);
    } finally {
      setTtSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchEditSubjects = async () => {
      if (!editAssignmentData?.branchId) {
        setEditSubjects([]);
        return;
      }
      try {
        const data = await getSubjects(editAssignmentData.branchId);
        setEditSubjects(data);
      } catch (err) {
        setEditSubjects([]);
      }
    };
    if (isEditAssignmentOpen) {
      fetchEditSubjects();
    }
  }, [editAssignmentData?.branchId, isEditAssignmentOpen]);

  useEffect(() => {
    if (
      isEditAssignmentOpen &&
      editAssignmentData?.branchId &&
      editAssignmentData?.year &&
      editAssignmentData?.division
    ) {
      const fetchBatchesForClass = async () => {
        try {
          const res = await axiosInstance.get("/admin/batches", {
            params: {
              branchId: editAssignmentData.branchId,
              year: editAssignmentData.year,
              division: editAssignmentData.division,
            },
          });
          setEditBatches(res.data?.batches || []);
        } catch (err) {
          setEditBatches([]);
        }
      };
      fetchBatchesForClass();
    } else {
      setEditBatches([]);
    }
  }, [
    isEditAssignmentOpen,
    editAssignmentData?.branchId,
    editAssignmentData?.year,
    editAssignmentData?.division,
  ]);

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setEditAssignmentError("");
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

  const handleUpdateAssignment = async (e) => {
    if (e) e.preventDefault();
    if (!editingAssignment || !editAssignmentData) return;

    setEditAssignmentLoading(true);
    setEditAssignmentError("");
    try {
      await updateTeachingAssignment(editingAssignment._id, {
        ...editAssignmentData,
        batchId:
          editAssignmentData.sessionType === "PRACTICAL"
            ? editAssignmentData.batchId
            : undefined,
      });

      await fetchAssignments();
      setTtSuccess("Assignment updated successfully!");
      setIsEditAssignmentOpen(false);
      setTimeout(() => setTtSuccess(""), 3000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to update assignment";
      setEditAssignmentError(errorMsg);
    } finally {
      setEditAssignmentLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;

    setDeleteAssignmentLoading(assignmentId);
    try {
      await deleteTeachingAssignment(assignmentId);
      await fetchAssignments();
      setTtSuccess("Assignment deleted successfully!");
      setTimeout(() => setTtSuccess(""), 3000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete assignment";
      setTtError(errorMsg);
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
      } catch (err) {}
    };
    init();
  }, []);

  useEffect(() => {
    const fetchTtSubjects = async () => {
      if (!ttFormData.branchId || !ttFormData.semester) {
        setSubjects([]);
        setTtFormData((prev) => ({ ...prev, subjectId: "" }));
        return;
      }
      try {
        const data = await getSubjects(
          ttFormData.branchId,
          ttFormData.semester,
        );
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
    const ok = window.confirm(
      `Delete teacher ${teacher.userId?.name || ""}? This cannot be undone.`,
    );
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
      title="Teacher Management"
      subtitle="Faculty Profiles & Academic Timetables"
      sidebarItems={sidebarItems}
    >
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

      {/* Header Toolbar */}
      <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/60 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Faculty Roster</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Total Teachers Enrolled: <span className="font-bold text-slate-800">{teachers.length}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs">
            <Upload size={15} /> Upload Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setUploadFile(file);
                  setShowPreview(true);
                }
                e.target.value = null;
              }}
              className="hidden"
            />
          </label>

          <div className="w-full md:w-60">
            <FormInput
              placeholder="Search faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={15} />}
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)} icon={<Plus size={16} />}>Add Teacher</Button>
        </div>
      </div>

      <ExcelFormatGuide type="teacher" />

      {/* Danger Zone */}
      <div className="mb-8 rounded-xl border border-rose-200/80 bg-rose-50/50 p-5">
        <h3 className="mb-2 text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle size={15} className="text-rose-600" /> Danger Zone
        </h3>
        <button
          type="button"
          onClick={async () => {
            if (teachers.length === 0) return;
            const confirm = window.confirm(`Delete all ${teachers.length} teachers? This CANNOT be undone!`);
            if (!confirm) return;
            const secondConfirm = window.prompt('Type "DELETE ALL" to confirm:');
            if (secondConfirm !== "DELETE ALL") return;
            try {
              setCreateLoading(true);
              const res = await deleteAllTeachers();
              setCreateSuccess(res.message || "All teachers deleted");
              await fetchTeachers();
            } catch (err) {
              setCreateError(err.message || "Failed to delete teachers");
            } finally {
              setCreateLoading(false);
            }
          }}
          disabled={teachers.length === 0 || createLoading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-2xs disabled:opacity-50"
        >
          Delete All Teachers ({teachers.length})
        </button>
      </div>

      {/* Teachers Table */}
      <div className="mb-10 bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
        <div className="mb-4 flex items-center gap-2">
          <Users size={18} className="text-blue-600" />
          <h4 className="text-sm font-bold text-slate-900">Faculty Members</h4>
        </div>
        <Table
          columns={[
            {
              header: "Name",
              accessor: "userId",
              render: (val) => <span className="font-bold text-slate-900">{val?.name || "-"}</span>,
            },
            {
              header: "Email",
              accessor: "userId",
              render: (val) => <span className="text-xs text-slate-500 font-medium">{val?.email || "-"}</span>,
            },
            {
              header: "Department",
              accessor: "department",
              render: (val) => (val ? <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">{val.name} ({val.code})</span> : "-"),
            },
            { 
              header: "Designation", 
              accessor: "designation",
              render: (val) => <span className="text-xs text-slate-600 font-semibold">{val || "-"}</span>
            },
          ]}
          data={teachers.filter(
            (t) =>
              (t.userId?.name?.toLowerCase() || "").includes(
                searchTerm.toLowerCase(),
              ) ||
              (t.userId?.email?.toLowerCase() || "").includes(
                searchTerm.toLowerCase(),
              ),
          )}
          emptyMessage={
            loadingTeachers ? "Loading teachers..." : "No teacher records found"
          }
          actions={(row) => (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openEditModal(row);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteTeacher(row);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        />
      </div>

      {/* Create Teacher Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Faculty Member"
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
        <form onSubmit={handleCreateTeacher} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Full Name"
              name="modalName"
              placeholder="Dr. John Doe"
              value={tName}
              onChange={(e) => setTName(e.target.value)}
              required
            />
            <FormInput
              label="Email Address"
              name="modalEmail"
              type="email"
              placeholder="john@college.edu"
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
                ...branches.map((b) => ({
                  label: `${b.name} (${b.code})`,
                  value: b._id,
                })),
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
        title="Edit Teacher Record"
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
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Full Name"
                name="editName"
                value={editingTeacher.name}
                onChange={(e) =>
                  setEditingTeacher({ ...editingTeacher, name: e.target.value })
                }
                required
              />
              <FormInput
                label="Email Address"
                name="editEmail"
                type="email"
                value={editingTeacher.email}
                onChange={(e) =>
                  setEditingTeacher({
                    ...editingTeacher,
                    email: e.target.value,
                  })
                }
                required
              />
              <FormSelect
                label="Department"
                name="editDepartment"
                value={editingTeacher.department}
                onChange={(e) =>
                  setEditingTeacher({
                    ...editingTeacher,
                    department: e.target.value,
                  })
                }
                options={[
                  { label: "Select Department", value: "" },
                  ...branches.map((b) => ({
                    label: `${b.name} (${b.code})`,
                    value: b._id,
                  })),
                ]}
                required
              />
              <FormInput
                label="Designation"
                name="editDesignation"
                value={editingTeacher.designation}
                onChange={(e) =>
                  setEditingTeacher({
                    ...editingTeacher,
                    designation: e.target.value,
                  })
                }
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Teaching Assignment Modal */}
      <Modal
        isOpen={isEditAssignmentOpen}
        onClose={() => {
          setIsEditAssignmentOpen(false);
          setEditAssignmentError("");
        }}
        title="Edit Teaching Assignment"
      >
        {editAssignmentData && (
          <form onSubmit={handleUpdateAssignment} className="space-y-4">
            {editAssignmentError && <Alert type="error" message={editAssignmentError} />}

            <FormSelect
              label="Teacher"
              name="teacherId"
              value={editAssignmentData.teacherId}
              onChange={(e) =>
                setEditAssignmentData((prev) => ({
                  ...prev,
                  teacherId: e.target.value,
                }))
              }
              options={[
                { value: "", label: "Select teacher" },
                ...teachers.map((t) => ({
                  value: t.userId?._id || t.userId,
                  label: `${t.userId?.name || "Unknown"} (${t.department?.code || "N/A"})`,
                })),
              ]}
              required
            />

            <div className="grid grid-cols-3 gap-3">
              <FormSelect
                label="Branch"
                name="branchId"
                value={editAssignmentData.branchId}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({
                    ...prev,
                    branchId: e.target.value,
                    subjectId: "",
                    batchId: "",
                  }))
                }
                options={[
                  { value: "", label: "Branch" },
                  ...branches.map((b) => ({ value: b._id, label: b.code })),
                ]}
                required
              />

              <FormSelect
                label="Year"
                name="year"
                value={editAssignmentData.year}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({
                    ...prev,
                    year: Number(e.target.value),
                    batchId: "",
                  }))
                }
                options={[
                  { value: "", label: "Year" },
                  ...YEAR_OPTIONS.map((y) => ({ value: y, label: `Year ${y}` })),
                ]}
                required
              />

              <FormSelect
                label="Division"
                name="division"
                value={editAssignmentData.division}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({
                    ...prev,
                    division: e.target.value,
                    batchId: "",
                  }))
                }
                options={[
                  { value: "", label: "Div" },
                  ...DIVISION_OPTIONS.map((d) => ({ value: d, label: `Div ${d}` })),
                ]}
                required
              />
            </div>

            <FormSelect
              label="Subject"
              name="subjectId"
              value={editAssignmentData.subjectId}
              onChange={(e) =>
                setEditAssignmentData((prev) => ({
                  ...prev,
                  subjectId: e.target.value,
                }))
              }
              options={[
                { value: "", label: "Select subject" },
                ...editSubjects.map((s) => ({
                  value: s._id,
                  label: `${s.name} (${s.code})`,
                })),
              ]}
              required
            />

            <FormSelect
              label="Session Type"
              name="sessionType"
              value={editAssignmentData.sessionType}
              onChange={(e) =>
                setEditAssignmentData((prev) => ({
                  ...prev,
                  sessionType: e.target.value,
                  batchId: e.target.value === "LECTURE" ? "" : prev.batchId,
                }))
              }
              options={SESSION_TYPES.map((st) => ({ value: st, label: st }))}
              required
            />

            {editAssignmentData.sessionType === "PRACTICAL" && (
              <FormSelect
                label="Batch"
                name="batchId"
                value={editAssignmentData.batchId}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({
                    ...prev,
                    batchId: e.target.value,
                  }))
                }
                options={[
                  {
                    value: "",
                    label: editBatches.length === 0 ? "No batches created for this class yet" : "Select batch",
                  },
                  ...editBatches.map((b) => ({
                    value: b._id,
                    label: `${b.displayName || b.name}${b.isMerged ? " (MERGED)" : ""}`,
                  })),
                ]}
                required
              />
            )}

            <div className="grid grid-cols-3 gap-3">
              <FormSelect
                label="Day"
                name="dayOfWeek"
                value={editAssignmentData.dayOfWeek}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({
                    ...prev,
                    dayOfWeek: e.target.value,
                  }))
                }
                options={DAY_OPTIONS.map((d) => ({ value: d, label: d }))}
                required
              />
              <FormInput
                label="Start Time"
                name="startTime"
                type="time"
                value={editAssignmentData.startTime}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                required
              />
              <FormInput
                label="End Time"
                name="endTime"
                type="time"
                value={editAssignmentData.endTime}
                onChange={(e) =>
                  setEditAssignmentData((prev) => ({
                    ...prev,
                    endTime: e.target.value,
                  }))
                }
                required
              />
            </div>

            <FormInput
              label="Academic Year"
              name="academicYear"
              type="text"
              placeholder="2025-2026"
              value={editAssignmentData.academicYear}
              onChange={(e) =>
                setEditAssignmentData((prev) => ({
                  ...prev,
                  academicYear: e.target.value,
                }))
              }
              required
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditAssignmentOpen(false);
                  setEditAssignmentError("");
                }}
                disabled={editAssignmentLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={editAssignmentLoading}
                disabled={editAssignmentLoading}
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Timetable Section */}
      <div className="mt-8 bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
        <div className="mb-6 flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          <div>
            <h4 className="text-base font-bold text-slate-900">Timetable Schedules</h4>
            <p className="text-xs text-slate-500 font-medium">Create and inspect faculty course assignments</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-4">
          <button
            onClick={() => {
              setActiveTab("timetable");
              setTtError("");
              setTtSuccess("");
            }}
            className={`pb-2.5 text-xs font-bold transition-colors border-b-2 ${
              activeTab === "timetable"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Create Assignment
          </button>
          <button
            onClick={() => setActiveTab("view")}
            className={`pb-2.5 text-xs font-bold transition-colors border-b-2 ${
              activeTab === "view"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            View All ({Array.isArray(assignments) ? assignments.length : 0})
          </button>
        </div>

        {activeTab === "timetable" && (
          <div className="space-y-4 max-w-xl">
            <div className="rounded-lg border border-blue-200/80 bg-blue-50/50 p-3.5 flex gap-2 text-xs text-blue-900 font-medium">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <p>Fill out all fields to configure a timetable slot. Duplicate slots are checked automatically.</p>
            </div>

            {ttDuplicateWarning && <Alert type="warning" message={ttDuplicateWarning} />}
            {ttError && <Alert type="error" message={ttError} />}
            {ttSuccess && <Alert type="success" message={ttSuccess} />}

            <form onSubmit={handleTtSubmit} className="space-y-4">
              <FormSelect
                label="Teacher"
                name="teacherId"
                value={ttFormData.teacherId}
                onChange={handleTtChange}
                error={ttValidationErrors.teacherId}
                options={[
                  { value: "", label: "Select teacher" },
                  ...teachers.map((t) => ({
                    value: t.userId?._id || t._id,
                    label: `${t.userId?.name || "Unknown"} (${t.userId?.email || ""})`,
                  })),
                ]}
                required
              />

              <FormSelect
                label="Branch"
                name="branchId"
                value={ttFormData.branchId}
                onChange={handleTtChange}
                error={ttValidationErrors.branchId}
                options={[
                  { value: "", label: "Select branch" },
                  ...branches.map((b) => ({
                    value: b._id,
                    label: `${b.name} (${b.code})`,
                  })),
                ]}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <FormSelect
                  label="Semester"
                  name="semester"
                  value={ttFormData.semester}
                  onChange={handleTtChange}
                  error={ttValidationErrors.semester}
                  options={[
                    { value: "", label: "Select semester" },
                    ...Array.from({ length: 8 }, (_, i) => ({ value: i + 1, label: `Sem ${i + 1}` })),
                  ]}
                  required
                />

                <FormSelect
                  label="Subject"
                  name="subjectId"
                  value={ttFormData.subjectId}
                  onChange={handleTtChange}
                  error={ttValidationErrors.subjectId}
                  options={[
                    { value: "", label: "Select subject" },
                    ...subjects.map((s) => ({
                      value: s._id,
                      label: `${s.name} (${s.code})`,
                    })),
                  ]}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormSelect
                  label="Division"
                  name="division"
                  value={ttFormData.division}
                  onChange={handleTtChange}
                  error={ttValidationErrors.division}
                  options={[
                    { value: "", label: "Select division" },
                    ...DIVISION_OPTIONS.map((d) => ({ value: d, label: d })),
                  ]}
                  required
                />

                <FormSelect
                  label="Session Type"
                  name="sessionType"
                  value={ttFormData.sessionType}
                  onChange={handleTtChange}
                  error={ttValidationErrors.sessionType}
                  options={SESSION_TYPES.map((s) => ({ value: s, label: s }))}
                  required
                />
              </div>

              {ttFormData.sessionType === "PRACTICAL" && (
                <FormSelect
                  label="Batch"
                  name="batchId"
                  value={ttFormData.batchId}
                  onChange={handleTtChange}
                  error={ttValidationErrors.batchId}
                  options={[
                    {
                      value: "",
                      label: batches.length === 0 ? "No batches created for this class yet" : "Select batch"
                    },
                    ...batches.map((b) => ({
                      value: b._id,
                      label: `${b.displayName || b.name}${b.isMerged ? " (MERGED)" : ""}`
                    })),
                  ]}
                  required
                />
              )}

              <div className="grid grid-cols-3 gap-3">
                <FormSelect
                  label="Day"
                  name="dayOfWeek"
                  value={ttFormData.dayOfWeek}
                  onChange={handleTtChange}
                  error={ttValidationErrors.dayOfWeek}
                  options={DAY_OPTIONS.map((d) => ({ value: d, label: d }))}
                  required
                />
                <FormInput
                  label="Start Time"
                  name="startTime"
                  type="time"
                  value={ttFormData.startTime}
                  onChange={handleTtChange}
                  error={ttValidationErrors.startTime}
                  required
                />
                <FormInput
                  label="End Time"
                  name="endTime"
                  type="time"
                  value={ttFormData.endTime}
                  onChange={handleTtChange}
                  error={ttValidationErrors.endTime}
                  required
                />
              </div>

              <FormInput
                label="Academic Year"
                name="academicYear"
                type="text"
                placeholder="2025-2026"
                value={ttFormData.academicYear}
                onChange={handleTtChange}
                error={ttValidationErrors.academicYear}
                required
              />

              <Button
                type="submit"
                loading={ttSubmitting}
                disabled={ttSubmitting || !!ttDuplicateWarning}
                fullWidth
              >
                Create Assignment
              </Button>
            </form>
          </div>
        )}

        {activeTab === "view" && (
          <div>
            <div className="flex items-center justify-between p-3.5 mb-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-semibold text-slate-700">
              <span>Total Active Timetable Assignments: <strong>{assignments.length}</strong></span>
              <button
                onClick={fetchAssignments}
                disabled={loadingAssignments}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <RefreshCw size={13} /> Reload
              </button>
            </div>

            {loadingAssignments ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : !Array.isArray(assignments) || assignments.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Clock size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-500">No timetable assignments configured yet.</p>
              </div>
            ) : (
              <TimetableView 
                assignments={assignments}
                onView={handleShowDetails}
                onEdit={handleEditAssignment}
                onDelete={handleDeleteAssignment}
                deleteLoading={deleteAssignmentLoading}
              />
            )}
          </div>
        )}
      </div>

      <UploadResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        result={uploadResult}
        type="teacher"
      />

      {showPreview && uploadFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-6xl">
            <DataPreviewTable
              file={uploadFile}
              type="teacher"
              onCancel={() => {
                setShowPreview(false);
                setUploadFile(null);
              }}
              onConfirm={async () => {
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
