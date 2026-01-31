import { useEffect, useState } from "react";
import { theme } from "../styles/theme";
import DashboardLayout from "../components/DashboardLayout";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Alert from "../components/Alert";
import Table from "../components/Table";
import Modal from "../components/Modal";
import {
  getBranches,
  getSubjects,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  assignTeacher,
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
  const [lastCreatedTeacherId, setLastCreatedTeacherId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Edit Teacher state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit Assignment state
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [savingAssignmentEdit, setSavingAssignmentEdit] = useState(false);
  const [editAssignmentSubjects, setEditAssignmentSubjects] = useState([]);

  // Assign Teacher state
  const [aTeacherId, setATeacherId] = useState("");
  const [aBranch, setABranch] = useState("");
  const [aSemester, setASemester] = useState("");
  const [aSubject, setASubject] = useState("");
  const [aYear, setAYear] = useState("");
  const [aDivision, setADivision] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignError, setAssignError] = useState("");

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
      if (data.length && !aTeacherId) {
        setATeacherId(data[0]._id);
      }
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
      setAssignments(data);
    } catch (err) {
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
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

  useEffect(() => {
    // Refetch when search changes
    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Fetch subjects when branch or semester changes
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!aBranch || !aSemester) {
        setSubjects([]);
        setASubject("");
        return;
      }
      try {
        const data = await getSubjects(aBranch, aSemester);
        setSubjects(data);
      } catch (err) {
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, [aBranch, aSemester]);

  // Fetch subjects for editing assignment
  useEffect(() => {
    const fetchEditSubjects = async () => {
      if (!editingAssignment?.branch || !editingAssignment?.semester) {
        setEditAssignmentSubjects([]);
        return;
      }
      try {
        const data = await getSubjects(editingAssignment.branch, editingAssignment.semester);
        setEditAssignmentSubjects(data);
      } catch (err) {
        setEditAssignmentSubjects([]);
      }
    };
    fetchEditSubjects();
  }, [editingAssignment?.branch, editingAssignment?.semester]);

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
      setLastCreatedTeacherId(res.teacher?._id || "");

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

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!aTeacherId || !aBranch || !aSemester || !aSubject || !aYear || !aDivision) {
      setAssignError("All fields are required");
      return;
    }
    
    try {
      setAssignLoading(true);
      setAssignError("");
      setAssignSuccess("");

      const payload = {
        teacher: aTeacherId,
        subject: aSubject,
        branch: aBranch,
        year: Number(aYear),
        division: aDivision,
      };

      const res = await assignTeacher(payload);
      setAssignSuccess(res.message || "Teacher assigned successfully");

      await fetchAssignments();

      // reset minimal
      setASubject("");
      setAYear("");
      setADivision("");
    } catch (err) {
      setAssignError(err.message || "Failed to assign teacher");
    } finally {
      setAssignLoading(false);
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

  const openEditAssignmentModal = async (assignment) => {
    setEditingAssignment({
      id: assignment._id,
      teacher: assignment.teacher?._id || "",
      branch: assignment.branch?._id || "",
      semester: Math.ceil((assignment.year * 2) - 1),
      subject: assignment.subject?._id || "",
      year: assignment.year,
      division: assignment.division,
    });
    setIsEditAssignmentOpen(true);
    
    if (assignment.branch?._id) {
      const semester = Math.ceil((assignment.year * 2) - 1);
      try {
        const data = await getSubjects(assignment.branch._id, semester);
        setEditAssignmentSubjects(data);
      } catch (err) {
        setEditAssignmentSubjects([]);
      }
    }
  };

  const handleEditAssignmentSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!editingAssignment) return;
    try {
      setSavingAssignmentEdit(true);
      setAssignError("");
      setAssignSuccess("");

      const payload = {
        teacher: editingAssignment.teacher,
        subject: editingAssignment.subject,
        branch: editingAssignment.branch,
        year: Number(editingAssignment.year),
        division: editingAssignment.division,
      };

      await updateTeachingAssignment(editingAssignment.id, payload);
      setAssignSuccess("Assignment updated successfully");
      setIsEditAssignmentOpen(false);
      setEditingAssignment(null);
      await fetchAssignments();
    } catch (err) {
      setAssignError(err.message || "Failed to update assignment");
    } finally {
      setSavingAssignmentEdit(false);
    }
  };

  const handleDeleteAssignment = async (assignment) => {
    const ok = window.confirm(`Delete assignment for ${assignment.teacher?.userId?.name || "this teacher"}? This cannot be undone.`);
    if (!ok) return;
    try {
      setAssignError("");
      setAssignSuccess("");
      await deleteTeachingAssignment(assignment._id);
      setAssignSuccess("Assignment deleted successfully");
      await fetchAssignments();
    } catch (err) {
      setAssignError(err.message || "Failed to delete assignment");
    }
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
      subtitle="Create teachers and assign them to classes"
      sidebarItems={sidebarItems}
    >
      {/* Alerts */}
      <div className="mb-4 space-y-2">
        {createError && (
          <Alert message={createError} type="error" onClose={() => setCreateError("")} />
        )}
        {createSuccess && (
          <Alert message={createSuccess} type="success" onClose={() => setCreateSuccess("")} />
        )}
        {assignError && (
          <Alert message={assignError} type="error" onClose={() => setAssignError("")} />
        )}
        {assignSuccess && (
          <Alert message={assignSuccess} type="success" onClose={() => setAssignSuccess("")} />
        )}
      </div>

      {/* Top action bar */}
      <div
        className="mb-8 flex flex-col items-start justify-between gap-4 rounded-xl border p-6 md:flex-row md:items-center"
        style={{
          borderColor: theme.colors.primary[100],
          backgroundColor: theme.colors.primary[50],
          boxShadow: theme.shadows.md,
        }}
      >
        <div>
          <h2 className="text-lg font-bold" style={{ color: theme.colors.primary[600] }}>
            👨‍🏫 Manage Teachers
          </h2>
          <p className="mt-1 text-sm" style={{ color: theme.colors.text.secondary }}>
            Create, search, and assign teachers to classes
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <div className="w-full max-w-xs">
            <FormInput
              label=""
              name="search"
              placeholder="🔍 Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>+ Add Teacher</Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Assign Teacher Card */}
        <section
          className="rounded-xl border p-8"
          style={{
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.background,
            boxShadow: theme.shadows.md,
          }}
        >
          <div className="mb-8 flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <h3 className="text-xl font-bold" style={{ color: theme.colors.text.primary }}>
                Assign to Class
              </h3>
              <p className="text-xs" style={{ color: theme.colors.text.secondary }}>
                Link teachers to subjects and classes
              </p>
            </div>
          </div>

          <form onSubmit={handleAssignTeacher} className="space-y-6">
            {/* Teacher Selection */}
            <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: theme.colors.text.primary }}>
                <span>👨‍🏫</span> Select Teacher
              </label>
              <FormSelect
                label=""
                name="aTeacherId"
                value={aTeacherId}
                onChange={(e) => setATeacherId(e.target.value)}
                options={[
                  { label: loadingTeachers ? "Loading..." : "Choose a teacher", value: "" },
                  ...teachers.map((t) => ({
                    label: `${t.userId?.name || "Unnamed"} • ${t.userId?.email || "no email"}`,
                    value: t._id,
                  })),
                ]}
                required
              />
            </div>

            {/* Branch & Semester Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.neutral[50] }}>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: theme.colors.text.primary }}>
                  <span>🌿</span> Branch
                </label>
                <FormSelect
                  label=""
                  name="aBranch"
                  value={aBranch}
                  onChange={(e) => setABranch(e.target.value)}
                  options={[{ label: "Select Branch", value: "" }, ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id }))]}
                  required
                />
              </div>

              <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.neutral[50] }}>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: theme.colors.text.primary }}>
                  <span>📅</span> Semester
                </label>
                <FormSelect
                  label=""
                  name="aSemester"
                  value={aSemester}
                  onChange={(e) => setASemester(e.target.value)}
                  options={[
                    { label: "Select Semester", value: "" },
                    { label: "1", value: 1 },
                    { label: "2", value: 2 },
                    { label: "3", value: 3 },
                    { label: "4", value: 4 },
                    { label: "5", value: 5 },
                    { label: "6", value: 6 },
                    { label: "7", value: 7 },
                    { label: "8", value: 8 },
                  ]}
                  required
                />
              </div>
            </div>

            {/* Subject Selection */}
            <div className="rounded-lg p-4" style={{ backgroundColor: "#f0fdf4" }}>
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: theme.colors.text.primary }}>
                <span>📚</span> Subject
              </label>
              <FormSelect
                label=""
                name="aSubject"
                value={aSubject}
                onChange={(e) => setASubject(e.target.value)}
                options={[{ label: "Select Subject", value: "" }, ...subjects.map((s) => ({ label: `${s.name} (${s.code})`, value: s._id }))]}
                required
              />
            </div>

            {/* Year & Division Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.neutral[50] }}>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: theme.colors.text.primary }}>
                  <span>🎓</span> Year
                </label>
                <FormSelect
                  label=""
                  name="aYear"
                  value={aYear}
                  onChange={(e) => setAYear(e.target.value)}
                  options={[
                    { label: "Select Year", value: "" },
                    { label: "FE (1st Year)", value: 1 },
                    { label: "SE (2nd Year)", value: 2 },
                    { label: "TE (3rd Year)", value: 3 },
                    { label: "BE (4th Year)", value: 4 },
                  ]}
                  required
                />
              </div>

              <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.neutral[50] }}>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: theme.colors.text.primary }}>
                  <span>🏷️</span> Division
                </label>
                <FormSelect
                  label=""
                  name="aDivision"
                  value={aDivision}
                  onChange={(e) => setADivision(e.target.value)}
                  options={[
                    { label: "Select Division", value: "" },
                    { label: "A", value: "A" },
                    { label: "B", value: "B" },
                    { label: "C", value: "C" },
                  ]}
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-3">
              <Button
                type="submit"
                disabled={assignLoading}
                style={{ width: "100%" }}
              >
                {assignLoading ? "Assigning..." : "✨ Assign Teacher"}
              </Button>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border-l-4 p-4" style={{ borderColor: theme.colors.info, backgroundColor: "#f0f9ff" }}>
              <p className="flex items-start gap-2 text-xs" style={{ color: theme.colors.text.secondary }}>
                <span className="mt-0.5">ℹ️</span>
                <span><strong>Tip:</strong> Subject options are automatically filtered based on your Branch and Semester selection.</span>
              </p>
            </div>
          </form>
        </section>
      </div>

      {/* Teachers Table Section */}
      <div className="mt-10">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-2xl">👥</span>
          <div>
            <h4 className="text-xl font-bold" style={{ color: theme.colors.text.primary }}>
              All Teachers
            </h4>
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              Manage and track all teachers in the system
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
          data={teachers}
          emptyMessage={loadingTeachers ? "Loading teachers..." : "No teachers found"}
          actions={(row) => (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openEditModal(row)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => handleDeleteTeacher(row)}>
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

      {/* Edit Assignment Modal */}
      <Modal
        isOpen={isEditAssignmentOpen}
        onClose={() => setIsEditAssignmentOpen(false)}
        title="✏️ Edit Teaching Assignment"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditAssignmentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAssignmentSubmit} disabled={savingAssignmentEdit}>
              {savingAssignmentEdit ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        {editingAssignment && (
          <form onSubmit={handleEditAssignmentSubmit}>
            <FormSelect
              label="Teacher"
              name="editAssignmentTeacher"
              value={editingAssignment.teacher}
              onChange={(e) => setEditingAssignment({ ...editingAssignment, teacher: e.target.value })}
              options={[
                { label: loadingTeachers ? "Loading..." : "Select Teacher", value: "" },
                ...teachers.map((t) => ({
                  label: `${t.userId?.name || "Unnamed"} (${t.userId?.email || "no email"})`,
                  value: t._id,
                })),
              ]}
              required
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Branch"
                name="editAssignmentBranch"
                value={editingAssignment.branch}
                onChange={(e) => {
                  setEditingAssignment({ ...editingAssignment, branch: e.target.value, subject: "" });
                }}
                options={[
                  { label: "Select Branch", value: "" },
                  ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id })),
                ]}
                required
              />
              <FormSelect
                label="Semester"
                name="editAssignmentSemester"
                value={editingAssignment.semester}
                onChange={(e) => {
                  setEditingAssignment({ ...editingAssignment, semester: e.target.value, subject: "" });
                }}
                options={[
                  { label: "Select Semester", value: "" },
                  { label: "1", value: 1 },
                  { label: "2", value: 2 },
                  { label: "3", value: 3 },
                  { label: "4", value: 4 },
                  { label: "5", value: 5 },
                  { label: "6", value: 6 },
                  { label: "7", value: 7 },
                  { label: "8", value: 8 },
                ]}
                required
              />
            </div>

            <FormSelect
              label="Subject"
              name="editAssignmentSubject"
              value={editingAssignment.subject}
              onChange={(e) => setEditingAssignment({ ...editingAssignment, subject: e.target.value })}
              options={[
                { label: "Select Subject", value: "" },
                ...editAssignmentSubjects.map((s) => ({ label: `${s.name} (${s.code})`, value: s._id })),
              ]}
              required
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Year"
                name="editAssignmentYear"
                value={editingAssignment.year}
                onChange={(e) => setEditingAssignment({ ...editingAssignment, year: e.target.value })}
                options={[
                  { label: "Select Year", value: "" },
                  { label: "FE (1)", value: 1 },
                  { label: "SE (2)", value: 2 },
                  { label: "TE (3)", value: 3 },
                  { label: "BE (4)", value: 4 },
                ]}
                required
              />
              <FormSelect
                label="Division"
                name="editAssignmentDivision"
                value={editingAssignment.division}
                onChange={(e) => setEditingAssignment({ ...editingAssignment, division: e.target.value })}
                options={[
                  { label: "Select Division", value: "" },
                  { label: "A", value: "A" },
                  { label: "B", value: "B" },
                  { label: "C", value: "C" },
                ]}
                required
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Teaching Assignments Table */}
      <div className="mt-8">
        <h4 className="mb-3 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
          Teaching Assignments
        </h4>
        <Table
          columns={[
            { header: "Teacher", accessor: "teacher", render: (val) => val?.userId?.name || "-" },
            { header: "Subject", accessor: "subject", render: (val) => (val ? `${val.name} (${val.code})` : "-") },
            { header: "Branch", accessor: "branch", render: (val) => (val ? `${val.name} (${val.code})` : "-") },
            { header: "Year", accessor: "year" },
            { header: "Division", accessor: "division" },
          ]}
          data={assignments}
          emptyMessage={loadingAssignments ? "Loading assignments..." : "No assignments found"}
          actions={(assignment) => (
            <>
              <Button variant="outline" onClick={() => openEditAssignmentModal(assignment)}>
                Edit
              </Button>
              <Button variant="outline" onClick={() => handleDeleteAssignment(assignment)}>
                Delete
              </Button>
            </>
          )}
        />
      </div>
    </DashboardLayout>
  );
}
