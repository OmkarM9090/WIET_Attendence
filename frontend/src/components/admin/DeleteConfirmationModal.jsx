import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, deleteInfo, previewData, loading }) {
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [understandsPermanent, setUnderstandsPermanent] = useState(false);
  const [understandsCascade, setUnderstandsCascade] = useState(false);

  const canDelete = typedConfirmation === "DELETE" && understandsPermanent && understandsCascade && !loading;

  if (!isOpen) return null;

  const sampleStudents = previewData?.sampleStudents || [];
  const count = previewData?.count || 0;

  const safeClose = () => {
    if (!loading) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={safeClose} aria-hidden="true" />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-red-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-red-100 p-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-red-950">Confirm Bulk Deletion</h2>
              <p className="text-sm text-red-700">This action cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={safeClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">You are about to permanently delete:</p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {count} students
            </p>
            <p className="text-sm text-red-800">{previewData?.label || deleteInfo?.label}</p>

            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-red-950 sm:grid-cols-2">
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <span className="block text-xs font-semibold uppercase text-red-500">User accounts</span>
                <span className="text-lg font-bold">{previewData?.usersCount || 0}</span>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <span className="block text-xs font-semibold uppercase text-red-500">Attendance sessions</span>
                <span className="text-lg font-bold">{previewData?.attendanceSessionsCount || 0}</span>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <span className="block text-xs font-semibold uppercase text-red-500">Defaulter records</span>
                <span className="text-lg font-bold">{previewData?.defaulterRecordsCount || 0}</span>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <span className="block text-xs font-semibold uppercase text-red-500">Defaulter entries</span>
                <span className="text-lg font-bold">{previewData?.defaulterEntriesCount || 0}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-800">Sample of students to be deleted</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {sampleStudents.length > 0 ? (
                sampleStudents.map((student) => (
                  <div key={student.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <span className="font-semibold text-slate-900">{student.name}</span>
                    <span className="text-slate-500"> Roll: {student.rollNo}, {student.year}-{student.division} {student.branch?.code || ""}</span>
                  </div>
                ))
              ) : (
                <p>No matching students found.</p>
              )}
              {previewData?.remainingAfterSample > 0 && (
                <p className="text-xs font-semibold text-slate-500">
                  and {previewData.remainingAfterSample} more students
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-red-200 p-4">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={understandsPermanent}
                onChange={(e) => setUnderstandsPermanent(e.target.checked)}
                disabled={loading}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              I understand these students cannot be restored from this action.
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={understandsCascade}
                onChange={(e) => setUnderstandsCascade(e.target.checked)}
                disabled={loading}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              I understand related user accounts, attendance data, and defaulter data will also be deleted.
            </label>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Type DELETE to confirm
              </label>
              <input
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-base focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                placeholder="DELETE"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={safeClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm("DELETE")}
            disabled={!canDelete}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Permanently Delete {count} Students
          </button>
        </div>
      </div>
    </div>
  );
}