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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={safeClose} aria-hidden="true" />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-rose-100 p-2 text-rose-600 border border-rose-200/80">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-rose-950">Confirm Bulk Deletion</h2>
              <p className="text-xs text-rose-700 font-medium">This action cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={safeClose}
            disabled={loading}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 custom-scrollbar">
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-900">You are about to permanently delete:</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-rose-700">
              {count} students
            </p>
            <p className="text-xs text-rose-800 font-semibold mt-1">{previewData?.label || deleteInfo?.label}</p>

            <div className="mt-4 grid grid-cols-1 gap-2.5 text-xs text-rose-950 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-3 border border-rose-100 shadow-xs">
                <span className="block text-[10px] font-bold uppercase text-rose-500">User accounts</span>
                <span className="text-base font-extrabold text-slate-900">{previewData?.usersCount || 0}</span>
              </div>
              <div className="rounded-xl bg-white p-3 border border-rose-100 shadow-xs">
                <span className="block text-[10px] font-bold uppercase text-rose-500">Attendance sessions</span>
                <span className="text-base font-extrabold text-slate-900">{previewData?.attendanceSessionsCount || 0}</span>
              </div>
              <div className="rounded-xl bg-white p-3 border border-rose-100 shadow-xs">
                <span className="block text-[10px] font-bold uppercase text-rose-500">Defaulter records</span>
                <span className="text-base font-extrabold text-slate-900">{previewData?.defaulterRecordsCount || 0}</span>
              </div>
              <div className="rounded-xl bg-white p-3 border border-rose-100 shadow-xs">
                <span className="block text-[10px] font-bold uppercase text-rose-500">Defaulter entries</span>
                <span className="text-base font-extrabold text-slate-900">{previewData?.defaulterEntriesCount || 0}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Sample of students to be deleted</h3>
            <div className="mt-3 space-y-2 text-xs text-slate-700">
              {sampleStudents.length > 0 ? (
                sampleStudents.map((student) => (
                  <div key={student.id} className="rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                    <span className="font-bold text-slate-900">{student.name}</span>
                    <span className="text-slate-500 font-medium"> • Roll: {student.rollNo}, {student.year}-{student.division} {student.branch?.code || ""}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No matching students found.</p>
              )}
              {previewData?.remainingAfterSample > 0 && (
                <p className="text-xs font-semibold text-slate-500 pt-1">
                  and {previewData.remainingAfterSample} more students
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-rose-200/80 p-4 bg-white">
            <label className="flex items-start gap-3 text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={understandsPermanent}
                onChange={(e) => setUnderstandsPermanent(e.target.checked)}
                disabled={loading}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              I understand these students cannot be restored from this action.
            </label>
            <label className="flex items-start gap-3 text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={understandsCascade}
                onChange={(e) => setUnderstandsCascade(e.target.checked)}
                disabled={loading}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              I understand related user accounts, attendance data, and defaulter data will also be deleted.
            </label>
            <div className="pt-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-800">
                Type DELETE to confirm
              </label>
              <input
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-xs"
                placeholder="DELETE"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={safeClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm("DELETE")}
            disabled={!canDelete}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Permanently Delete {count} Students
          </button>
        </div>
      </div>
    </div>
  );
}