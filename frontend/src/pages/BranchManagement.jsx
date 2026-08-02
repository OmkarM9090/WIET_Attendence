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
  Info,
  Layers
} from "lucide-react";

import { DEFAULT_ADMIN_SIDEBAR_ITEMS } from "../config/navigation";
import { getBranches, createBranch, deleteBranch, getBranchDeleteCount } from "../services/adminService";
import DashboardLayout from "../components/DashboardLayout";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Table from "../components/Table";
import FormInput from "../components/FormInput";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingBranch, setEditingBranch] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteCounts, setDeleteCounts] = useState(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteLoadingCounts, setDeleteLoadingCounts] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

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

  const handleCreate = () => {
    setModalMode("create");
    setFormData({ name: "", code: "" });
    setFormError("");
    setShowModal(true);
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
        setSuccess("Branch updated successfully!");
      }

      setShowModal(false);
      fetchBranches();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setFormError(err.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async (branch) => {
    setDeleteConfirm(branch);
    setDeleteInput("");
    setDeleteCounts(null);
    setDeleteLoadingCounts(true);
    
    try {
      const counts = await getBranchDeleteCount(branch._id);
      setDeleteCounts(counts);
    } catch (err) {
      setFormError("Failed to load deletion impact counts");
    } finally {
      setDeleteLoadingCounts(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteInput !== "DELETE") {
      setFormError("Please type DELETE to confirm");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      await deleteBranch(deleteConfirm._id);
      setSuccess("Branch deleted successfully!");
      setDeleteConfirm(null);
      setDeleteInput("");
      fetchBranches();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setFormError(err.message || "Delete failed");
    } finally {
      setFormLoading(false);
    }
  };

  const sidebarItems = DEFAULT_ADMIN_SIDEBAR_ITEMS;

  const columns = [
    {
      header: "Branch Code",
      accessor: "code",
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 font-mono">
          {value}
        </span>
      ),
    },
    {
      header: "Branch Name",
      accessor: "name",
      render: (value) => (
        <span className="font-bold text-slate-900">{value}</span>
      ),
    },
    {
      header: "Created At",
      accessor: "createdAt",
      render: (value) => (
        <span className="text-slate-500 font-medium text-xs">
          {value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
        </span>
      ),
    },
  ];

  const actions = (branch) => (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => handleEdit(branch)}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-100 transition-colors"
      >
        <Edit2 size={13} /> Edit
      </button>
      <button
        onClick={() => handleDeleteConfirm(branch)}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-100 transition-colors"
      >
        <Trash2 size={13} /> Delete
      </button>
    </div>
  );

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      title="Branch Management"
      subtitle="Configure & Manage Academic Branches"
    >
      {success && <Alert type="success" message={success} />}
      {error && <Alert type="error" message={error} />}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Academic Branches</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Total Branches Registered: <span className="font-bold text-slate-800">{branches.length}</span>
          </p>
        </div>
        <Button onClick={handleCreate} icon={<Plus size={18} />}>
          Add New Branch
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <Table
          columns={columns}
          data={branches}
          actions={actions}
          emptyMessage="No branches found. Click 'Add New Branch' to create one."
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
            placeholder="e.g., Computer Science & Engineering"
            value={formData.name}
            onChange={handleInputChange}
            disabled={formLoading}
            required
          />

          <FormInput
            label="Branch Code"
            name="code"
            type="text"
            placeholder="e.g., CSE"
            value={formData.code}
            onChange={handleInputChange}
            disabled={formLoading}
            required
          />

          <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-3.5 flex gap-2.5 items-start text-xs text-blue-900 font-medium">
            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>Tip:</strong> Branch code should be short and unique (e.g., CSE, IT, MECH).
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

            {deleteLoadingCounts ? (
              <div className="mt-4 flex justify-center py-4">
                <LoadingSpinner size={24} />
              </div>
            ) : deleteCounts ? (
              <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200/80 p-4 text-left text-xs text-rose-800 space-y-1 font-medium">
                <p className="font-bold text-rose-950 mb-2">Affected items to be deleted:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{deleteCounts.students} Students</li>
                  <li>{deleteCounts.subjects} Subjects</li>
                  <li>{deleteCounts.batches} Batches</li>
                  <li>{deleteCounts.assignments} Teaching Assignments</li>
                  <li>{deleteCounts.sessions} Attendance Sessions</li>
                </ul>
              </div>
            ) : null}

            <p className="mt-4 text-xs font-bold text-rose-600">
              Type 'DELETE' to confirm deletion.
            </p>

            <input
              type="text"
              placeholder="DELETE"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-mono font-bold uppercase focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              disabled={formLoading}
            />

            {formError && <p className="mt-2 text-xs font-semibold text-rose-600">{formError}</p>}
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
