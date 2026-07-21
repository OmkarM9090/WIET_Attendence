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
    <div className="mb-6 rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-lg bg-red-100 p-2">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-red-900">Danger Zone: Bulk Delete</h2>
          <p className="mt-1 text-sm text-red-700">
            These actions permanently delete students and related records. Review the exact count in the confirmation modal before continuing.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-red-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
          <Trash2 className="h-4 w-4" />
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

      <div className="mt-4 rounded-xl border border-red-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
          <Layers className="h-4 w-4" />
          Delete by Year + Division
        </h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-base focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
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
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-base focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
          >
            <option value="">-- Select Division --</option>
            {DIVISIONS.map((division) => (
              <option key={division} value={division}>Division {division}</option>
            ))}
          </select>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-base focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
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
          <p className="mt-3 text-sm text-slate-600">
            Preview estimate: up to <span className="font-bold text-red-600">{advancedCount}</span> students from {YEAR_LABELS[selectedYear].code}-{selectedDivision}. Exact branch-filtered count appears before deletion.
          </p>
        )}

        <button
          type="button"
          onClick={handleAdvancedDeleteClick}
          disabled={!selectedYear || !selectedDivision || previewLoading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete Selected
        </button>
      </div>

      <div className="mt-4 rounded-xl border-2 border-red-500 bg-red-100 p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-red-900">
          <Skull className="h-5 w-5" />
          Nuclear Option
        </h3>
        <button
          type="button"
          onClick={handleDeleteAllClick}
          disabled={counts.total === 0 || previewLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-red-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-slate-400 md:w-auto"
        >
          {previewLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
          DELETE ALL STUDENTS ({counts.total || 0})
        </button>
        <p className="mt-2 text-xs italic text-red-700">
          This deletes every student and related records. Cannot be undone.
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