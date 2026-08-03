import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { DEFAULT_ADMIN_SIDEBAR_ITEMS } from "../config/navigation";
import { getCurrentAcademicYear, getAcademicYearOptions } from "../utils/academicYear";
import BatchCard from "../components/admin/batch/BatchCard";
import QuickSetupModal from "../components/admin/batch/QuickSetupModal";
import CreateBatchModal from "../components/admin/batch/CreateBatchModal";
import MergedBatchModal from "../components/admin/batch/MergedBatchModal";
import EditBatchModal from "../components/admin/batch/EditBatchModal";
import { getBranches } from "../services/adminService";
import {
  getBatches,
  getUnassignedStudents,
  getBatchStats,
  quickSetupBatches,
  createBatch,
  createMergedBatch,
  deleteBatch,
} from "../services/adminBatchService";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  GraduationCap,
  Users,
  FileText,
  AlertTriangle,
  Layers,
  Sparkles,
  Plus,
  GitMerge,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export default function BatchManagement() {
  const navigate = useNavigate();
  const sidebarItems = DEFAULT_ADMIN_SIDEBAR_ITEMS;

  // Class Selection Filters
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedYear, setSelectedYear] = useState(2);
  const [selectedDivision, setSelectedDivision] = useState("A");
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());

  // Data State
  const [batches, setBatches] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals Control
  const [isQuickSetupOpen, setIsQuickSetupOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMergedOpen, setIsMergedOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  // Search in unassigned list
  const [unassignedQuery, setUnassignedQuery] = useState("");

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch class data whenever class selections change
  useEffect(() => {
    if (selectedBranch && selectedYear && selectedDivision) {
      fetchClassBatchData();
    }
  }, [selectedBranch, selectedYear, selectedDivision, academicYear]);

  const fetchBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data);
      if (data.length > 0) {
        setSelectedBranch(data[0]._id);
      }
    } catch (err) {
      setError(err.message || "Failed to load academic branches");
    }
  };

  const fetchClassBatchData = async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        branchId: selectedBranch,
        year: Number(selectedYear),
        division: selectedDivision,
        academicYear,
      };

      const [batchesRes, unassignedRes, statsRes] = await Promise.all([
        getBatches(params),
        getUnassignedStudents(params),
        getBatchStats(params),
      ]);

      setBatches(batchesRes.batches || []);
      setUnassignedStudents(unassignedRes.unassignedStudents || []);
      setStats(statsRes.stats || null);
    } catch (err) {
      setError(err.message || "Failed to load batch data for selected class");
    } finally {
      setLoading(false);
    }
  };

  // Quick Auto-Setup Submit Handler
  const handleQuickSetup = async (payload) => {
    try {
      const res = await quickSetupBatches(payload);
      setSuccess(res.message || "Batches auto-generated successfully");
      window.scrollTo({ top: 0, behavior: "smooth" });
      fetchClassBatchData();
    } catch (err) {
      throw err;
    }
  };

  // Custom Batch Create Handler
  const handleCreateBatch = async (payload) => {
    try {
      const res = await createBatch(payload);
      setSuccess(res.message || "Custom batch created successfully");
      window.scrollTo({ top: 0, behavior: "smooth" });
      fetchClassBatchData();
    } catch (err) {
      throw err;
    }
  };

  // Merged Batch Create Handler
  const handleCreateMergedBatch = async (payload) => {
    try {
      const res = await createMergedBatch(payload);
      setSuccess(res.message || "Merged batch created successfully");
      window.scrollTo({ top: 0, behavior: "smooth" });
      fetchClassBatchData();
    } catch (err) {
      throw err;
    }
  };

  // Delete Batch Handler
  const handleDeleteBatch = async (batch, force = false) => {
    if (!force) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete batch "${batch.name}"? This action cannot be undone.`
      );
      if (!confirmDelete) return;
    }

    try {
      await deleteBatch(batch._id, force);
      setSuccess(`Batch ${batch.name} deleted successfully`);
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      fetchClassBatchData();
    } catch (err) {
      if (err.hasSessions && !force) {
        const confirmForce = window.confirm(
          `${err.message}\n\nDo you want to proceed and force delete this batch?`
        );
        if (confirmForce) {
          return handleDeleteBatch(batch, true);
        }
      } else {
        setError(err.message || "Failed to delete batch");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleOpenEdit = (batch) => {
    setEditingBatch(batch);
    setIsEditOpen(true);
  };

  const filteredUnassignedList = useMemo(() => {
    const q = unassignedQuery.toLowerCase();
    return unassignedStudents.filter((student) => {
      const sName = student.userId?.name?.toLowerCase() || "";
      const roll = String(student.rollNo);
      return sName.includes(q) || roll.includes(q);
    });
  }, [unassignedStudents, unassignedQuery]);

  const selectedBranchObj = branches.find((b) => b._id === selectedBranch);

  return (
    <DashboardLayout title="Batch Management" sidebarItems={sidebarItems}>
      <div className="space-y-6">
        {/* Page Banner Header */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
              <Layers size={26} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Batch Management</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure practical & lab batches, auto-split classes, and manage merged labs
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsQuickSetupOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Auto-Setup</span>
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Plus size={16} />
              <span>Custom Batch</span>
            </button>

            <button
              onClick={() => setIsMergedOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <GitMerge size={16} />
              <span>Merged Batch</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700 font-bold text-xs">
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess("")} className="text-emerald-600 hover:text-emerald-800 font-bold text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Class Selection Controls Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 size={14} className="text-slate-400" /> Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <GraduationCap size={14} className="text-slate-400" /> Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer"
              >
                <option value={1}>1st Year (FE)</option>
                <option value={2}>2nd Year (SE)</option>
                <option value={3}>3rd Year (TE)</option>
                <option value={4}>4th Year (BE)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers size={14} className="text-slate-400" /> Division
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer"
              >
                {["A", "B", "C"].map((d) => (
                  <option key={d} value={d}>
                    Division {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" /> Academic Year
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer"
              >
                {getAcademicYearOptions().map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Class Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Users size={20} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
              <span className="text-lg font-black text-slate-900">{stats?.totalStudents || 0}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Batched</span>
              <span className="text-lg font-black text-emerald-600">{stats?.batchedStudents || 0}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <UserX size={20} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unassigned</span>
              <span className="text-lg font-black text-amber-600">{stats?.unassignedStudents || 0}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Batches</span>
              <span className="text-lg font-black text-purple-600">{stats?.totalBatches || 0}</span>
            </div>
          </div>
        </div>

        {/* Main Grid & Side Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Batches Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                <span>Active Class Batches ({batches.length})</span>
              </h2>

              <button
                onClick={fetchClassBatchData}
                disabled={loading}
                className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
                <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">Loading batch details...</p>
              </div>
            ) : batches.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Layers size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No Batches Configured</h3>
                <p className="text-xs text-slate-500 font-medium mb-4 max-w-sm mx-auto">
                  There are no batches created for {selectedBranchObj?.name || "this class"} (Year {selectedYear}, Div {selectedDivision}).
                </p>
                <button
                  onClick={() => setIsQuickSetupOpen(true)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>Execute Auto-Setup Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {batches.map((batch) => (
                  <BatchCard
                    key={batch._id}
                    batch={batch}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteBatch}
                    onViewStudents={(b) => navigate(`/admin/batches/${b._id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Unassigned Students Side Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserX size={18} className="text-amber-600" />
                <span>Unassigned Students ({unassignedStudents.length})</span>
              </h2>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter unassigned students..."
                  value={unassignedQuery}
                  onChange={(e) => setUnassignedQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100 border border-slate-200/80 rounded-xl bg-slate-50/50 custom-scrollbar">
                {filteredUnassignedList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-medium">
                    {unassignedStudents.length === 0
                      ? "All students in this class have been assigned to batches!"
                      : "No unassigned students match search filter."}
                  </div>
                ) : (
                  filteredUnassignedList.map((student) => (
                    <div key={student._id} className="p-3 flex items-center justify-between hover:bg-white transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          #{student.rollNo}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {student.userId?.name || "Student"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {student.userId?.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuickSetupModal
        isOpen={isQuickSetupOpen}
        onClose={() => setIsQuickSetupOpen(false)}
        classData={{
          branchId: selectedBranch,
          year: selectedYear,
          division: selectedDivision,
          academicYear,
        }}
        totalStudentsCount={stats?.totalStudents || 0}
        onSuccess={handleQuickSetup}
      />

      <CreateBatchModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        classData={{
          branchId: selectedBranch,
          year: selectedYear,
          division: selectedDivision,
          academicYear,
        }}
        availableStudents={unassignedStudents}
        onSuccess={handleCreateBatch}
      />

      <MergedBatchModal
        isOpen={isMergedOpen}
        onClose={() => setIsMergedOpen(false)}
        classData={{
          branchId: selectedBranch,
          year: selectedYear,
          division: selectedDivision,
          academicYear,
        }}
        existingBatches={batches}
        onSuccess={handleCreateMergedBatch}
      />

      <EditBatchModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingBatch(null);
        }}
        batch={editingBatch}
        unassignedStudents={unassignedStudents}
        allBatches={batches}
        onRefresh={fetchClassBatchData}
      />
    </DashboardLayout>
  );
}
