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
  getAssignments,
  updateAssignment,
  deleteAssignment,
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
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

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

  // Edit Assignment state
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editAssignTeacherId, setEditAssignTeacherId] = useState("");
  const [editAssignBranch, setEditAssignBranch] = useState("");
  const [editAssignSemester, setEditAssignSemester] = useState("");
  const [editAssignSubject, setEditAssignSubject] = useState("");
  const [editAssignYear, setEditAssignYear] = useState("");
  const [editAssignDivision, setEditAssignDivision] = useState("");
  const [editAssignSubjects, setEditAssignSubjects] = useState([]);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [editAssignError, setEditAssignError] = useState("");
  const [editAssignSuccess, setEditAssignSuccess] = useState("");

  const sidebarItems = [
    { label: "Dashboard", path: "/admin", icon: "🏠" },
    { label: "Branches", path: "/admin/branches", icon: "🌿" },
    { label: "Subjects", path: "/admin/subjects", icon: "📘" },
    { label: "Students", path: "/admin/students", icon: "🎓" },
    { label: "Teachers", path: "/admin/teachers", icon: "👩‍🏫" },
    { label: "Reports", path: "/admin/defaulters", icon: "📊" },
  ];

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
      const data = await getAssignments();
      setAssignments(data);
    } catch (err) {
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

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

  // Fetch subjects for edit assignment when branch or semester changes
  useEffect(() => {
    const fetchEditSubjects = async () => {
      if (!editAssignBranch || !editAssignSemester) {
        setEditAssignSubjects([]);
        return;
      }
      try {
        const data = await getSubjects(editAssignBranch, editAssignSemester);
        setEditAssignSubjects(data);
      } catch (err) {
        setEditAssignSubjects([]);
      }
    };
    fetchEditSubjects();
  }, [editAssignBranch, editAssignSemester]);

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

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setEditAssignTeacherId(assignment.teacher?._id || "");
    setEditAssignBranch(assignment.branch?._id || "");
    setEditAssignSemester(assignment.subject?.semester || "");
    setEditAssignSubject(assignment.subject?._id || "");
    setEditAssignYear(assignment.year?.toString() || "");
    setEditAssignDivision(assignment.division || "");
    setEditAssignError("");
    setEditAssignSuccess("");
    setIsEditAssignmentOpen(true);
  };

  const handleEditAssignmentSubmit = async (e) => {
    e.preventDefault();
    
    if (!editAssignTeacherId || !editAssignBranch || !editAssignSubject || !editAssignYear || !editAssignDivision) {
      setEditAssignError("All fields are required");
      return;
    }
    
    try {
      setSavingAssignment(true);
      setEditAssignError("");
      setEditAssignSuccess("");

      const payload = {
        teacher: editAssignTeacherId,
        subject: editAssignSubject,
        branch: editAssignBranch,
        year: Number(editAssignYear),
        division: editAssignDivision,
      };

      const res = await updateAssignment(editingAssignment._id, payload);
      setEditAssignSuccess(res.message || "Assignment updated successfully");

      await fetchAssignments();

      setTimeout(() => {
        setIsEditAssignmentOpen(false);
      }, 1500);
    } catch (err) {
      setEditAssignError(err.message || "Failed to update assignment");
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignment) => {
    const teacherName = assignment.teacher?.userId?.name || "Unknown";
    const subjectName = assignment.subject?.name || "Unknown";
    const confirmed = window.confirm(
      `Are you sure you want to delete the assignment:\n${teacherName} - ${subjectName} (${assignment.branch?.name} Year ${assignment.year} Div ${assignment.division})?`
    );
    
    if (!confirmed) return;

    try {
      await deleteAssignment(assignment._id);
      await fetchAssignments();
      setAssignSuccess("Assignment deleted successfully");
      setTimeout(() => setAssignSuccess(""), 3000);
    } catch (err) {
      setAssignError(err.message || "Failed to delete assignment");
      setTimeout(() => setAssignError(""), 3000);
    }
  };

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setEditName(teacher.userId?.name || "");
    setEditEmail(teacher.userId?.email || "");
    setEditDepartment(teacher.department || "");
    setEditDesignation(teacher.designation || "");
    setEditError("");
    setEditSuccess("");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTeacher) return;

    try {
      setSavingEdit(true);
      setEditError("");
      setEditSuccess("");

      const payload = {
        name: editName.trim(),
        email: editEmail.trim(),
        department: editDepartment,
        designation: editDesignation,
      };

      const res = await updateTeacher(editingTeacher._id, payload);
      setEditSuccess(res.message || "Teacher updated successfully");

      await fetchTeachers();
      setTimeout(() => {
        setIsEditOpen(false);
        setEditingTeacher(null);
      }, 1000);
    } catch (err) {
      setEditError(err.message || "Failed to update teacher");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteTeacher = async (teacher) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${teacher.user?.name}? This will also remove their teaching assignments.`);
    if (!confirmed) return;

    try {
      await deleteTeacher(teacher._id);
      await Promise.all([fetchTeachers(), fetchAssignments()]);
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
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
        {editError && (
          <Alert message={editError} type="error" onClose={() => setEditError("")} />
        )}
        {editSuccess && (
          <Alert message={editSuccess} type="success" onClose={() => setEditSuccess("")} />
        )}
      </div>

      {/* Teachers Table Section */}
      <section className="mb-8 rounded-lg border p-6" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
        <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
            👩‍🏫 All Teachers
          </h3>
          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Search by name, email, or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
                color: theme.colors.text.primary,
              }}
            />
          </div>
        </div>

        {loadingTeachers ? (
          <p style={{ color: theme.colors.text.secondary }}>Loading teachers...</p>
        ) : teachers.length === 0 ? (
          <p style={{ color: theme.colors.text.secondary }}>No teachers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                  <th className="px-4 py-2 text-left font-semibold" style={{ color: theme.colors.text.primary }}>Name</th>
                  <th className="px-4 py-2 text-left font-semibold" style={{ color: theme.colors.text.primary }}>Email</th>
                  <th className="px-4 py-2 text-left font-semibold" style={{ color: theme.colors.text.primary }}>Department</th>
                  <th className="px-4 py-2 text-left font-semibold" style={{ color: theme.colors.text.primary }}>Designation</th>
                  <th className="px-4 py-2 text-left font-semibold" style={{ color: theme.colors.text.primary }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher._id} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                    <td className="px-4 py-3" style={{ color: theme.colors.text.primary }}>{teacher.userId?.name || "N/A"}</td>
                    <td className="px-4 py-3" style={{ color: theme.colors.text.secondary }}>{teacher.userId?.email || "N/A"}</td>
                    <td className="px-4 py-3" style={{ color: theme.colors.text.primary }}>
                      {typeof teacher.department === 'object' ? teacher.department?.name || "N/A" : teacher.department || "N/A"}
                    </td>
                    <td className="px-4 py-3" style={{ color: theme.colors.text.primary }}>{teacher.designation || "N/A"}</td>
                    <td className="flex gap-2 px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(teacher)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteTeacher(teacher)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Assignments Table */}
      <section className="mb-8 rounded-lg border p-6" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
            📚 Teaching Assignments
          </h3>
        </div>

        {loadingAssignments ? (
          <p style={{ color: theme.colors.text.secondary }}>Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <p style={{ color: theme.colors.text.secondary }}>No assignments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                  <th className="px-4 py-2 text-left font-semibold" style={{ color: theme.colors.text.primary }}>Teacher</th>
                  <th className="px-4 py-2 text-left font-semibold" style={{ color: theme.colors.text.primary }}>Subject</th>
                  <th className="px-4 py-2 text-left font-semibold" style={{ color: theme.colors.text.primary }}>Branch</th>
                  <th className="px-4 py-2 text-left font-semibold" style={{ color: theme.colors.text.primary }}>Year</th>
                  <th className="px-4 py-2 text-left font-semibold" style={{ color: theme.colors.text.primary }}>Division</th>
                  <th className="px-4 py-2 text-left font-semibold" style={{ color: theme.colors.text.primary }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((item) => (
                  <tr key={item._id} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                    <td className="px-4 py-3" style={{ color: theme.colors.text.primary }}>
                      {item.teacher?.userId?.name || "N/A"}
                      <div className="text-xs" style={{ color: theme.colors.text.secondary }}>
                        {item.teacher?.userId?.email || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: theme.colors.text.primary }}>
                      {item.subject?.code ? `${item.subject.code} — ${item.subject.name}` : item.subject?.name || "N/A"}
                    </td>
                    <td className="px-4 py-3" style={{ color: theme.colors.text.primary }}>
                      {item.branch?.name || "N/A"}
                    </td>
                    <td className="px-4 py-3" style={{ color: theme.colors.text.primary }}>{item.year}</td>
                    <td className="px-4 py-3" style={{ color: theme.colors.text.primary }}>{item.division}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditAssignment(item)}
                          className="rounded px-3 py-1 text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: theme.colors.primary,
                            color: "white",
                          }}
                          onMouseEnter={(e) => (e.target.style.opacity = "0.8")}
                          onMouseLeave={(e) => (e.target.style.opacity = "1")}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(item)}
                          className="rounded px-3 py-1 text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: theme.colors.error,
                            color: "white",
                          }}
                          onMouseEnter={(e) => (e.target.style.opacity = "0.8")}
                          onMouseLeave={(e) => (e.target.style.opacity = "1")}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Create Teacher Card */}
        <section
          className="rounded-lg border p-6"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}
        >
          <h3 className="mb-4 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
            ✏️ Create Teacher
          </h3>

          <form onSubmit={handleCreateTeacher}>
            <FormInput label="Name" name="tName" value={tName} onChange={(e) => setTName(e.target.value)} required />
            <FormInput label="Email" name="tEmail" type="email" value={tEmail} onChange={(e) => setTEmail(e.target.value)} required />
            <FormInput label="Password" name="tPassword" type="password" value={tPassword} onChange={(e) => setTPassword(e.target.value)} required />
            <FormSelect
              label="Department"
              name="tDepartment"
              value={tDepartment}
              onChange={(e) => setTDepartment(e.target.value)}
              options={[{ label: "Select Department", value: "" }, ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id }))]}
              required
            />
            <FormInput label="Designation" name="tDesignation" value={tDesignation} onChange={(e) => setTDesignation(e.target.value)} />

            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={createLoading}>{createLoading ? "Creating..." : "Create"}</Button>
            </div>
          </form>

          {lastCreatedTeacherId && (
            <p className="mt-4 text-xs" style={{ color: theme.colors.text.secondary }}>
              Last created Teacher ID: <span style={{ color: theme.colors.text.primary }}>{lastCreatedTeacherId}</span>
            </p>
          )}
        </section>

        {/* Assign Teacher Card */}
        <section
          className="rounded-lg border p-6"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}
        >
          <h3 className="mb-4 text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
            🎓 Assign Teacher to Class
          </h3>

          <form onSubmit={handleAssignTeacher}>
            <FormSelect
              label="Teacher"
              name="aTeacherId"
              value={aTeacherId}
              onChange={(e) => setATeacherId(e.target.value)}
              options={[{ label: "Select Teacher", value: "" }, ...teachers.map((t) => ({ label: `${t.userId?.name} (${t.userId?.email})`, value: t._id }))]}
              required
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Branch"
                name="aBranch"
                value={aBranch}
                onChange={(e) => setABranch(e.target.value)}
                options={[{ label: "Select Branch", value: "" }, ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id }))]}
                required
              />
              <FormSelect
                label="Semester"
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

            <FormSelect
              label="Subject"
              name="aSubject"
              value={aSubject}
              onChange={(e) => setASubject(e.target.value)}
              options={[{ label: "Select Subject", value: "" }, ...subjects.map((s) => ({ label: `${s.name} (${s.code})`, value: s._id }))]}
              required
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Year"
                name="aYear"
                value={aYear}
                onChange={(e) => setAYear(e.target.value)}
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

            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={assignLoading}>{assignLoading ? "Assigning..." : "Assign"}</Button>
            </div>

            <p className="mt-3 text-xs" style={{ color: theme.colors.text.secondary }}>
              Note: Subject options are filtered by Branch + Semester.
            </p>
          </form>
        </section>
      </div>

      {/* Edit Teacher Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Teacher"
      >
        <div className="mb-4 space-y-2">
          {editError && <Alert message={editError} type="error" onClose={() => setEditError("")} />}
          {editSuccess && <Alert message={editSuccess} type="success" onClose={() => setEditSuccess("")} />}
        </div>

        <form onSubmit={handleEditSubmit}>
          <FormInput
            label="Name"
            name="editName"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <FormInput
            label="Email"
            name="editEmail"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            required
          />
          <FormSelect
            label="Department"
            name="editDepartment"
            value={editDepartment}
            onChange={(e) => setEditDepartment(e.target.value)}
            options={[{ label: "Select Department", value: "" }, ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id }))]}
            required
          />
          <FormInput
            label="Designation"
            name="editDesignation"
            value={editDesignation}
            onChange={(e) => setEditDesignation(e.target.value)}
          />

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={savingEdit}>
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal
        isOpen={isEditAssignmentOpen}
        onClose={() => setIsEditAssignmentOpen(false)}
        title="Edit Teaching Assignment"
      >
        <div className="mb-4 space-y-2">
          {editAssignError && <Alert message={editAssignError} type="error" onClose={() => setEditAssignError("")} />}
          {editAssignSuccess && <Alert message={editAssignSuccess} type="success" onClose={() => setEditAssignSuccess("")} />}
        </div>

        <form onSubmit={handleEditAssignmentSubmit}>
          <FormSelect
            label="Teacher"
            name="editAssignTeacherId"
            value={editAssignTeacherId}
            onChange={(e) => setEditAssignTeacherId(e.target.value)}
            options={[{ label: "Select Teacher", value: "" }, ...teachers.map((t) => ({ label: `${t.userId?.name} (${t.userId?.email})`, value: t._id }))]}
            required
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              label="Branch"
              name="editAssignBranch"
              value={editAssignBranch}
              onChange={(e) => setEditAssignBranch(e.target.value)}
              options={[{ label: "Select Branch", value: "" }, ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id }))]}
              required
            />
            <FormSelect
              label="Semester"
              name="editAssignSemester"
              value={editAssignSemester}
              onChange={(e) => setEditAssignSemester(e.target.value)}
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
            name="editAssignSubject"
            value={editAssignSubject}
            onChange={(e) => setEditAssignSubject(e.target.value)}
            options={[{ label: "Select Subject", value: "" }, ...editAssignSubjects.map((s) => ({ label: `${s.name} (${s.code})`, value: s._id }))]}
            required
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              label="Year"
              name="editAssignYear"
              value={editAssignYear}
              onChange={(e) => setEditAssignYear(e.target.value)}
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
              name="editAssignDivision"
              value={editAssignDivision}
              onChange={(e) => setEditAssignDivision(e.target.value)}
              options={[
                { label: "Select Division", value: "" },
                { label: "A", value: "A" },
                { label: "B", value: "B" },
                { label: "C", value: "C" },
              ]}
              required
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditAssignmentOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={savingAssignment}>
              {savingAssignment ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
