import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, ChevronDown, Menu } from "lucide-react";

export default function DashboardHeader({ title, subtitle, onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-8 py-4 bg-white border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Left side: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* User Profile Section */}
      <div className="flex items-center gap-4">
        {/* User Info */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-700">
            {user?.name || "User"}
          </p>
          <p className="text-xs font-medium text-slate-400 capitalize">
            {user?.role || "Guest"}
          </p>
        </div>

        {/* Profile Avatar with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1 pr-2 rounded-full border border-slate-100 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold shadow-sm text-sm sm:text-base">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />

              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-100 z-20 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 sm:hidden">
                  <p className="text-sm font-bold text-slate-700">
                    {user?.name}
                  </p>
                  <p className="text-xs font-medium text-slate-400 capitalize">
                    {user?.role}
                  </p>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      // Add profile navigation if needed
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors"
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </button>
                  
                  <div className="h-px bg-slate-100 my-1 mx-2"></div>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
