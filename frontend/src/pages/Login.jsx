import { useState } from "react";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      login(res.data);

      if (res.data.role === "admin") navigate("/admin");
      else if (res.data.role === "teacher") navigate("/teacher");
      else navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <span className="text-3xl">📚</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance System</h1>
          <p className="mt-2 text-gray-600">College Management Platform</p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">
            Sign In to Your Account
          </h2>

          {error && (
            <div className="mb-4">
              <Alert
                message={error}
                type="error"
                onClose={() => setError("")}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <FormInput
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              className="mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Forgot your password?{" "}
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Reset it here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            © 2025 College Attendance System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
