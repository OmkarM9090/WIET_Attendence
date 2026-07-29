import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Building2, 
  BookOpen, 
  GraduationCap, 
  Users, 
  FileText, 
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Info
} from "lucide-react";

import { getSubjects, createSubject, getBranches, deleteSubject } from "../services/adminService";
import DashboardLayout from "../components/DashboardLayout";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Table from "../components/Table";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);

  const [filters, setFilters] = useState({
    branch: "",
    semester: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingSubject, setEditingSubject] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    branch: "",
    semester: "",
    semesterStartDate: "",
    semesterEndDate: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchBranches();
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [filters.branch, filters.semester]);

  const fetchBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getSubjects(
        filters.branch || null,
        filters.semester || null
      );
      setSubjects(data);
    } catch (err) {
      setError(err.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({ branch: "", semester: "" });
  };

  const handleCreate = () => {
    setModalMode("create");
    setFormData({ 
      name: "", 
      code: "", 
      branch: "", 
      semester: "", 
      semesterStartDate: "", 
      semesterEndDate: "" 
    });
    setFormError("");
    setShowModal(true);
  };

  const handleEdit = (subject) => {
    setModalMode("edit");
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      branch: subject.branch?._id || subject.branch,
      semester: subject.semester?.toString(),
      semesterStartDate: subject.semesterStartDate ? new Date(subject.semesterStartDate).toISOString().split('T')[0] : "",
      semesterEndDate: subject.semesterEndDate ? new Date(subject.semesterEndDate).toISOString().split('T')[0] : "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError("Subject name is required");
      return false;
    }

    if (!formData.code.trim()) {
      setFormError("Subject code is required");
      return false;
    }

    if (!formData.branch) {
      setFormError("Please select a branch");
      return false;
    }

    if (!formData.semester) {
      setFormError("Please select a semester");
      return false;
    }
    
    if (!formData.semesterStartDate) {
      setFormError("Please select a semester start date");
      return false;
    }

    if (!formData.semesterEndDate) {
      setFormError("Please select a semester end date");
      return false;
    }
    
    if (new Date(formData.semesterStartDate) >= new Date(formData.semesterEndDate)) {
      setFormError("End date must be after start date");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) return;

    setFormLoading(true);

    try {
      if (modalMode === "create") {
        await createSubject({
          ...formData,
          semester: parseInt(formData.semester)
        });
        setSuccess("Subject created successfully!");
      } else {
        setSuccess("Subject updated successfully!");
      }

      setShowModal(false);
      fetchSubjects();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setFormError(err.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = (subject) => {
    setDeleteConfirm(subject);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setFormLoading(true);

    try {
      await deleteSubject(deleteConfirm._id);
      setSuccess("Subject deleted successfully!");
      setDeleteConfirm(null);
      fetchSubjects();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setFormLoading(false);
    }
  };

  const sidebarItems = [
    { path: "/admin", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/admin/branches", icon: <Building2 size={20} />, label: "Branches" },
    { path: "/admin/subjects", icon: <BookOpen size={20} />, label: "Subjects" },
    { path: "/admin/students", icon: <GraduationCap size={20} />, label: "Students" },
    { path: "/admin/teachers", icon: <Users size={20} />, label: "Teachers" },
    { path: "/admin/reports", icon: <FileText size={20} />, label: "Reports" },
    { path: "/admin/defaulters", icon: <AlertTriangle size={20} />, label: "Defaulters" },
  ];

  const semesterOptions = [
    { value: "", label: "All Semesters" },
    { value: "1", label: "Semester 1" },
    { value: "2", label: "Semester 2" },
    { value: "3", label: "Semester 3" },
    { value: "4", label: "Semester 4" },
    { value: "5", label: "Semester 5" },
    { value: "6", label: "Semester 6" },
    { value: "7", label: "Semester 7" },
    { value: "8", label: "Semester 8" },
  ];

  const columns = [
    {
      header: "Subject Code",
      accessor: "code",
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 font-mono">
          {value}
        </span>
      ),
    },
    {
      header: "Subject Name",
      accessor: "name",
      render: (value) => <span className="font-bold text-slate-900">{value}</span>,
    },
    {
      header: "Branch",
      accessor: "branch",
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
          {value?.name || value?.code || "N/A"}
        </span>
      ),
    },
    {
      header: "Semester",
      accessor: "semester",
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
          Sem {value}
        </span>
      ),
    },
  ];

  const actions = (subject) => (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => handleEdit(subject)}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-100 transition-colors"
      >
        <Edit2 size={13} /> Edit
      </button>
      <button
        onClick={() => handleDeleteConfirm(subject)}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-100 transition-colors"
      >
        <Trash2 size={13} /> Delete
      </button>
    </div>
  );

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      title="Subject Management"
      subtitle="Manage Course Subjects & Semester Curriculums"
    >
      {success && <Alert type="success" message={success} />}
      {error && <Alert type="error" message={error} />}

      {/* Filters Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Filter size={14} /> Filter Subjects
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormSelect
            label="Filter by Branch"
            name="branch"
            value={filters.branch}
            onChange={handleFilterChange}
            options={[
              { value: "", label: "All Branches" },
              ...branches.map((b) => ({
                value: b._id,
                label: `${b.name} (${b.code})`,
              })),
            ]}
          />

          <FormSelect
            label="Filter by Semester"
            name="semester"
            value={filters.semester}
            onChange={handleFilterChange}
            options={semesterOptions}
          />

          <div className="flex items-end gap-2">
            <Button variant="secondary" onClick={clearFilters} fullWidth>
              Reset Filters
            </Button>
            <Button onClick={handleCreate} fullWidth icon={<Plus size={18} />}>
              Add Subject
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-slate-500">
          Total Subjects: <span className="font-bold text-slate-800">{subjects.length}</span>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <Table
          columns={columns}
          data={subjects}
          actions={actions}
          emptyMessage="No subjects found. Click 'Add Subject' to add one."
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === "create" ? "Create New Subject" : "Edit Subject"}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={formLoading}>
              {modalMode === "create" ? "Create Subject" : "Update Subject"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert type="error" message={formError} />}

          <FormInput
            label="Subject Name"
            name="name"
            type="text"
            placeholder="e.g., Data Structures & Algorithms"
            value={formData.name}
            onChange={handleInputChange}
            disabled={formLoading}
            required
          />

          <FormInput
            label="Subject Code"
            name="code"
            type="text"
            placeholder="e.g., CS301"
            value={formData.code}
            onChange={handleInputChange}
            disabled={formLoading}
            required
          />

          <FormSelect
            label="Branch"
            name="branch"
            value={formData.branch}
            onChange={handleInputChange}
            disabled={formLoading}
            required
            options={[
              { value: "", label: "Select Branch" },
              ...branches.map((b) => ({
                value: b._id,
                label: `${b.name} (${b.code})`,
              })),
            ]}
          />

          <FormSelect
            label="Semester"
            name="semester"
            value={formData.semester}
            onChange={handleInputChange}
            disabled={formLoading}
            required
            options={[
              { value: "", label: "Select Semester" },
              ...Array.from({ length: 8 }, (_, i) => ({
                value: (i + 1).toString(),
                label: `Semester ${i + 1}`,
              })),
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Semester Start Date"
              name="semesterStartDate"
              type="date"
              value={formData.semesterStartDate}
              onChange={handleInputChange}
              disabled={formLoading}
              required
            />
            
            <FormInput
              label="Semester End Date"
              name="semesterEndDate"
              type="date"
              value={formData.semesterEndDate}
              onChange={handleInputChange}
              disabled={formLoading}
              required
            />
          </div>

          <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-3.5 flex gap-2.5 items-start text-xs text-blue-900 font-medium">
            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>Tip:</strong> Ensure dates accurately span the academic term for progress reporting.
            </p>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Subject"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirm(null)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={formLoading}
            >
              Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Are you sure you want to delete <strong className="text-slate-900">{deleteConfirm?.name}</strong>?
            </p>
            <p className="mt-2 text-xs text-slate-500 font-medium">
              This action cannot be undone. Associated attendance records will be affected.
            </p>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
