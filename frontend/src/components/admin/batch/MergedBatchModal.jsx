import React, { useState, useEffect } from "react";
import { X, GitMerge, AlertCircle, RefreshCw, CheckSquare, Square } from "lucide-react";

export default function MergedBatchModal({ isOpen, onClose, classData, existingBatches = [], onSuccess }) {
  const [name, setName] = useState("BA3-BB1");
  const [selectedSourceBatchIds, setSelectedSourceBatchIds] = useState([]);
  const [labRoom, setLabRoom] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existingBatches.length >= 2) {
      const defaultSources = [existingBatches[0]._id, existingBatches[1]._id];
      setSelectedSourceBatchIds(defaultSources);
      setName(`${existingBatches[0].name}-${existingBatches[1].name}`);
    }
  }, [existingBatches]);

  if (!isOpen) return null;

  const handleToggleSourceBatch = (bId) => {
    let updated;
    if (selectedSourceBatchIds.includes(bId)) {
      updated = selectedSourceBatchIds.filter((id) => id !== bId);
    } else {
      updated = [...selectedSourceBatchIds, bId];
    }
    setSelectedSourceBatchIds(updated);

    // Auto update suggested name
    const selectedNames = existingBatches
      .filter((b) => updated.includes(b._id))
      .map((b) => b.name);
    if (selectedNames.length > 0) {
      setName(selectedNames.join("-"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Merged batch name is required");
      return;
    }

    if (selectedSourceBatchIds.length < 2) {
      setError("At least 2 source batches must be selected to create a merged batch");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        displayName: `Merged Batch ${name.trim()}`,
        sourceBatchIds: selectedSourceBatchIds,
        labRoom: labRoom.trim(),
        description: description.trim() || `Merged from ${selectedSourceBatchIds.length} batches`,
      };

      await onSuccess(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create merged batch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <GitMerge size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create Merged Batch</h2>
              <p className="text-xs text-slate-500 font-medium">
                Combine students from multiple regular batches for combined practicals
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 font-medium">
              <AlertCircle size={18} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Merged Batch Name *
            </label>
            <input
              type="text"
              placeholder="e.g. BA3-BB1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-purple-600 outline-none"
              required
            />
          </div>

          {/* Source Batches Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Source Batches (At least 2 required)
            </label>

            <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200/80 rounded-2xl bg-slate-50/50 p-2 custom-scrollbar">
              {existingBatches.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500 font-medium">
                  No existing batches available to merge.
                </div>
              ) : (
                existingBatches.map((batch) => {
                  const isSelected = selectedSourceBatchIds.includes(batch._id);
                  return (
                    <div
                      key={batch._id}
                      onClick={() => handleToggleSourceBatch(batch._id)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-purple-50 border border-purple-300 text-purple-950 font-bold"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected ? (
                          <CheckSquare size={16} className="text-purple-600 shrink-0" />
                        ) : (
                          <Square size={16} className="text-slate-400 shrink-0" />
                        )}
                        <span className="font-bold text-xs">{batch.displayName || batch.name}</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          (Div {batch.division} • {batch.studentCount || 0} students)
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Lab Room (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lab-401"
                value={labRoom}
                onChange={(e) => setLabRoom(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="Merging rationale"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
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
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Merging...</span>
                </>
              ) : (
                <>
                  <GitMerge size={16} />
                  <span>Create Merged Batch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
