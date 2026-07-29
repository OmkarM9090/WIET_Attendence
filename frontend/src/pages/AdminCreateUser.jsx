import { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Button from "../components/Button";
import Alert from "../components/Alert";
import Card from "../components/Card";
import { ArrowLeft, UserPlus } from "lucide-react";

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
      await registerUser(form);
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
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Error creating user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529]">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin")}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" /> Create Account
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Register a new student or faculty member in the system
          </p>
        </div>

        <Card>
          {message && (
            <div className="mb-4">
              <Alert message={message} type="success" onClose={() => setMessage("")} />
            </div>
          )}

          {error && (
            <div className="mb-4">
              <Alert message={error} type="error" onClose={() => setError("")} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Personal Credentials
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Full Name"
                  name="name"
                  placeholder="e.g., Jane Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />

                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="jane@college.edu"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mt-4">
                <FormInput
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Set initial password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Account Type
              </h3>
              <FormSelect
                label="Role"
                name="role"
                value={form.role}
                onChange={handleChange}
                options={[
                  { label: "Student", value: "student" },
                  { label: "Teacher", value: "teacher" },
                ]}
              />
            </div>

            {form.role === "student" && (
              <div className="border-t border-slate-100 pt-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Student Assignment Details
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput
                    label="Branch"
                    name="branch"
                    placeholder="e.g., Computer Engineering"
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
                      { label: "1st Year (FE)", value: "1" },
                      { label: "2nd Year (SE)", value: "2" },
                      { label: "3rd Year (TE)", value: "3" },
                      { label: "4th Year (BE)", value: "4" },
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
                    placeholder="e.g., 101"
                    value={form.rollNo}
                    onChange={handleChange}
                    required={form.role === "student"}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/admin")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                variant="primary"
              >
                Create Account
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
