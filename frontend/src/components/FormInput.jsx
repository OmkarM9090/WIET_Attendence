export default function FormInput({
  label,
  name,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  min,
  max,
  error,
  helperText,
  icon,
  className = "",
  style = {},
  ...props
}) {
  const inputId = id || (name ? `input-${name}` : (label ? `input-${String(label).toLowerCase().replace(/\s+/g, '-')}` : undefined));

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          className={`w-full rounded-xl border ${
            error
              ? "border-rose-400 focus:border-rose-600 focus:ring-rose-500/20"
              : "border-slate-200 focus:border-blue-600 focus:ring-blue-500/20"
          } ${
            icon ? "pl-10" : "px-4"
          } py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed min-h-[44px] shadow-xs ${className}`}
          style={style}
          {...props}
        />
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
