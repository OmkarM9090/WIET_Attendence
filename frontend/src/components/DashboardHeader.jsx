/**
 * DASHBOARD HEADER COMPONENT
 * Top navigation bar with user info and logout
 * Shows user name, role, and profile actions
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { theme } from "../styles/theme";
import Button from "./Button";

export default function DashboardHeader({ title, subtitle }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  /**
   * Handle user logout
   */
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
      style={{
        backgroundColor: theme.colors.background,
        borderBottom: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadows.sm,
      }}
    >
      {/* Page Title */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: theme.colors.text.primary }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-1 text-sm"
            style={{ color: theme.colors.text.secondary }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* User Profile Section */}
      <div className="flex items-center gap-4">
        {/* User Info */}
        <div className="text-right">
          <p
            className="text-sm font-semibold"
            style={{ color: theme.colors.text.primary }}
          >
            {user?.name || "User"}
          </p>
          <p
            className="text-xs capitalize"
            style={{ color: theme.colors.text.secondary }}
          >
            {user?.role || "Guest"}
          </p>
        </div>

        {/* Profile Avatar with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all"
            style={{
              backgroundColor: theme.colors.primary[500],
              color: theme.colors.text.inverse,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary[600];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary[500];
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />

              {/* Dropdown Content */}
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg py-2 z-20"
                style={{
                  backgroundColor: theme.colors.background,
                  boxShadow: theme.shadows.lg,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: theme.colors.border }}>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {user?.name}
                  </p>
                  <p
                    className="text-xs capitalize"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {user?.role}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors"
                  style={{
                    color: theme.colors.error,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
