import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className={`relative w-full ${sizeClasses[size] || sizeClasses.md} rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-200 scale-100`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar text-slate-800">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
