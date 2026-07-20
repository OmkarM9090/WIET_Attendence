import { useEffect, useState } from "react";
import { theme } from "../styles/theme";
import DashboardLayout from "../components/DashboardLayout";
import Table from "../components/Table";
import Modal from "../components/Modal";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Alert from "../components/Alert";
import UploadResultModal from "../components/UploadResultModal";
import axiosInstance from "../utils/axios";
import {
  getBranches,
  getStudents,
  createStudent,
  uploadStudentsExcel,
  updateStudent,
  deleteStudent,
} from "../services/adminService";

export default function StudentManagement() {
  // Data state
  const [branches, setBranches] = useState([]);
  const [students, setStudents] = useState([]);

  // Filters
  const [branchFilter, setBranchFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    password: "",
    rollNo: "",
    branch: "",
    year: "",
    division: "",
    academicYear: "",  // Academic Year e.g., "2024-2025"
    admissionYear: "",
  });

  // Upload Excel
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Sidebar menu for admin
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
        setLoading(true);
        setError("");
        const [branchesRes, studentsRes] = await Promise.all([
          getBranches(),
          getStudents(null, null, null, null),
        ]);
        setBranches(branchesRes);
        setStudents(studentsRes);
      } catch (err) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const refetchStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getStudents(
        branchFilter || null,
        yearFilter || null,
        divisionFilter || null,
        searchTerm || null
      );
      setStudents(res);
    } catch (err) {
      setError(err.message || "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
  };

  useEffect(() => {
    // Refetch when filters or search change
    refetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter, yearFilter, divisionFilter, searchTerm]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError("");
      setSuccess("");
      const payload = {
        name: newStudent.name.trim(),
        email: newStudent.email.trim(),
        password: newStudent.password,
        rollNo: Number(newStudent.rollNo),
        branch: newStudent.branch,
        year: Number(newStudent.year),
        division: newStudent.division,
        academicYear: newStudent.academicYear.trim(),  // Required
        admissionYear: newStudent.admissionYear
          ? Number(newStudent.admissionYear)
          : undefined,
      };

      await createStudent(payload);
      setSuccess("Student created successfully");
      setIsCreateOpen(false);
      setNewStudent({
        name: "",
        email: "",
        password: "",
        rollNo: "",
        branch: "",
        year: "",
        division: "",
        academicYear: "",
        admissionYear: "",
      });
      await refetchStudents();
    } catch (err) {
      setError(err.message || "Failed to create student");
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axiosInstance.get('/admin/download-student-template', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Student_Upload_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to download template");
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setError("Please select an Excel file to upload");
      return;
    }
    try {
      setUploading(true);
      setError("");
      setSuccess("");
      
      const formData = new FormData();
      formData.append("file", uploadFile);
      const { data } = await axiosInstance.post("/admin/students/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setUploadResult(data);
      setIsResultModalOpen(true);
      setUploadFile(null);
      await refetchStudents();
    } catch (err) {
      setError(err.message || "Failed to upload Excel");
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      header: "Name",
      accessor: "userId",
      render: (val) => val?.name || "-",
    },
    {
      header: "Email",
      accessor: "userId",
      render: (val) => val?.email || "-",
    },
    { header: "Roll No", accessor: "rollNo" },
    {
      header: "Branch",
      accessor: "branch",
      render: (val) => (val ? `${val.name} (${val.code})` : "-"),
    },
    { header: "Year", accessor: "year" },
    { header: "Division", accessor: "division" },
    { header: "Academic Year", accessor: "academicYear" },
    { header: "Admission Year", accessor: "admissionYear" },
    { header: "Status", accessor: "status" },
  ];

  const openEditModal = (student) => {
    setEditingStudent({
      id: student._id,
      name: student.userId?.name || "",
      email: student.userId?.email || "",
      rollNo: student.rollNo || "",
      branch: student.branch?._id || student.branch,
      year: student.year || "",
      division: student.division || "",
      academicYear: student.academicYear || "",
      admissionYear: student.admissionYear || "",
      status: student.status || "active",
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!editingStudent) return;
    try {
      setSavingEdit(true);
      setError("");
      setSuccess("");

      const payload = {
        name: editingStudent.name.trim(),
        email: editingStudent.email.trim(),
        rollNo: Number(editingStudent.rollNo),
        branch: editingStudent.branch,
        year: Number(editingStudent.year),
        division: editingStudent.division,
        academicYear: editingStudent.academicYear?.trim() || undefined,
        admissionYear: editingStudent.admissionYear === "" ? undefined : Number(editingStudent.admissionYear),
        status: editingStudent.status,
      };

      await updateStudent(editingStudent.id, payload);
      setSuccess("Student updated successfully");
      setIsEditOpen(false);
      setEditingStudent(null);
      await refetchStudents();
    } catch (err) {
      setError(err.message || "Failed to update student");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    const ok = window.confirm(`Delete student ${student.userId?.name || ""}? This cannot be undone.`);
    if (!ok) return;
    try {
      setError("");
      setSuccess("");
      await deleteStudent(student._id);
      setSuccess("Student deleted");
      await refetchStudents();
    } catch (err) {
      setError(err.message || "Failed to delete student");
    }
  };

  return (
    <DashboardLayout
      title="Student Management"
      subtitle="Create, upload, and filter students"
      sidebarItems={sidebarItems}
    >
      {/* Upload Instructions for Mobile */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
        <p className="font-semibold text-blue-900">📱 Mobile/Excel Upload Instructions</p>
        <ul className="list-disc pl-5 text-sm text-blue-800 mt-2">
          <li>File .xlsx format mein save karo (WPS/MS Excel → Save As → xlsx).</li>
          <li>Google Sheets se: File → Download → Microsoft Excel (.xlsx).</li>
          <li>Headers change mat karo. Year 1-4 hona chahiye.</li>
        </ul>
      </div>

      {/* Page header actions */}
      <div
        className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
        style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background, boxShadow: theme.shadows.sm }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setIsCreateOpen(true)}>
            + Create Student
          </Button>

          <Button variant="outline" onClick={handleDownloadTemplate}>
            📥 Download Template
          </Button>

          <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
            <label
              className="cursor-pointer rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-100 transition"
              style={{ borderColor: theme.colors.border, color: theme.colors.text.primary, backgroundColor: theme.colors.surface }}
            >
              Choose File
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files[0] || null)}
                className="hidden"
              />
            </label>
            <span className="text-sm px-2 max-w-[150px] truncate" style={{ color: theme.colors.text.secondary }}>
              {uploadFile ? uploadFile.name : "No file chosen"}
            </span>
            <Button variant="outline" onClick={handleUpload} disabled={!uploadFile || uploading}>
              {uploading ? "Uploading..." : "Upload Excel"}
            </Button>
          </div>

          <Button variant="outline" onClick={refetchStudents}>
            Refresh
          </Button>
        </div>

        <div className="w-full max-w-xs md:w-72">
          <FormInput
            label="Search"
            name="search"
            placeholder="Name, email, or roll"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div
        className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3"
        style={{ backgroundColor: theme.colors.background }}
      >
        <FormSelect
          label="Branch"
          name="branchFilter"
          value={branchFilter}
          onChange={handleFilterChange(setBranchFilter)}
          options={[
            { label: "All", value: "" },
            ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id })),
          ]}
        />
        <FormSelect
          label="Year"
          name="yearFilter"
          value={yearFilter}
          onChange={handleFilterChange(setYearFilter)}
          options={[
            { label: "All", value: "" },
            { label: "FE (1)", value: 1 },
            { label: "SE (2)", value: 2 },
            { label: "TE (3)", value: 3 },
            { label: "BE (4)", value: 4 },
          ]}
        />
        <FormSelect
          label="Division"
          name="divisionFilter"
          value={divisionFilter}
          onChange={handleFilterChange(setDivisionFilter)}
          options={[
            { label: "All", value: "" },
            { label: "A", value: "A" },
            { label: "B", value: "B" },
            { label: "C", value: "C" },
          ]}
        />
      </div>

      {/* Alerts */}
      <div className="mb-4 space-y-2">
        {error && <Alert message={error} type="error" onClose={() => setError("")} />}
        {success && <Alert message={success} type="success" onClose={() => setSuccess("")} />}
      </div>

      {/* Data table */}
      <Table
        columns={columns}
        data={students}
        emptyMessage={loading ? "Loading students..." : "No students found"}
        actions={(row) => (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openEditModal(row)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => handleDeleteStudent(row)}>
              Delete
            </Button>
          </div>
        )}
      />

      {/* Create Student Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Student"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Name"
              name="name"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              required
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              required
            />
            <FormInput
              label="Password"
              name="password"
              type="password"
              value={newStudent.password}
              onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
              required
            />
            <FormInput
              label="Roll No"
              name="rollNo"
              type="number"
              value={newStudent.rollNo}
              onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
              required
            />
            <FormSelect
              label="Branch"
              name="branch"
              value={newStudent.branch}
              onChange={(e) => setNewStudent({ ...newStudent, branch: e.target.value })}
              options={[
                { label: "Select Branch", value: "" },
                ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id })),
              ]}
              required
            />
            <FormSelect
              label="Year"
              name="year"
              value={newStudent.year}
              onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })}
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
              name="division"
              value={newStudent.division}
              onChange={(e) => setNewStudent({ ...newStudent, division: e.target.value })}
              options={[
                { label: "Select Division", value: "" },
                { label: "A", value: "A" },
                { label: "B", value: "B" },
                { label: "C", value: "C" },
              ]}
              required
            />
            <FormInput
              label="Academic Year"
              name="academicYear"
              placeholder="e.g., 2024-2025"
              value={newStudent.academicYear}
              onChange={(e) => setNewStudent({ ...newStudent, academicYear: e.target.value })}
              required
            />
            <FormInput
              label="Admission Year"
              name="admissionYear"
              type="number"
              placeholder="Optional"
              value={newStudent.admissionYear}
              onChange={(e) => setNewStudent({ ...newStudent, admissionYear: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Student"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={savingEdit}>
              {savingEdit ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        {editingStudent && (
          <form onSubmit={handleEditSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Name"
                name="editName"
                value={editingStudent.name}
                onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                required
              />
              <FormInput
                label="Email"
                name="editEmail"
                type="email"
                value={editingStudent.email}
                onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                required
              />
              <FormInput
                label="Roll No"
                name="editRollNo"
                type="number"
                value={editingStudent.rollNo}
                onChange={(e) => setEditingStudent({ ...editingStudent, rollNo: e.target.value })}
                required
              />
              <FormSelect
                label="Branch"
                name="editBranch"
                value={editingStudent.branch}
                onChange={(e) => setEditingStudent({ ...editingStudent, branch: e.target.value })}
                options={[
                  { label: "Select Branch", value: "" },
                  ...branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b._id })),
                ]}
                required
              />
              <FormSelect
                label="Year"
                name="editYear"
                value={editingStudent.year}
                onChange={(e) => setEditingStudent({ ...editingStudent, year: e.target.value })}
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
                name="editDivision"
                value={editingStudent.division}
                onChange={(e) => setEditingStudent({ ...editingStudent, division: e.target.value })}
                options={[
                  { label: "Select Division", value: "" },
                  { label: "A", value: "A" },
                  { label: "B", value: "B" },
                  { label: "C", value: "C" },
                ]}
                required
              />
              <FormInput
                label="Academic Year"
                name="editAcademicYear"
                placeholder="e.g., 2024-2025"
                value={editingStudent.academicYear}
                onChange={(e) => setEditingStudent({ ...editingStudent, academicYear: e.target.value })}
                required
              />
              <FormInput
                label="Admission Year"
                name="editAdmissionYear"
                type="number"
                placeholder="Optional"
                value={editingStudent.admissionYear}
                onChange={(e) => setEditingStudent({ ...editingStudent, admissionYear: e.target.value })}
              />
              <FormSelect
                label="Status"
                name="editStatus"
                value={editingStudent.status}
                onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value })}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Dropped", value: "dropped" },
                ]}
                required
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Upload Result Modal */}
      <UploadResultModal 
        isOpen={isResultModalOpen} 
        onClose={() => setIsResultModalOpen(false)} 
        result={uploadResult} 
      />
    </DashboardLayout>
  );
}
