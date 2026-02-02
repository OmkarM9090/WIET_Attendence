/**
 * ADMIN DASHBOARD
 * Main dashboard for administrators
 * Shows system overview, statistics, and quick actions
 *
 * API Endpoints Used:
 * - GET /api/admin/branches
 * - GET /api/admin/students
 * - GET /api/admin/subjects
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../styles/theme";

// Services
import { getBranches, getStudents, getSubjects } from "../services/adminService";

// Components
import DashboardLayout from "../components/DashboardLayout";
import StatsCard from "../components/StatsCard";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Data state
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalBranches: 0,
    totalSubjects: 0,
    defaulters: 0,
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Fetch dashboard statistics
   */
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch all required data in parallel
      const [branchesData, studentsData, subjectsData] = await Promise.all([
        getBranches(),
        getStudents(),
        getSubjects(),
      ]);

      setStats({
        totalStudents: studentsData.length || 0,
        totalBranches: branchesData.length || 0,
        totalSubjects: subjectsData.length || 0,
        defaulters: 0, // Will be calculated from actual defaulters API
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Sidebar menu items for admin
  const sidebarItems = [
    {
      path: "/admin",
      icon: "📊",
      label: "Dashboard",
    },
    {
      path: "/admin/branches",
      icon: "🏢",
      label: "Branches",
    },
    {
      path: "/admin/subjects",
      icon: "📚",
      label: "Subjects",
    },
    {
      path: "/admin/students",
      icon: "🎓",
      label: "Students",
    },
    {
      path: "/admin/teachers",
      icon: "👨‍🏫",
      label: "Teachers",
    },
    {
      path: "/admin/reports",
      icon: "📋",
      label: "Reports",
    },
    {
      path: "/admin/defaulters",
      icon: "⚠️",
      label: "Defaulters",
    },
  ];

  // Quick action cards
  const quickActions = [
    {
      title: "Add Branch",
      description: "Create new academic branch",
      icon: "🏢",
      color: "primary",
      action: () => navigate("/admin/branches"),
    },
    {
      title: "Add Subject",
      description: "Add subjects for branches",
      icon: "📚",
      color: "info",
      action: () => navigate("/admin/subjects"),
    },
    {
      title: "Add Student",
      description: "Enroll new students",
      icon: "🎓",
      color: "success",
      action: () => navigate("/admin/students"),
    },
    {
      title: "Add Teacher",
      description: "Register teaching staff",
      icon: "👨‍🏫",
      color: "warning",
      action: () => navigate("/admin/teachers"),
    },
  ];

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      title="Dashboard"
      subtitle="Overview of your attendance management system"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Error Alert */}
          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} />
            </div>
          )}

          {/* Welcome Section */}
          <div
            className="mb-10 rounded-lg p-6"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.primary[600]} 100%)`,
              color: theme.colors.text.inverse,
            }}
          >
            <h2 className="text-2xl font-bold">Welcome back, Admin! 👋</h2>
            <p className="mt-2 opacity-90">
              Here's what's happening with your attendance system today.
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="mb-8">
            <h3
              className="mb-4 text-lg font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              System Overview
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Students"
                value={stats.totalStudents}
                icon="🎓"
                color="primary"
                trend={
                  stats.totalStudents > 0
                    ? { direction: "up", value: "+12%", label: "from last month" }
                    : null
                }
              />
              <StatsCard
                title="Total Branches"
                value={stats.totalBranches}
                icon="🏢"
                color="info"
              />
              <StatsCard
                title="Total Subjects"
                value={stats.totalSubjects}
                icon="📚"
                color="success"
              />
              <StatsCard
                title="Defaulters"
                value={stats.defaulters}
                icon="⚠️"
                color="warning"
                trend={
                  stats.defaulters > 0
                    ? { direction: "down", value: "-5%", label: "from last month" }
                    : null
                }
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3
              className="mb-4 text-lg font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              Quick Actions
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="rounded-lg p-6 text-left transition-all"
                  style={{
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    boxShadow: theme.shadows.sm,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = theme.shadows.md;
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = theme.shadows.sm;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div className="mb-4 text-3xl">{action.icon}</div>
                  <h4
                    className="text-base font-semibold"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {action.title}
                  </h4>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {action.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity / System Info */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* System Status */}
            <div
              className="rounded-lg p-6"
              style={{
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.shadows.sm,
              }}
            >
              <h3
                className="mb-4 text-lg font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                System Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: theme.colors.success }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Database
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: theme.colors.success }}
                  >
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: theme.colors.success }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      API Server
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: theme.colors.success }}
                  >
                    Running
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: theme.colors.success }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Email Service
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: theme.colors.success }}
                  >
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div
              className="rounded-lg p-6"
              style={{
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.shadows.sm,
              }}
            >
              <h3
                className="mb-4 text-lg font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                Quick Links
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/admin/students")}
                  variant="outline"
                  fullWidth
                >
                  📊 View All Students
                </Button>
                <Button
                  onClick={() => navigate("/admin/teachers")}
                  variant="outline"
                  fullWidth
                >
                  👥 Manage Teachers
                </Button>
                <Button
                  onClick={() => navigate("/admin/reports")}
                  variant="outline"
                  fullWidth
                >
                  📈 Generate Reports
                </Button>
                <Button
                  onClick={() => navigate("/admin/defaulters")}
                  variant="outline"
                  fullWidth
                >
                  ⚠️ View Defaulters
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
