/**
 * FORGOT PASSWORD PAGE
 * Step 1: Request password reset OTP
 * User enters email → Receives OTP via email
 *
 * API: POST /api/auth/forgot-password
 * Request: { email }
 * Response: { message: "OTP sent to email" }
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import { theme } from "../styles/theme";

// UI Components
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import Alert from "../components/Alert";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /**
   * Handle forgot password request
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-12"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.primary[50]} 0%, ${theme.colors.neutral[50]} 100%)`,
      }}
    >
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
            Reset Password
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: theme.colors.text.secondary }}
          >
            Enter your email and we'll send you an OTP to reset your password
          </p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.colors.success, opacity: 0.1 }}
              >
                <span className="text-4xl">✓</span>
              </div>
            </div>

            {/* Success Message */}
            <Alert
              type="success"
              message="OTP sent successfully! Check your email for the one-time password. It will expire in 10 minutes."
            />

            {/* Next Step Info */}
            <div
              className="rounded-lg border p-4 text-center"
              style={{
                borderColor: theme.colors.primary[200],
                backgroundColor: theme.colors.primary[50],
              }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: theme.colors.primary[700] }}
              >
                What's Next?
              </p>
              <p
                className="mt-2 text-xs"
                style={{ color: theme.colors.primary[600] }}
              >
                Check your inbox for an email with the OTP code. Then proceed to verify it and set your new password.
              </p>
            </div>

            {/* Proceed Button */}
            <Link to="/reset-password" className="block">
              <Button fullWidth>Proceed to Reset Password</Button>
            </Link>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/"
                className="text-sm font-medium hover:underline"
                style={{ color: theme.colors.primary[500] }}
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          // Form State
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alerts */}
            {error && <Alert type="error" message={error} />}

            {/* Email Input */}
            <FormInput
              label="Email Address"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            {/* Info Box */}
            <div
              className="rounded-lg border p-4"
              style={{
                borderColor: theme.colors.primary[200],
                backgroundColor: theme.colors.primary[50],
              }}
            >
              <p
                className="text-xs font-semibold"
                style={{ color: theme.colors.primary[700] }}
              >
                ℹ️ What happens next?
              </p>
              <ul
                className="mt-3 space-y-2 text-xs"
                style={{ color: theme.colors.primary[600] }}
              >
                <li>✓ We'll send an OTP to your email</li>
                <li>✓ OTP will be valid for 10 minutes</li>
                <li>✓ Use it to reset your password</li>
                <li>✓ Check spam folder if not found</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              loading={loading}
              fullWidth
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <p
                className="text-sm"
                style={{ color: theme.colors.text.secondary }}
              >
                Remember your password?{" "}
                <Link
                  to="/"
                  className="font-medium hover:underline"
                  style={{ color: theme.colors.primary[500] }}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
