import React, { useState } from "react";
import { X, Sparkles, AlertCircle, RefreshCw, Layers } from "lucide-react";

export default function QuickSetupModal({ isOpen, onClose, classData, totalStudentsCount, onSuccess }) {
  const [splitMethod, setSplitMethod] = useState("equal"); // 'equal' | 'fixed' | 'custom'
  const [batchCount, setBatchCount] = useState(3);
  const [studentsPerBatch, setStudentsPerBatch] = useState(25);
  const [namingPattern, setNamingPattern] = useState("auto");
  const [labRoom, setLabRoom] = useState("");
  const [customRanges, setCustomRanges] = useState([
    { name: "BA1", from: 1, to: 20 },
    { name: "BA2", from: 21, to: 40 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAddCustomRange = () => {
    const lastTo = customRanges.length > 0 ? Number(customRanges[customRanges.length - 1].to) : 0;
    setCustomRanges([
      ...customRanges,
      {
        name: `B${classData.division}${customRanges.length + 1}`,
        from: lastTo + 1,
        to: lastTo + 20,
      },
    ]);
  };

  const handleRemoveCustomRange = (index) => {
    setCustomRanges(customRanges.filter((_, i) => i !== index));
  };

  const handleCustomRangeChange = (index, field, value) => {
    const updated = [...customRanges];
    updated[index][field] = value;
    setCustomRanges(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        branchId: classData.branchId,
        year: Number(classData.year),
        division: classData.division,
        academicYear: classData.academicYear,
        splitMethod,
        batchCount: Number(batchCount),
        studentsPerBatch: Number(studentsPerBatch),
        customRanges,
        namingPattern,
        labRoom,
      };

      await onSuccess(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to execute quick setup");
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
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Quick Auto-Setup Batches</h2>
              <p className="text-xs text-slate-500 font-medium">
                Division {classData.division} • Total Active Students: <span className="font-bold text-blue-600">{totalStudentsCount}</span>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 font-medium">
              <AlertCircle size={18} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Split Method Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Split Method
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "equal", label: "Equal Batches", desc: "Divide equally into N batches" },
                { id: "fixed", label: "Fixed Size", desc: "X students per batch" },
                { id: "custom", label: "Custom Ranges", desc: "Specify roll number ranges" },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSplitMethod(method.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    splitMethod === method.id
                      ? "bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="block text-sm font-bold">{method.label}</span>
                  <span className="block text-[11px] font-medium opacity-80 mt-0.5">{method.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Method Parameters */}
          {splitMethod === "equal" && (
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Number of Batches
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={batchCount}
                onChange={(e) => setBatchCount(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
                required
              />
              <p className="text-xs text-slate-500 font-medium">
                Estimated ~{Math.ceil(totalStudentsCount / (batchCount || 1))} students per batch
              </p>
            </div>
          )}

          {splitMethod === "fixed" && (
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Students Per Batch
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={studentsPerBatch}
                onChange={(e) => setStudentsPerBatch(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
                required
              />
              <p className="text-xs text-slate-500 font-medium">
                Will create ~{Math.ceil(totalStudentsCount / (studentsPerBatch || 1))} batches
              </p>
            </div>
          )}

          {splitMethod === "custom" && (
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Define Roll Number Ranges</span>
                <button
                  type="button"
                  onClick={handleAddCustomRange}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  + Add Range
                </button>
              </div>

              {customRanges.map((range, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={range.name}
                    onChange={(e) => handleCustomRangeChange(index, "name", e.target.value)}
                    className="w-24 bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs font-medium"
                  />
                  <input
                    type="number"
                    placeholder="From Roll"
                    value={range.from}
                    onChange={(e) => handleCustomRangeChange(index, "from", e.target.value)}
                    className="w-28 bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs font-medium"
                  />
                  <span className="text-slate-500 text-xs font-semibold">to</span>
                  <input
                    type="number"
                    placeholder="To Roll"
                    value={range.to}
                    onChange={(e) => handleCustomRangeChange(index, "to", e.target.value)}
                    className="w-28 bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs font-medium"
                  />
                  {customRanges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomRange(index)}
                      className="text-rose-500 hover:text-rose-700 text-xs p-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Optional Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Naming Pattern
              </label>
              <select
                value={namingPattern}
                onChange={(e) => setNamingPattern(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="auto">Auto (B{classData.division}1, B{classData.division}2...)</option>
                <option value="custom">Batch 1, Batch 2...</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Default Lab Room (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lab-201"
                value={labRoom}
                onChange={(e) => setLabRoom(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              />
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
                  <span>Creating Batches...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Execute Auto-Setup</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
