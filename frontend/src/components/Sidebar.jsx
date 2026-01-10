/**
 * SIDEBAR COMPONENT
 * Navigation sidebar for Admin/Teacher/Student dashboards
 * Shows menu items based on user role
 * Highlights active route
 */

import { Link, useLocation } from "react-router-dom";
import { theme } from "../styles/theme";

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
      className="flex h-full flex-col"
      style={{
        width: "280px",
        backgroundColor: theme.colors.background,
        borderRight: `1px solid ${theme.colors.border}`,
      }}
    >
      {/* Logo/Brand Section */}
      <div
        className="flex items-center gap-3 p-6"
        style={{ borderBottom: `1px solid ${theme.colors.border}` }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: theme.colors.primary[500] }}
        >
          <span className="text-xl">📚</span>
        </div>
        <div>
          <h2
            className="text-lg font-bold"
            style={{ color: theme.colors.text.primary }}
          >
            WIET Attendance
          </h2>
          <p
            className="text-xs"
            style={{ color: theme.colors.text.secondary }}
          >
            Management System
          </p>
        </div>
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
                  className="flex items-center gap-3 rounded-lg px-4 py-3 transition-all"
                  style={{
                    backgroundColor: active
                      ? theme.colors.primary[50]
                      : "transparent",
                    color: active
                      ? theme.colors.primary[600]
                      : theme.colors.text.secondary,
                    fontWeight: active ? 600 : 400,
                    transition: theme.transitions.base,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = theme.colors.hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "transparent";
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
        className="p-4"
        style={{ borderTop: `1px solid ${theme.colors.border}` }}
      >
        <p
          className="text-center text-xs"
          style={{ color: theme.colors.text.secondary }}
        >
          © 2025 WIET System
        </p>
      </div>
    </aside>
  );
}
