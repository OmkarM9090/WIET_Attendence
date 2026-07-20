export default function Card({ title, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-100/80 bg-white p-5 sm:p-6 shadow-sm hover:shadow transition-shadow ${className}`}>
      {title && <h2 className="mb-4 text-lg font-bold text-slate-800 tracking-tight">{title}</h2>}
      {children}
    </div>
  );
}
