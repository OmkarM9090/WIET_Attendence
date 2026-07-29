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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-100 p-2 text-emerald-600 border border-emerald-200/80">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Bulk Deletion Complete</h2>
              <p className="text-xs text-slate-500 font-medium">Database cleanup finished successfully.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{summary?.studentsDeleted || 0}</p>
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide">students permanently deleted</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {resultItems.slice(1).map(([key, label]) => (
              <div key={key} className="rounded-xl border border-slate-200/80 p-3 bg-white shadow-xs">
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                  <Database className="h-3.5 w-3.5 text-slate-400" />
                  {label}
                </span>
                <span className="mt-1 block text-lg font-extrabold text-slate-900">{summary?.[key] || 0}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 font-mono">
            Completed in {summary?.timeTakenMs || 0} ms.
          </p>
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}