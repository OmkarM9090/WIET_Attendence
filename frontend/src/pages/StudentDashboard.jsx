import { useState, useEffect } from "react";
import Header from "../components/Header";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";

export default function StudentDashboard() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setAttendance([
        { id: 1, subject: "Programming", attended: 45, total: 50, percentage: "90%" },
        { id: 2, subject: "Data Structures", attended: 44, total: 50, percentage: "88%" },
        { id: 3, subject: "Web Development", attended: 47, total: 50, percentage: "94%" },
        { id: 4, subject: "Database Design", attended: 46, total: 50, percentage: "92%" },
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

  const averageAttendance = Math.round(
    attendance.reduce((acc, att) => acc + parseFloat(att.percentage), 0) / attendance.length
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="mt-2 text-gray-600">View your attendance and academic information</p>
        </div>

        {/* Profile Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Branch</p>
              <p className="text-lg font-semibold text-gray-900">Computer Science</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Year</p>
              <p className="text-lg font-semibold text-gray-900">2nd Year</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Division</p>
              <p className="text-lg font-semibold text-gray-900">A</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Roll Number</p>
              <p className="text-lg font-semibold text-gray-900">045</p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Average Attendance", value: `${averageAttendance}%`, icon: "✓" },
            { label: "Total Classes", value: attendance.length, icon: "📚" },
            { label: "Total Attended", value: attendance.reduce((acc, att) => acc + att.attended, 0), icon: "👥" },
            { label: "Classes Missed", value: attendance.reduce((acc, att) => acc + (att.total - att.attended), 0), icon: "⚠️" },
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

        {/* Attendance Details */}
        <Card title="Subject-wise Attendance">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Attended
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Percentage
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendance.map((att) => {
                  const percentage = parseFloat(att.percentage);
                  const status = percentage >= 75 ? "Good" : "At Risk";
                  const statusColor = percentage >= 75 ? "green" : "red";

                  return (
                    <tr key={att.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{att.subject}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{att.attended}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{att.total}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {att.percentage}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                            statusColor === "green"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Note */}
          <div className="mt-4 rounded-lg bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Minimum 75% attendance is required to be eligible for exams.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
