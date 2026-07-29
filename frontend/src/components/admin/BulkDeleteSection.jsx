import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Layers, Loader2, Skull, Trash2 } from "lucide-react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import DeleteResultModal from "./DeleteResultModal";
import YearDeleteButton from "./YearDeleteButton";
import {
  bulkDeleteStudents,
  getStudentCounts,
  previewBulkDelete,
} from "../../services/adminService";

const YEAR_LABELS = {
  1: { code: "FE", name: "First Year" },
  2: { code: "SE", name: "Second Year" },
  3: { code: "TE", name: "Third Year" },
  4: { code: "BE", name: "Fourth Year" },
};

const DIVISIONS = ["A", "B", "C"];

export default function BulkDeleteSection({ branches = [], onDeleteComplete, onError, onSuccess }) {
  const [counts, setCounts] = useState({ total: 0, byYear: {}, byYearDivision: {} });
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [previewData, setPreviewData] = useState(null);
  const [deleteInfo, setDeleteInfo] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadCounts = useCallback(async () => {
    try {
      setLoadingCounts(true);
      const response = await getStudentCounts();
      setCounts(response.counts || { total: 0, byYear: {}, byYearDivision: {} });
    } catch (error) {
      onError?.(error.message || "Failed to load student counts");
    } finally {
      setLoadingCounts(false);
    }
  }, [onError]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const selectedBranchLabel = useMemo(() => {
    if (!selectedBranch || selectedBranch === "all") return "All Branches";
    const branch = branches.find((item) => item._id === selectedBranch);
    return branch ? `${branch.code} - ${branch.name}` : "Selected Branch";
  }, [branches, selectedBranch]);

  const advancedCount = selectedYear && selectedDivision
    ? counts.byYearDivision?.[`${selectedYear}-${selectedDivision}`] || 0
    : 0;

  const openPreview = async (info) => {
    try {
      setPreviewLoading(true);
      const response = await previewBulkDelete(info.params);
      setDeleteInfo(info);
      setPreviewData(response.preview);
      setShowConfirmModal(true);
    } catch (error) {
      onError?.(error.message || "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleYearDeleteClick = (year) => {
    const count = counts.byYear?.[year] || 0;
    if (count === 0) {
      onError?.(`No students found in ${YEAR_LABELS[year].name}`);
      return;
    }

    openPreview({
      type: "year",
      label: `${YEAR_LABELS[year].name} (${YEAR_LABELS[year].code})`,
      params: { deleteType: "year", year },
    });
  };

  const handleAdvancedDeleteClick = () => {
    if (!selectedYear || !selectedDivision) {
      onError?.("Please select year and division first");
      return;
    }

    openPreview({
      type: "year-division",
      label: `${YEAR_LABELS[selectedYear].code}-${selectedDivision} ${selectedBranchLabel}`,
      params: {
        deleteType: "year-division",
        year: selectedYear,
        division: selectedDivision,
        branchId: selectedBranch || "all",
      },
    });
  };

  const handleDeleteAllClick = () => {
    if (counts.total === 0) {
      onError?.("No students to delete");
      return;
    }

    openPreview({
      type: "all",
      label: "ALL STUDENTS",
      params: { deleteType: "all" },
    });
  };

  const handleConfirmDelete = async (confirmation) => {
    if (!deleteInfo) return;

    try {
      setDeleteLoading(true);
      const response = await bulkDeleteStudents({
        ...deleteInfo.params,
        confirmation,
      });

      setResultData(response.summary);
      setShowConfirmModal(false);
      setShowResultModal(true);
      onSuccess?.(response.message || "Bulk deletion completed successfully");
      await loadCounts();
      await onDeleteComplete?.();
    } catch (error) {
      onError?.(error.message || "Bulk deletion failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/40 p-6 shadow-xs md:p-8">
      <div className="mb-6 flex items-start gap-3.5">
        <div className="rounded-xl bg-rose-100 p-2.5 text-rose-600 border border-rose-200/80">
          <AlertTriangle className="h-6 w-6 stroke-[2]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-rose-950">Danger Zone: Bulk Deletion</h2>
          <p className="mt-1 text-xs sm:text-sm text-rose-800 font-medium">
            These actions permanently remove students and related logs. Confirm student counts before proceeding.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-rose-200/80 bg-white p-5 shadow-xs">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Trash2 className="h-4 w-4 text-rose-600" />
          Delete by Year
          {loadingCounts && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </h3>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4].map((year) => (
            <YearDeleteButton
              key={year}
              yearCode={YEAR_LABELS[year].code}
              count={counts.byYear?.[year] || 0}
              onClick={() => handleYearDeleteClick(year)}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-rose-200/80 bg-white p-5 shadow-xs">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Layers className="h-4 w-4 text-rose-600" />
          Delete by Year + Division
        </h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="">-- Select Year --</option>
            {[1, 2, 3, 4].map((year) => (
              <option key={year} value={year}>
                {YEAR_LABELS[year].code} - {YEAR_LABELS[year].name}
              </option>
            ))}
          </select>

          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="">-- Select Division --</option>
            {DIVISIONS.map((division) => (
              <option key={division} value={division}>Division {division}</option>
            ))}
          </select>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="all">All Branches</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.code} - {branch.name}
              </option>
            ))}
          </select>
        </div>

        {selectedYear && selectedDivision && (
          <p className="mt-3 text-xs text-slate-600 font-medium">
            Preview estimate: up to <span className="font-bold text-rose-600">{advancedCount}</span> students from {YEAR_LABELS[selectedYear].code}-{selectedDivision}.
          </p>
        )}

        <button
          type="button"
          onClick={handleAdvancedDeleteClick}
          disabled={!selectedYear || !selectedDivision || previewLoading}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete Selected
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-rose-300 bg-rose-100/70 p-5 shadow-xs">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-950">
          <Skull className="h-5 w-5 text-rose-700" />
          Nuclear Option
        </h3>
        <button
          type="button"
          onClick={handleDeleteAllClick}
          disabled={counts.total === 0 || previewLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-rose-600 px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-rose-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 md:w-auto"
        >
          {previewLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
          DELETE ALL STUDENTS ({counts.total || 0})
        </button>
        <p className="mt-2 text-xs italic text-rose-800 font-medium">
          This deletes every student record. Action cannot be undone.
        </p>
      </div>

      {showConfirmModal && (
        <DeleteConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmDelete}
          deleteInfo={deleteInfo}
          previewData={previewData}
          loading={deleteLoading}
        />
      )}

      {showResultModal && (
        <DeleteResultModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          summary={resultData}
        />
      )}
    </div>
  );
}