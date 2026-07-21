import { Trash2 } from "lucide-react";

export default function YearDeleteButton({ yearCode, count = 0, onClick }) {
  const disabled = count === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? `No ${yearCode} students to delete` : `Delete ${yearCode} students`}
      className="min-w-[140px] rounded-lg border-2 border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition-all hover:border-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-red-300 disabled:hover:bg-white"
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