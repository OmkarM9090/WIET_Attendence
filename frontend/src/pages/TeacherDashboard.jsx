import { useState, useEffect } from "react";
import Header from "../components/Header";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setClasses([
        { id: 1, name: "CS101 - Programming", students: 45, attendance: "92%" },
        { id: 2, name: "CS102 - Data Structures", students: 40, attendance: "88%" },
        { id: 3, name: "CS103 - Web Development", students: 38, attendance: "95%" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your classes and attendance</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Classes", value: 3, icon: "📚" },
            { label: "Total Students", value: 123, icon: "🎓" },
            { label: "Avg Attendance", value: "91.7%", icon: "✓" },
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

        {/* Classes List */}
        <Card title="My Classes">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Class Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Students
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Attendance
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{cls.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{cls.students}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                        {cls.attendance}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="secondary" onClick={() => alert("Coming soon")}>
                        Mark Attendance
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
