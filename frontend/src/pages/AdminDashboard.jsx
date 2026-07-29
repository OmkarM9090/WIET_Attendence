import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  BookOpen, 
  GraduationCap, 
  Users, 
  FileText, 
  AlertTriangle,
  ChevronRight,
  Database,
  Server,
  Mail,
  Activity,
  UserPlus
} from "lucide-react";

import { getBranches, getStudents, getSubjects } from "../services/adminService";
import DashboardLayout from "../components/DashboardLayout";
import StatsCard from "../components/StatsCard";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalBranches: 0,
    totalSubjects: 0,
    defaulters: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [branchesData, studentsData, subjectsData] = await Promise.all([
        getBranches(),
        getStudents(),
        getSubjects(),
      ]);

      setStats({
        totalStudents: studentsData.length || 0,
        totalBranches: branchesData.length || 0,
        totalSubjects: subjectsData.length || 0,
        defaulters: 0,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    {
      path: "/admin",
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
    },
    {
      path: "/admin/branches",
      icon: <Building2 size={18} />,
      label: "Branches",
    },
    {
      path: "/admin/subjects",
      icon: <BookOpen size={18} />,
      label: "Subjects",
    },
    {
      path: "/admin/students",
      icon: <GraduationCap size={18} />,
      label: "Students",
    },
    {
      path: "/admin/teachers",
      icon: <Users size={18} />,
      label: "Teachers",
    },
    {
      path: "/admin/reports",
      icon: <FileText size={18} />,
      label: "Reports",
    },
    {
      path: "/admin/defaulters",
      icon: <AlertTriangle size={18} />,
      label: "Defaulters",
    },
  ];

  const quickActions = [
    {
      title: "Add Branch",
      description: "Configure academic department",
      icon: <Building2 size={20} className="text-blue-600" />,
      action: () => navigate("/admin/branches"),
    },
    {
      title: "Add Subject",
      description: "Define course curriculum",
      icon: <BookOpen size={20} className="text-blue-600" />,
      action: () => navigate("/admin/subjects"),
    },
    {
      title: "Add Student",
      description: "Enroll new student record",
      icon: <GraduationCap size={20} className="text-blue-600" />,
      action: () => navigate("/admin/students"),
    },
    {
      title: "Add Teacher",
      description: "Register teaching faculty",
      icon: <Users size={20} className="text-blue-600" />,
      action: () => navigate("/admin/teachers"),
    },
  ];

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      title="Dashboard"
      subtitle="Overview of system metrics and administration"
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          {error && <Alert type="error" message={error} />}

          {/* Minimalist Welcome Header */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Overview</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time tracking of enrollment, active courses, and system status.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Button 
                onClick={() => navigate("/admin/create-user")} 
                variant="primary" 
                size="sm"
                icon={<UserPlus size={16} />}
              >
                Create Account
              </Button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Students"
              value={stats.totalStudents}
              icon={<GraduationCap size={20} />}
              color="primary"
            />
            <StatsCard
              title="Total Branches"
              value={stats.totalBranches}
              icon={<Building2 size={20} />}
              color="info"
            />
            <StatsCard
              title="Total Subjects"
              value={stats.totalSubjects}
              icon={<BookOpen size={20} />}
              color="success"
            />
            <StatsCard
              title="Defaulters"
              value={stats.defaulters}
              icon={<AlertTriangle size={20} />}
              color="warning"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Quick Management Actions
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="rounded-xl p-4 text-left bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 transition-all duration-200 hover:border-slate-300 group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
                      {action.icon}
                    </div>
                    <ChevronRight size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {action.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {action.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Operational Status & Links */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity size={16} className="text-blue-600" /> System Operational Status
                </h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  All Systems Normal
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-200/50">
                  <div className="flex items-center gap-3">
                    <Database size={16} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">Database Connection</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-200/50">
                  <div className="flex items-center gap-3">
                    <Server size={16} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">API Server Endpoint</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Running
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-200/50">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">Email Dispatch Service</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4">
                Management Modules
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => navigate("/admin/students")}
                  variant="outline"
                  className="justify-start text-xs font-semibold text-slate-700"
                  icon={<GraduationCap size={16} />}
                >
                  Student Roster
                </Button>
                <Button
                  onClick={() => navigate("/admin/teachers")}
                  variant="outline"
                  className="justify-start text-xs font-semibold text-slate-700"
                  icon={<Users size={16} />}
                >
                  Teacher Roster
                </Button>
                <Button
                  onClick={() => navigate("/admin/reports")}
                  variant="outline"
                  className="justify-start text-xs font-semibold text-slate-700"
                  icon={<FileText size={16} />}
                >
                  Reports Engine
                </Button>
                <Button
                  onClick={() => navigate("/admin/defaulters")}
                  variant="outline"
                  className="justify-start text-xs font-semibold text-rose-700 border-rose-200/80 hover:bg-rose-50"
                  icon={<AlertTriangle size={16} />}
                >
                  Defaulter Tracking
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
