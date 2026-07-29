export default function Card({ title, subtitle, children, className = "", headerAction = null }) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
