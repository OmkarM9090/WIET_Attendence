export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  error,
  helperText,
  className = "",
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full max-w-full overflow-hidden text-ellipsis rounded-xl border ${
            error
              ? "border-rose-400 focus:border-rose-600 focus:ring-rose-500/20"
              : "border-slate-200 focus:border-blue-600 focus:ring-blue-500/20"
          } px-4 py-2.5 text-sm text-slate-900 bg-white transition-all duration-200 focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed min-h-[44px] shadow-xs ${className}`}
          {...props}
        >
          {options.map((option, idx) => (
            <option key={option.value || idx} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500 font-medium">{helperText}</p>
      )}
    </div>
  );
}
