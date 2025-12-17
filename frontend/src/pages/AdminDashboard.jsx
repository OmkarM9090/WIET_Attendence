import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    teachers: 0,
    branches: 0,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading data
    setLoading(true);
    setTimeout(() => {
      setStats({
        totalUsers: 156,
        students: 120,
        teachers: 36,
        branches: 4,
      });
      setLoading(false);
    }, 1000);
  }, []);

  const quickActions = [
    {
      title: "Create User",
      description: "Add new student or teacher",
      icon: "➕",
      action: () => navigate("/admin/create-user"),
    },
    {
      title: "Manage Branches",
      description: "View and manage branches",
      icon: "🏢",
      action: () => alert("Coming soon"),
    },
    {
      title: "Manage Subjects",
      description: "Add or edit subjects",
      icon: "📖",
      action: () => alert("Coming soon"),
    },
    {
      title: "View Reports",
      description: "Attendance and performance",
      icon: "📊",
      action: () => alert("Coming soon"),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your college attendance system</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: "👥" },
            { label: "Students", value: stats.students, icon: "🎓" },
            { label: "Teachers", value: stats.teachers, icon: "👨‍🏫" },
            { label: "Branches", value: stats.branches, icon: "🏫" },
          ].map((stat, idx) => (
            <Card key={idx}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="text-4xl">{stat.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, idx) => (
              <Card key={idx} className="cursor-pointer transition-shadow hover:shadow-md">
                <button
                  onClick={action.action}
                  className="w-full text-left"
                >
                  <div className="mb-3 text-3xl">{action.icon}</div>
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{action.description}</p>
                </button>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card title="Recent Activity">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <p className="font-medium text-gray-900">New user created</p>
                  <p className="text-sm text-gray-500">John Doe - Student</p>
                </div>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between pb-4">
                <div>
                  <p className="font-medium text-gray-900">System updated</p>
                  <p className="text-sm text-gray-500">Database maintenance completed</p>
                </div>
                <span className="text-xs text-gray-500">5 hours ago</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
