import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { DEFAULT_ADMIN_SIDEBAR_ITEMS } from "../config/navigation";
import { getCurrentAcademicYear } from "../utils/academicYear";
import { getBatch, removeStudentFromBatch, addStudentsToBatch, deleteBatch, getUnassignedStudents } from "../services/adminBatchService";
import EditBatchModal from "../components/admin/batch/EditBatchModal";
import {
  ArrowLeft,
  Users,
  MapPin,
  Building2,
  BookOpen,
  GraduationCap,
  Layers,
  FileText,
  AlertTriangle,
  LayoutDashboard,
  Search,
  UserX,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  GitMerge,
  Hash
} from "lucide-react";

export default function BatchDetailsPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const sidebarItems = DEFAULT_ADMIN_SIDEBAR_ITEMS;

  const [batch, setBatch] = useState(null);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [selectedUnassigned, setSelectedUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [unassignedSearchQuery, setUnassignedSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("students"); // 'students' | 'add'
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  const fetchBatchDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBatch(batchId);
      setBatch(data.batch);

      // Fetch unassigned students for this class
      if (data.batch) {
        const unassigned = await getUnassignedStudents({
          branchId: data.batch.branch?._id || data.batch.branch,
          year: data.batch.year,
          division: data.batch.division,
          academicYear: data.batch.academicYear,
        });
        setUnassignedStudents(unassigned.students || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load batch details");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName || "this student"} from this batch?`)) return;

    setActionLoading(true);
    setError("");
    try {
      await removeStudentFromBatch(batchId, studentId);
      setSuccess("Student removed from batch successfully");
      window.scrollTo({ top: 0, behavior: "smooth" });
      fetchBatchDetails();
    } catch (err) {
      setError(err.message || "Failed to remove student");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSelectedStudents = async () => {
    if (selectedUnassigned.length === 0) return;

    setActionLoading(true);
    setError("");
    try {
      await addStudentsToBatch(batchId, selectedUnassigned);
      setSuccess(`${selectedUnassigned.length} students added to batch successfully`);
      setSelectedUnassigned([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      fetchBatchDetails();
    } catch (err) {
      setError(err.message || "Failed to add students");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!window.confirm(`Are you sure you want to delete batch "${batch.name}"? This action cannot be undone.`)) return;

    try {
      await deleteBatch(batchId);
      navigate("/admin/batches");
    } catch (err) {
      setError(err.message || "Failed to delete batch");
    }
  };

  const filteredStudents = (batch?.students || []).filter((s) => {
    const q = searchQuery.toLowerCase();
    const name = s.userId?.name?.toLowerCase() || "";
    const email = s.userId?.email?.toLowerCase() || "";
    const roll = String(s.rollNo);
    return name.includes(q) || email.includes(q) || roll.includes(q);
  });

  const filteredUnassigned = unassignedStudents.filter((s) => {
    const q = unassignedSearchQuery.toLowerCase();
    const name = s.userId?.name?.toLowerCase() || "";
    const roll = String(s.rollNo);
    return name.includes(q) || roll.includes(q);
  });

  const toggleSelectUnassigned = (sId) => {
    setSelectedUnassigned((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  return (
    <DashboardLayout title="Batch Details" sidebarItems={sidebarItems}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/admin/batches")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 font-semibold text-xs transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Batches</span>
          </button>

          {batch && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 font-semibold text-xs transition-all shadow-2xs cursor-pointer"
              >
                <Edit2 size={15} />
                <span>Edit Batch</span>
              </button>
              <button
                onClick={handleDeleteBatch}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-all shadow-2xs cursor-pointer"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-semibold">{error}</p>
            </div>
            <button onClick={() => setError("")} className="text-xs text-rose-500 font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="shrink-0" />
              <p className="text-xs font-semibold">{success}</p>
            </div>
            <button onClick={() => setSuccess("")} className="text-xs text-emerald-600 font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl shadow-xs">
            <RefreshCw size={28} className="animate-spin text-blue-600 mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading batch information...</p>
          </div>
        ) : !batch ? (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8">
            <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
            <h3 className="text-base font-bold text-slate-900">Batch Not Found</h3>
            <p className="text-xs text-slate-500 mt-1">The requested batch does not exist or has been deleted.</p>
          </div>
        ) : (
          <>
            {/* Header Banner */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-lg shadow-sm ${
                    batch.isMerged || batch.batchType === "merged"
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}>
                    {batch.isMerged ? <GitMerge size={24} /> : batch.name}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-xl font-bold text-slate-900">{batch.displayName || batch.name}</h1>
                      {batch.isMerged && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                          Merged Batch
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {batch.branch?.name || "Branch"} • Year {batch.year} • Division {batch.division || batch.divisions?.join(", ")} • AY {batch.academicYear || getCurrentAcademicYear()}
                    </p>
                  </div>
                </div>

                {/* Roll Ranges */}
                {batch.rollRanges && batch.rollRanges.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
                      <Hash size={12} /> Assigned Roll Ranges
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {batch.rollRanges.map((r, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-mono font-bold">
                          {r.division ? `Div ${r.division}: ` : ""}{r.from}-{r.to}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Users size={20} />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Enrolled</span>
                    <span className="text-lg font-extrabold text-slate-900">{batch.students?.length || 0} Students</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Lab Room</span>
                    <span className="text-base font-bold text-slate-800">{batch.labRoom || "Not set"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Layers size={20} />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Batch Type</span>
                    <span className="text-base font-bold text-slate-800 capitalize">{batch.batchType || "Regular"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Class Unassigned</span>
                    <span className="text-base font-bold text-slate-800">{unassignedStudents.length} Students</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("students")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeTab === "students"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Users size={16} />
                    <span>Enrolled Students ({batch.students?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("add")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeTab === "add"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <UserPlus size={16} />
                    <span>Add Unassigned Students ({unassignedStudents.length})</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Enrolled Students */}
              {activeTab === "students" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student or roll no..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                      <Users size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-500">No students enrolled in this batch yet</p>
                      <button
                        onClick={() => setActiveTab("add")}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <UserPlus size={14} /> Add Students
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200/90 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-3 px-4">Roll No</th>
                            <th className="py-3 px-4">Student Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {filteredStudents.map((s) => (
                            <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.rollNo}</td>
                              <td className="py-3 px-4 font-bold text-slate-900">{s.userId?.name || "N/A"}</td>
                              <td className="py-3 px-4 text-slate-500">{s.userId?.email || "N/A"}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {s.status || "active"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleRemoveStudent(s._id, s.userId?.name)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove from batch"
                                >
                                  <UserX size={14} />
                                  <span className="font-bold">Remove</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Add Unassigned Students */}
              {activeTab === "add" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search unassigned student..."
                        value={unassignedSearchQuery}
                        onChange={(e) => setUnassignedSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <button
                      onClick={handleAddSelectedStudents}
                      disabled={selectedUnassigned.length === 0 || actionLoading}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <UserPlus size={16} />
                      <span>Add Selected ({selectedUnassigned.length})</span>
                    </button>
                  </div>

                  {filteredUnassigned.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                      <p className="text-xs font-bold text-slate-600">All active students for this class are assigned to batches!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200/90 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-3 px-4 w-10">Select</th>
                            <th className="py-3 px-4">Roll No</th>
                            <th className="py-3 px-4">Student Name</th>
                            <th className="py-3 px-4">Email</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {filteredUnassigned.map((s) => {
                            const isSelected = selectedUnassigned.includes(s._id);
                            return (
                              <tr
                                key={s._id}
                                onClick={() => toggleSelectUnassigned(s._id)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected ? "bg-blue-50/70" : "hover:bg-slate-50/80"
                                }`}
                              >
                                <td className="py-3 px-4">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.rollNo}</td>
                                <td className="py-3 px-4 font-bold text-slate-900">{s.userId?.name || "N/A"}</td>
                                <td className="py-3 px-4 text-slate-500">{s.userId?.email || "N/A"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {isEditOpen && batch && (
        <EditBatchModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          batch={batch}
          onSuccess={() => {
            setIsEditOpen(false);
            setSuccess("Batch updated successfully");
            window.scrollTo({ top: 0, behavior: "smooth" });
            fetchBatchDetails();
          }}
        />
      )}
    </DashboardLayout>
  );
}
