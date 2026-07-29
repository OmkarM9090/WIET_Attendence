import { AlertTriangle, Info } from "lucide-react";
import Button from "./Button";

export default function EditAttendanceModal({
  isOpen,
  onClose,
  onEdit,
  isLoading,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-200">
        {/* Modal Header */}
        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80">
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Edit Attendance
          </h3>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5">
          <p className="mb-3 text-sm text-slate-700 leading-relaxed font-medium">
            Attendance has already been marked for this session and date.
          </p>

          <p className="mb-5 text-sm text-slate-600 leading-relaxed">
            You can update the list of absent students and generate a new report.
          </p>

          {/* Information Box */}
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-3.5 flex gap-3 items-start">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 leading-relaxed font-medium">
              <strong>Note:</strong> Your updated selection will replace the existing record and regenerate the WhatsApp report.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={onEdit}
            loading={isLoading}
          >
            Edit Attendance
          </Button>
        </div>
      </div>
    </div>
  );
}
