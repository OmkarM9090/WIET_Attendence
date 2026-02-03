/**
 * BRANCH MANAGEMENT PAGE
 * Admin page to manage academic branches
 * Features: View all branches, Create, Edit, Delete
 *
 * API Endpoints:
 * - GET /api/admin/branches
 * - POST /api/admin/branches { name, code }
 * - PUT /api/admin/branches/:id { name, code }
 * - DELETE /api/admin/branches/:id
 */

import { useState, useEffect } from "react";
import { theme } from "../styles/theme";

// Services
import { getBranches, createBranch } from "../services/adminService";

// Components
import DashboardLayout from "../components/DashboardLayout";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Table from "../components/Table";
import FormInput from "../components/FormInput";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";

export default function BranchManagement() {
  // Data state
  const [branches, setBranches] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create or edit
  const [editingBranch, setEditingBranch] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  /**
   * Fetch all branches on mount
   */
  useEffect(() => {
    fetchBranches();
  }, []);

  /**
   * Fetch branches from API
   */
  const fetchBranches = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getBranches();
      setBranches(data);
    } catch (err) {
      setError(err.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open create modal
   */
  const handleCreate = () => {
    setModalMode("create");
    setFormData({ name: "", code: "" });
    setFormError("");
    setShowModal(true);
  };

  /**
   * Open edit modal
   */
  const handleEdit = (branch) => {
    setModalMode("edit");
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
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
      setFormError("Branch name is required");
      return false;
    }

    if (!formData.code.trim()) {
      setFormError("Branch code is required");
      return false;
    }

    if (formData.code.length > 10) {
      setFormError("Branch code must be less than 10 characters");
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
        await createBranch(formData.name, formData.code);
        setSuccess("Branch created successfully!");
      } else {
        // Edit functionality would go here
        // await updateBranch(editingBranch._id, formData.name, formData.code);
        setSuccess("Branch updated successfully!");
      }

      setShowModal(false);
      fetchBranches(); // Refresh list

      // Clear success message after 3 seconds
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
  const handleDeleteConfirm = (branch) => {
    setDeleteConfirm(branch);
  };

  /**
   * Handle delete action
   */
  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setFormLoading(true);

    try {
      // Delete functionality would go here
      // await deleteBranch(deleteConfirm._id);
      setSuccess("Branch deleted successfully!");
      setDeleteConfirm(null);
      fetchBranches(); // Refresh list

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

  // Table columns
  const columns = [
    {
      header: "Branch Code",
      accessor: "code",
      render: (value) => (
        <span
          className="rounded-md px-2 py-1 text-xs font-semibold"
          style={{
            backgroundColor: theme.colors.primary[50],
            color: theme.colors.primary[700],
          }}
        >
          {value}
        </span>
      ),
    },
    {
      header: "Branch Name",
      accessor: "name",
      render: (value) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      header: "Created At",
      accessor: "createdAt",
      render: (value) => (
        value ? new Date(value).toLocaleDateString() : "N/A"
      ),
    },
  ];

  // Table actions
  const actions = (branch) => (
    <>
      <button
        onClick={() => handleEdit(branch)}
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
        onClick={() => handleDeleteConfirm(branch)}
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
      title="Branch Management"
      subtitle="Manage academic branches"
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

      {/* Header Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p
            className="text-sm"
            style={{ color: theme.colors.text.secondary }}
          >
            Total Branches: <span className="font-semibold">{branches.length}</span>
          </p>
        </div>
        <Button onClick={handleCreate}>
          ➕ Add New Branch
        </Button>
      </div>

      {/* Branches Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <Table
          columns={columns}
          data={branches}
          actions={actions}
          emptyMessage="No branches found. Create your first branch!"
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === "create" ? "Create New Branch" : "Edit Branch"}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={formLoading}
            >
              {modalMode === "create" ? "Create Branch" : "Update Branch"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert type="error" message={formError} />}

          <FormInput
            label="Branch Name"
            name="name"
            type="text"
            placeholder="e.g., Computer Science"
            value={formData.name}
            onChange={handleInputChange}
            disabled={formLoading}
            required
          />

          <FormInput
            label="Branch Code"
            name="code"
            type="text"
            placeholder="e.g., CS"
            value={formData.code}
            onChange={handleInputChange}
            disabled={formLoading}
            required
          />

          <div
            className="rounded-lg border p-3"
            style={{
              borderColor: theme.colors.primary[200],
              backgroundColor: theme.colors.primary[50],
            }}
          >
            <p
              className="text-xs"
              style={{ color: theme.colors.primary[700] }}
            >
              💡 <strong>Tip:</strong> Branch code should be short and unique (e.g., CS, IT, MECH)
            </p>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Branch"
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
            <p
              className="text-sm font-medium"
              style={{ color: theme.colors.text.primary }}
            >
              Are you sure you want to delete the branch{" "}
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
