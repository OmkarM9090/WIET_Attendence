import { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Button from "../components/Button";
import Alert from "../components/Alert";
import Card from "../components/Card";

export default function AdminCreateUser() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    branch: "",
    year: "",
    division: "",
    rollNo: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await registerUser(form);
      setMessage("User created successfully!");
      setForm({
        name: "",
        email: "",
        password: "",
        role: "student",
        branch: "",
        year: "",
        division: "",
        rollNo: "",
      });
      setTimeout(() => {
        navigate("/admin");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Error creating user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin")}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
          <p className="mt-2 text-gray-600">Add a new student or teacher to the system</p>
        </div>

        <Card>
          {message && (
            <div className="mb-4">
              <Alert
                message={message}
                type="success"
                onClose={() => setMessage("")}
              />
            </div>
          )}

          {error && (
            <div className="mb-4">
              <Alert
                message={error}
                type="error"
                onClose={() => setError("")}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Basic Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Full Name"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />

                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <FormInput
                label="Password"
                name="password"
                type="password"
                placeholder="Enter a strong password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Role Selection */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Account Type
              </h3>
              <FormSelect
                label="Select Role"
                name="role"
                value={form.role}
                onChange={handleChange}
                options={[
                  { label: "Student", value: "student" },
                  { label: "Teacher", value: "teacher" },
                ]}
              />
            </div>

            {/* Student-specific fields */}
            {form.role === "student" && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Student Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput
                    label="Branch"
                    name="branch"
                    placeholder="e.g., Computer Science"
                    value={form.branch}
                    onChange={handleChange}
                    required={form.role === "student"}
                  />

                  <FormSelect
                    label="Year"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    options={[
                      { label: "Select Year", value: "" },
                      { label: "1st Year", value: "1" },
                      { label: "2nd Year", value: "2" },
                      { label: "3rd Year", value: "3" },
                      { label: "4th Year", value: "4" },
                    ]}
                    required={form.role === "student"}
                  />

                  <FormInput
                    label="Division"
                    name="division"
                    placeholder="e.g., A, B, C"
                    value={form.division}
                    onChange={handleChange}
                    required={form.role === "student"}
                  />

                  <FormInput
                    label="Roll Number"
                    name="rollNo"
                    placeholder="e.g., 001"
                    value={form.rollNo}
                    onChange={handleChange}
                    required={form.role === "student"}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 border-t border-gray-200 pt-6">
              <Button
                type="submit"
                loading={loading}
                fullWidth={false}
              >
                {loading ? "Creating..." : "Create User"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/admin")}
                fullWidth={false}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
