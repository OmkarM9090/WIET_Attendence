import { CheckCircle2, Database, Users, X } from "lucide-react";

const resultItems = [
  ["studentsDeleted", "Students deleted"],
  ["usersDeleted", "User accounts deleted"],
  ["attendanceSessionsDeleted", "Attendance sessions deleted"],
  ["batchesAffected", "Batches cleaned"],
  ["defaulterRecordsAffected", "Defaulter records updated"],
  ["defaulterRecordsDeleted", "Empty defaulter records deleted"],
  ["defaulterEntriesDeleted", "Defaulter entries deleted"],
];

export default function DeleteResultModal({ isOpen, onClose, summary }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-emerald-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Bulk Deletion Complete</h2>
              <p className="text-sm text-slate-600">Database cleanup finished successfully.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-emerald-700">{summary?.studentsDeleted || 0}</p>
                <p className="text-sm font-semibold text-emerald-900">students permanently deleted</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {resultItems.slice(1).map(([key, label]) => (
              <div key={key} className="rounded-lg border border-slate-200 p-3">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <Database className="h-3.5 w-3.5" />
                  {label}
                </span>
                <span className="mt-1 block text-xl font-bold text-slate-900">{summary?.[key] || 0}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            Completed in {summary?.timeTakenMs || 0} ms.
          </p>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}