/**
 * LOGIN PAGE
 * Public route - Entry point for all users
 * Handles email/password authentication
 * Routes to appropriate dashboard based on user role
 *
 * API: POST /api/auth/login
 * Response: { token, role, name }
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";
import { theme } from "../styles/theme";

// UI Components
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import Alert from "../components/Alert";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /**
   * Handle login form submission
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser(email, password);

      // Store auth data using context
      login({
        token: response.token,
        role: response.role,
        name: response.name,
      });

      setSuccess("Login successful! Redirecting...");

      // Redirect based on role
      setTimeout(() => {
        if (response.role === "admin") {
          navigate("/admin");
        } else if (response.role === "teacher") {
          navigate("/teacher");
        } else if (response.role === "student") {
          navigate("/student");
        }
      }, 500);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.primary[50]} 0%, ${theme.colors.neutral[50]} 100%)`,
      }}
    >
      {/* Left Side - Branding */}
      <div
        className="hidden w-1/2 flex-col justify-between p-12 lg:flex"
        style={{ backgroundColor: theme.colors.primary[600] }}
      >
        <div>
          <h1
            className="text-4xl font-bold text-white"
            style={{ fontFamily: theme.typography.fontFamily.sans }}
          >
            Attendance System
          </h1>
          <p
            className="mt-4 text-lg"
            style={{ color: theme.colors.text.inverse, opacity: 0.9 }}
          >
            Modern, efficient, and secure attendance management for educational institutions
          </p>
        </div>

        <div>
          <p
            className="text-sm"
            style={{ color: theme.colors.text.inverse, opacity: 0.8 }}
          >
            © 2025 WIET Attendance System. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div
          className="w-full max-w-md rounded-lg p-8"
          style={{
            backgroundColor: theme.colors.background,
            boxShadow: theme.shadows.lg,
          }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <h2
              className="text-3xl font-bold"
              style={{ color: theme.colors.text.primary }}
            >
              Sign In
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: theme.colors.text.secondary }}
            >
              Welcome back! Please login to your account
            </p>
          </div>

          {/* Alerts */}
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <FormInput
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            {/* Password Input */}
            <FormInput
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            {/* Show Password Toggle */}
            <div className="flex items-center justify-between text-sm">
              <label
                className="flex items-center cursor-pointer"
                style={{ color: theme.colors.text.secondary }}
              >
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="mr-2 h-4 w-4 rounded"
                  style={{ accentColor: theme.colors.primary[500] }}
                />
                Show password
              </label>
              <Link
                to="/forgot-password"
                className="font-medium hover:underline"
                style={{ color: theme.colors.primary[500] }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              loading={loading}
              fullWidth
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Demo Credentials Info */}
          <div
            className="mt-8 rounded-lg border p-4"
            style={{
              borderColor: theme.colors.primary[200],
              backgroundColor: theme.colors.primary[50],
            }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: theme.colors.primary[700] }}
            >
              📌 Demo Credentials
            </p>
            <div
              className="mt-2 space-y-1 text-xs"
              style={{ color: theme.colors.primary[600] }}
            >
              <p>
                <span className="font-semibold">Admin:</span> admin@wiet.edu / admin123
              </p>
              <p>
                <span className="font-semibold">Teacher:</span> teacher@wiet.edu / teacher123
              </p>
              <p>
                <span className="font-semibold">Student:</span> student@wiet.edu / student123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
