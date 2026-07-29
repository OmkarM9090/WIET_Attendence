import { Loader2 } from "lucide-react";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  fullWidth = false,
  loading = false,
  size = "md",
  className = "",
  icon = null,
}) {
  const sizeClasses = {
    sm: "px-3.5 py-1.5 text-xs font-bold rounded-lg min-h-[36px]",
    md: "px-5 py-2 text-xs sm:text-sm font-bold rounded-xl min-h-[40px]",
    lg: "px-6 py-2.5 text-sm sm:text-base font-bold rounded-xl min-h-[44px]",
  };

  const variantClasses = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:bg-blue-800 border border-blue-600",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 active:bg-slate-300",
    outline:
      "bg-transparent hover:bg-blue-50 text-blue-600 border border-blue-600/80 active:bg-blue-100/50",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20 active:bg-rose-800 border border-rose-600",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 active:bg-emerald-800 border border-emerald-600",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-700 active:bg-slate-200 border border-transparent",
  };

  const disabledClasses =
    "bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed shadow-none opacity-70";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/25 ${
        sizeClasses[size] || sizeClasses.md
      } ${
        disabled || loading
          ? disabledClasses
          : variantClasses[variant] || variantClasses.primary
      } ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin text-current shrink-0" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
