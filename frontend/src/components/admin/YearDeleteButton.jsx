import { Trash2 } from "lucide-react";

export default function YearDeleteButton({ yearCode, count = 0, onClick }) {
  const disabled = count === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? `No ${yearCode} students to delete` : `Delete ${yearCode} students`}
      className="min-w-[140px] rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 shadow-xs transition-all duration-200 hover:border-rose-400 hover:bg-rose-50/80 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rose-200 disabled:hover:bg-white"
    >
      <span className="flex items-center justify-center gap-2 whitespace-nowrap">
        <Trash2 className="h-4 w-4" />
        Delete {yearCode}
      </span>
      <span className="mt-1 block text-xs font-medium text-slate-500">
        ({count} students)
      </span>
    </button>
  );
}