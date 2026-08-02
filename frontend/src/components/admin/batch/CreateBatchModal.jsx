import React, { useState } from "react";
import { X, Plus, Search, CheckSquare, Square, AlertCircle, RefreshCw } from "lucide-react";

export default function CreateBatchModal({ isOpen, onClose, classData, availableStudents = [], onSuccess }) {
  const [name, setName] = useState("");
  const [labRoom, setLabRoom] = useState("");
  const [description, setDescription] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const filteredStudents = availableStudents.filter((student) => {
    const query = searchQuery.toLowerCase();
    const studentName = student.userId?.name?.toLowerCase() || "";
    const rollNo = String(student.rollNo);
    return studentName.includes(query) || rollNo.includes(query);
  });

  const handleToggleStudent = (id) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sId) => sId !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s._id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Batch name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        displayName: `Batch ${name.trim()}`,
        branchId: classData.branchId,
        year: Number(classData.year),
        division: classData.division,
        academicYear: classData.academicYear,
        studentIds: selectedStudentIds,
        labRoom: labRoom.trim(),
        description: description.trim(),
        maxCapacity: maxCapacity ? Number(maxCapacity) : undefined,
      };

      await onSuccess(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create custom batch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create Custom Batch</h2>
              <p className="text-xs text-slate-500 font-medium">
                Division {classData.division} • Select unassigned students
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 font-medium">
              <AlertCircle size={18} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Batch Name *
              </label>
              <input
                type="text"
                placeholder="e.g. BA4, Special_Lab_1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Lab Room
              </label>
              <input
                type="text"
                placeholder="e.g. Lab-301"
                value={labRoom}
                onChange={(e) => setLabRoom(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Max Capacity (Optional)
              </label>
              <input
                type="number"
                placeholder="e.g. 25"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="Short batch description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Student Selection Section */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Students ({selectedStudentIds.length} Selected)
              </span>

              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0
                  ? "Deselect All"
                  : "Select All Filtered"}
              </button>
            </div>

            {/* Search filter */}
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search student by name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            {/* Student List */}
            <div className="max-h-48 overflow-y-auto border border-slate-200/80 rounded-2xl bg-slate-50/50 divide-y divide-slate-100 custom-scrollbar">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-medium">
                  No unassigned students found matching search criteria.
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student._id);
                  return (
                    <div
                      key={student._id}
                      onClick={() => handleToggleStudent(student._id)}
                      className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/80 text-blue-950 font-semibold" : "hover:bg-slate-100/60 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected ? (
                          <CheckSquare size={16} className="text-blue-600 shrink-0" />
                        ) : (
                          <Square size={16} className="text-slate-400 shrink-0" />
                        )}
                        <span className="font-mono text-xs text-slate-500 font-bold">
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

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Create Batch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
