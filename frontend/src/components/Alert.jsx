import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export default function Alert({ message, type = "error", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styleMap = {
    error: {
      bg: "bg-rose-50 border-rose-200 text-rose-800",
      icon: <AlertCircle className="text-rose-600 shrink-0" size={18} />,
    },
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      icon: <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />,
    },
    warning: {
      bg: "bg-amber-50 border-amber-200 text-amber-800",
      icon: <AlertTriangle className="text-amber-600 shrink-0" size={18} />,
    },
    info: {
      bg: "bg-blue-50 border-blue-200 text-blue-800",
      icon: <Info className="text-blue-600 shrink-0" size={18} />,
    },
  };

  const currentStyle = styleMap[type] || styleMap.error;

  return (
    <div className={`flex items-center justify-between rounded-xl border p-4 shadow-xs transition-all duration-200 ${currentStyle.bg}`}>
      <div className="flex items-center gap-3">
        {currentStyle.icon}
        <p className="text-sm font-semibold">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
