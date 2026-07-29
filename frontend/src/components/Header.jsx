import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GraduationCap, LogOut } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between px-6 py-3.5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 shadow-md shadow-blue-500/20 flex items-center justify-center text-white">
            <GraduationCap size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              WIET Attendance System
            </h1>
            <p className="text-xs text-slate-500 font-medium">Academic Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-slate-800">{user?.name}</p>
            <p className="text-xs font-semibold text-blue-600 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3.5 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100/80"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
