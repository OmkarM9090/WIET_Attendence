import React, { useState, useEffect } from "react";
import { X, Edit2, Users, UserPlus, Trash2, ArrowRightLeft, AlertCircle, RefreshCw, CheckSquare, Square, Search, Check } from "lucide-react";
import { addStudentsToBatch, removeStudentFromBatch, updateBatch, moveBatchStudents } from "../../../services/adminBatchService";

export default function EditBatchModal({
  isOpen,
  onClose,
  batch,
  unassignedStudents = [],
  allBatches = [],
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'students' | 'add'
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [labRoom, setLabRoom] = useState("");
  const [description, setDescription] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddIds, setSelectedAddIds] = useState([]);
  const [targetMoveBatchId, setTargetMoveBatchId] = useState("");
  const [selectedMoveStudentId, setSelectedMoveStudentId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (batch) {
      setName(batch.name || "");
      setDisplayName(batch.displayName || "");
      setLabRoom(batch.labRoom || "");
      setDescription(batch.description || "");
      setMaxCapacity(batch.maxCapacity || "");
      setError("");
      setSuccessMsg("");
    }
  }, [batch]);

  if (!isOpen || !batch) return null;

  const currentStudents = batch.students || [];

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await updateBatch(batch._id, {
        name: name.trim(),
        displayName: displayName.trim(),
        labRoom: labRoom.trim(),
        description: description.trim(),
        maxCapacity: maxCapacity ? Number(maxCapacity) : undefined,
      });

      setSuccessMsg("Batch details updated successfully");
      await onRefresh();
    } catch (err) {
      setError(err.message || "Failed to update batch info");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await removeStudentFromBatch(batch._id, studentId);
      setSuccessMsg("Student removed from batch");
      await onRefresh();
    } catch (err) {
      setError(err.message || "Failed to remove student");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudents = async () => {
    if (selectedAddIds.length === 0) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await addStudentsToBatch(batch._id, selectedAddIds);
      setSelectedAddIds([]);
      setSuccessMsg(`Added ${selectedAddIds.length} students to batch`);
      await onRefresh();
    } catch (err) {
      setError(err.message || "Failed to add students");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStudent = async () => {
    if (!selectedMoveStudentId || !targetMoveBatchId) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await moveBatchStudents(batch._id, targetMoveBatchId, [selectedMoveStudentId]);
      setSelectedMoveStudentId(null);
      setTargetMoveBatchId("");
      setSuccessMsg("Student moved successfully");
      await onRefresh();
    } catch (err) {
      setError(err.message || "Failed to move student");
    } finally {
      setLoading(false);
    }
  };

  const filteredUnassigned = unassignedStudents.filter((student) => {
    const q = searchQuery.toLowerCase();
    const sName = student.userId?.name?.toLowerCase() || "";
    const roll = String(student.rollNo);
    return sName.includes(q) || roll.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm">
              {batch.name}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Edit {batch.displayName || batch.name}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {currentStudents.length} Students Enrolled • Lab: {batch.labRoom || "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-100 bg-slate-50/50">
          {[
            { id: "info", label: "Batch Info", icon: Edit2 },
            { id: "students", label: `Current Students (${currentStudents.length})`, icon: Users },
            { id: "add", label: `Add Students (${unassignedStudents.length})`, icon: UserPlus },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  active
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-semibold">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: BATCH INFO */}
          {activeTab === "info" && (
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Batch Code Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Lab Room</label>
                  <input
                    type="text"
                    value={labRoom}
                    onChange={(e) => setLabRoom(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Max Capacity</label>
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Description</label>
                <textarea
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Edit2 size={14} />}
                  <span>Save Info Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CURRENT STUDENTS */}
          {activeTab === "students" && (
            <div className="space-y-4">
              {/* Move Student Drawer/Row if selected */}
              {selectedMoveStudentId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <span className="text-blue-900 font-bold flex items-center gap-1.5">
                    <ArrowRightLeft size={14} /> Move student to:
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={targetMoveBatchId}
                      onChange={(e) => setTargetMoveBatchId(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-medium"
                    >
                      <option value="">Select target batch...</option>
                      {allBatches
                        .filter((b) => b._id !== batch._id)
                        .map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.displayName || b.name}
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={handleMoveStudent}
                      disabled={!targetMoveBatchId || loading}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      Confirm Move
                    </button>
                    <button
                      onClick={() => setSelectedMoveStudentId(null)}
                      className="text-slate-500 hover:text-slate-800 px-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                {currentStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-medium">
                    No students currently assigned to this batch.
                  </div>
                ) : (
                  currentStudents.map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          Roll #{student.rollNo}
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

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedMoveStudentId(student._id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="Move to another batch"
                        >
                          <ArrowRightLeft size={13} /> Move
                        </button>
                        <button
                          onClick={() => handleRemoveStudent(student._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Remove from batch"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ADD UNASSIGNED STUDENTS */}
          {activeTab === "add" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                  Select unassigned students ({selectedAddIds.length} selected)
                </span>

                {selectedAddIds.length > 0 && (
                  <button
                    onClick={handleAddStudents}
                    disabled={loading}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    <span>Add Selected Students</span>
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white max-h-60 overflow-y-auto custom-scrollbar shadow-2xs">
                {filteredUnassigned.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-medium">
                    No unassigned students available for this class.
                  </div>
                ) : (
                  filteredUnassigned.map((student) => {
                    const isSelected = selectedAddIds.includes(student._id);
                    return (
                      <div
                        key={student._id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAddIds(selectedAddIds.filter((id) => id !== student._id));
                          } else {
                            setSelectedAddIds([...selectedAddIds, student._id]);
                          }
                        }}
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50/80 text-blue-950 font-semibold" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <CheckSquare size={16} className="text-blue-600 shrink-0" />
                          ) : (
                            <Square size={16} className="text-slate-400 shrink-0" />
                          )}
                          <span className="font-mono text-xs font-bold text-slate-500">
                            Roll #{student.rollNo}
                          </span>
                          <span className="text-xs font-bold">{student.userId?.name || "Student"}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">{student.userId?.email}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
