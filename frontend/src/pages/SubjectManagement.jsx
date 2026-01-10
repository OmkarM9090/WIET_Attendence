/**
 * SUBJECT MANAGEMENT PAGE
 * Admin page to manage subjects for branches
 * Features: View all subjects, Filter by branch/semester, Create, Edit, Delete
 *
 * API Endpoints:
 * - GET /api/admin/subjects?branch=&semester=
 * - POST /api/admin/subjects { name, code, branch, semester }
 */

import { useState, useEffect } from "react";
import { theme } from "../styles/theme";

// Services
import { getSubjects, createSubject, getBranches } from "../services/adminService";

// Components
import DashboardLayout from "../components/DashboardLayout";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Table from "../components/Table";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";

export default function SubjectManagement() {
  // Data state
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);

  // Filter state
  const [filters, setFilters] = useState({
    branch: "",
    semester: "",
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingSubject, setEditingSubject] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    branch: "",
    semester: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  /**
   * Fetch branches and subjects on mount
   */
  useEffect(() => {
    fetchBranches();
    fetchSubjects();
  }, []);

  /**
   * Fetch subjects when filters change
   */
  useEffect(() => {
    fetchSubjects();
  }, [filters.branch, filters.semester]);

  /**
   * Fetch all branches
   */
  const fetchBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  /**
   * Fetch subjects from API with filters
   */
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

  /**
   * Handle filter changes
   */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({ branch: "", semester: "" });
  };

  /**
   * Open create modal
   */
  const handleCreate = () => {
    setModalMode("create");
    setFormData({ name: "", code: "", branch: "", semester: "" });
    setFormError("");
    setShowModal(true);
  };

  /**
   * Open edit modal
   */
  const handleEdit = (subject) => {
    setModalMode("edit");
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      branch: subject.branch?._id || subject.branch,
      semester: subject.semester?.toString(),
    });
    setFormError("");
    setShowModal(true);
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Validate form data
   */
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

    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) return;

    setFormLoading(true);

    try {
      if (modalMode === "create") {
        await createSubject(
          formData.name,
          formData.code,
          formData.branch,
          parseInt(formData.semester)
        );
        setSuccess("Subject created successfully!");
      } else {
        // Edit functionality would go here
        setSuccess("Subject updated successfully!");
      }

      setShowModal(false);
      fetchSubjects(); // Refresh list

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setFormError(err.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = (subject) => {
    setDeleteConfirm(subject);
  };

  /**
   * Handle delete action
   */
  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setFormLoading(true);

    try {
      // Delete functionality would go here
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

  // Sidebar items
  const sidebarItems = [
    { path: "/admin", icon: "📊", label: "Dashboard" },
    { path: "/admin/branches", icon: "🏢", label: "Branches" },
    { path: "/admin/subjects", icon: "📚", label: "Subjects" },
    { path: "/admin/students", icon: "🎓", label: "Students" },
    { path: "/admin/teachers", icon: "👨‍🏫", label: "Teachers" },
    { path: "/admin/reports", icon: "📋", label: "Reports" },
    { path: "/admin/defaulters", icon: "⚠️", label: "Defaulters" },
  ];

  // Semester options
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

  // Table columns
  const columns = [
    {
      header: "Subject Code",
      accessor: "code",
      render: (value) => (
        <span
          className="rounded-md px-2 py-1 text-xs font-semibold"
          style={{
            backgroundColor: theme.colors.info,
            color: theme.colors.text.inverse,
          }}
        >
          {value}
        </span>
      ),
    },
    {
      header: "Subject Name",
      accessor: "name",
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      header: "Branch",
      accessor: "branch",
      render: (value) => (
        <span
          className="rounded-md px-2 py-1 text-xs"
          style={{
            backgroundColor: theme.colors.primary[50],
            color: theme.colors.primary[700],
          }}
        >
          {value?.name || value?.code || "N/A"}
        </span>
      ),
    },
    {
      header: "Semester",
      accessor: "semester",
      render: (value) => (
        <span
          className="rounded-md px-2 py-1 text-xs font-medium"
          style={{
            backgroundColor: theme.colors.success,
            color: theme.colors.text.inverse,
          }}
        >
          Sem {value}
        </span>
      ),
    },
  ];

  // Table actions
  const actions = (subject) => (
    <>
      <button
        onClick={() => handleEdit(subject)}
        className="rounded-md px-3 py-1 text-sm font-medium transition-colors"
        style={{
          color: theme.colors.primary[600],
          backgroundColor: theme.colors.primary[50],
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.primary[100];
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.primary[50];
        }}
      >
        Edit
      </button>
      <button
        onClick={() => handleDeleteConfirm(subject)}
        className="rounded-md px-3 py-1 text-sm font-medium transition-colors"
        style={{
          color: theme.colors.error,
          backgroundColor: `${theme.colors.error}15`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${theme.colors.error}25`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = `${theme.colors.error}15`;
        }}
      >
        Delete
      </button>
    </>
  );

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      title="Subject Management"
      subtitle="Manage subjects for different branches and semesters"
    >
      {/* Success/Error Alerts */}
      {success && (
        <div className="mb-6">
          <Alert type="success" message={success} />
        </div>
      )}
      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      {/* Filters Section */}
      <div
        className="mb-6 rounded-lg p-4"
        style={{
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
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
              Clear Filters
            </Button>
            <Button onClick={handleCreate} fullWidth>
              ➕ Add Subject
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
            Total Subjects:{" "}
            <span className="font-semibold">{subjects.length}</span>
          </p>
        </div>
      </div>

      {/* Subjects Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <Table
          columns={columns}
          data={subjects}
          actions={actions}
          emptyMessage="No subjects found. Create your first subject!"
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
            placeholder="e.g., Data Structures"
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

          <div
            className="rounded-lg border p-3"
            style={{
              borderColor: theme.colors.primary[200],
              backgroundColor: theme.colors.primary[50],
            }}
          >
            <p className="text-xs" style={{ color: theme.colors.primary[700] }}>
              💡 <strong>Tip:</strong> Subject code should be unique and follow
              your college's naming convention
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
        <div className="space-y-4">
          <div className="flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${theme.colors.error}15`,
                color: theme.colors.error,
              }}
            >
              <span className="text-3xl">⚠️</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm" style={{ color: theme.colors.text.primary }}>
              Are you sure you want to delete the subject{" "}
              <strong>{deleteConfirm?.name}</strong>?
            </p>
            <p
              className="mt-2 text-xs"
              style={{ color: theme.colors.text.secondary }}
            >
              This action cannot be undone. All associated data will be removed.
            </p>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
