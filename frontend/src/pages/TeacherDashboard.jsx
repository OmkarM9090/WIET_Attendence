import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import StatsCard from "../components/teacher/StatsCard";
import RecentSessions from "../components/teacher/RecentSessions";
import AttendanceTrendChart from "../components/teacher/AttendanceTrendChart";
import QuickActions from "../components/teacher/QuickActions";
import LowAttendanceAlerts from "../components/teacher/LowAttendanceAlerts";
import { getDashboardStats } from "../services/teacherService";
import { useAuth } from "../context/AuthContext";
import { BookOpen, CheckCircle, AlertTriangle, Users } from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    todaySessions: 0,
    avgAttendance: 0,
    totalDefaulters: 0,
    totalStudents: 0,
    recentSessions: [],
    weeklyTrend: [],
    lowAttendanceAlerts: []
  });

  const sidebarItems = [
    { label: "Dashboard", path: "/teacher", icon: "🏠" },
    { label: "Mark Attendance", path: "/teacher/mark-attendance", icon: "✓" },
    { label: "View Attendance", path: "/teacher/attendance-history", icon: "📋" },
    { label: "Reports", path: "/teacher/reports", icon: "📊" },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      if (res.success) {
        setData(res);
      } else {
        setError(res.message);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="p-6 space-y-6 animate-pulse">
          <div className="h-20 bg-slate-200 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 h-80 bg-slate-200 rounded-xl"></div>
             <div className="h-80 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">👋 Welcome back, {user?.name || 'Teacher'}!</h1>
            <p className="text-indigo-100 font-medium">Today is {todayStr}</p>
          </div>
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <BookOpen size={200} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between">
            <p>{error}</p>
            <button onClick={fetchDashboardData} className="underline text-sm font-semibold">Retry</button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            title="Today's Sessions" 
            value={data.todaySessions} 
            icon={<BookOpen size={24} />} 
            color="indigo" 
          />
          <StatsCard 
            title="Avg Attendance" 
            value={`${data.avgAttendance}%`} 
            icon={<CheckCircle size={24} />} 
            color="green" 
          />
          <StatsCard 
            title="Total Defaulters" 
            value={data.totalDefaulters} 
            icon={<AlertTriangle size={24} />} 
            color="amber" 
          />
          <StatsCard 
            title="Total Students" 
            value={data.totalStudents} 
            icon={<Users size={24} />} 
            color="indigo" 
          />
        </div>

        {/* Layout for Recent Sessions & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentSessions sessions={data.recentSessions} />
          </div>
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
        </div>

        {/* Trend Chart */}
        <div className="w-full">
          <AttendanceTrendChart data={data.weeklyTrend} />
        </div>

        {/* Low Attendance Alerts */}
        <LowAttendanceAlerts alerts={data.lowAttendanceAlerts} />

      </div>
    </DashboardLayout>
  );
}
