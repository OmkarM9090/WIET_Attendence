export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  fullWidth = false,
  loading = false,
}) {
  const baseClasses = "px-6 py-2 rounded-lg font-medium transition-colors text-sm";
  const widthClass = fullWidth ? "w-full" : "";

  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed",
    danger:
      "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${widthClass} ${variantClasses[variant]}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
