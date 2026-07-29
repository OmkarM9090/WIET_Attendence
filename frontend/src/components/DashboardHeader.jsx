import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, ChevronDown, Menu, Shield } from "lucide-react";

export default function DashboardHeader({ title, subtitle, onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "teacher":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "student":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Left side: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 font-medium hidden sm:block mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right side: User Profile Section */}
      <div className="flex items-center gap-4">
        {/* User Role Tag & Name */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-800 leading-tight">
            {user?.name || "User"}
          </p>
          <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getRoleBadgeColor(user?.role)}`}>
            <Shield size={10} />
            <span className="capitalize">{user?.role || "Guest"}</span>
          </span>
        </div>

        {/* Profile Avatar with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />

              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 sm:hidden">
                  <p className="text-sm font-bold text-slate-800">
                    {user?.name}
                  </p>
                  <p className="text-xs font-semibold text-blue-600 capitalize mt-0.5">
                    {user?.role}
                  </p>
                </div>

                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-medium text-slate-400">
                    Signed in as <span className="font-bold text-slate-700">{user?.email || user?.username || "User"}</span>
                  </div>

                  <div className="h-px bg-slate-100 my-1 mx-2" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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
