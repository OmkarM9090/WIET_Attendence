/**
 * SIDEBAR COMPONENT
 * Navigation sidebar for Admin/Teacher/Student dashboards
 * Shows menu items based on user role
 * Highlights active route
 */

import { Link, useLocation } from "react-router-dom";
import { theme } from "../styles/theme";
import { X } from "lucide-react";

export default function Sidebar({ items, onClose }) {
  const location = useLocation();

  /**
   * Check if menu item is active based on current route
   */
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside
      className="flex h-full flex-col shadow-xl z-20 w-[280px]"
      style={{
        backgroundColor: "#1E293B",
        borderRight: `1px solid rgba(255,255,255,0.05)`,
      }}
    >
      {/* Logo/Brand Section */}
      <div
        className="flex items-center justify-between p-6"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/30"
          >
            <span className="text-xl">📚</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              WIET System
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Attendance Manager
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="md:hidden text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors focus:outline-none"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {items.map((item, index) => {
            const active = isActive(item.path);

            return (
              <li key={index}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300 min-h-[44px]"
                  style={{
                    backgroundColor: active ? "rgba(79, 70, 229, 0.15)" : "transparent",
                    color: active ? "#818cf8" : "#94a3b8",
                    fontWeight: active ? 600 : 500,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "#f1f5f9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#94a3b8";
                    }
                  }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                  {item.badge && (
                    <span
                      className="ml-auto rounded-full px-2 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: theme.colors.error,
                        color: theme.colors.text.inverse,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        className="p-4 mt-auto"
        style={{ borderTop: `1px solid rgba(255,255,255,0.05)` }}
      >
        <p className="text-center text-xs text-slate-500 font-medium tracking-wide">
          © 2026 WIET SYSTEM
        </p>
      </div>
    </aside>
  );
}
