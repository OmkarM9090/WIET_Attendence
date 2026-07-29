import { Link, useLocation } from "react-router-dom";
import { X, GraduationCap, ChevronRight } from "lucide-react";

export default function Sidebar({ items, onClose }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="flex h-full flex-col shadow-2xl z-30 w-[280px] bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
            <GraduationCap size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              WIET Attendance
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Management Portal
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors focus:outline-none"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Navigation Menu
        </div>
        {items.map((item, index) => {
          const active = isActive(item.path);

          return (
            <Link
              key={index}
              to={item.path}
              onClick={onClose}
              className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 min-h-[44px] relative ${
                active
                  ? "bg-blue-600/15 text-blue-400 font-semibold shadow-sm border border-blue-500/20"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              }`}
            >
              {/* Active Indicator Bar */}
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-500 shadow-sm" />
              )}

              <span className={`text-lg transition-transform duration-200 group-hover:scale-110 ${active ? "text-blue-400" : "text-slate-400"}`}>
                {typeof item.icon === "string" ? item.icon : item.icon}
              </span>
              
              <span className="truncate flex-1">{item.label}</span>

              {item.badge && (
                <span className="ml-auto rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 text-xs font-bold">
                  {item.badge}
                </span>
              )}

              {active && (
                <ChevronRight size={14} className="text-blue-400 opacity-80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium tracking-wide">WIET System</span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">v2.0</span>
        </div>
      </div>
    </aside>
  );
}
