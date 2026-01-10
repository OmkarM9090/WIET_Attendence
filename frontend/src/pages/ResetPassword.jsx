/**
 * RESET PASSWORD PAGE
 * Step 2 & 3: Verify OTP and set new password
 * 3-Step form:
 * 1. Enter email and OTP
 * 2. Enter new password and confirm
 * 3. Submit and redirect to login
 *
 * API: POST /api/auth/reset-password
 * Request: { email, otp, newPassword }
 * Response: { message: "Password reset successful" }
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../services/authService";
import { theme } from "../styles/theme";

// UI Components
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import Alert from "../components/Alert";

// Step enum
const STEP = {
  VERIFY_OTP: 1,
  SET_PASSWORD: 2,
  SUCCESS: 3,
};

export default function ResetPassword() {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [step, setStep] = useState(STEP.VERIFY_OTP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Validate OTP step
   */
  const validateOtpStep = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email");
      return false;
    }

    if (!otp.trim()) {
      setError("OTP is required");
      return false;
    }

    if (otp.length !== 6 || isNaN(otp)) {
      setError("OTP must be 6 digits");
      return false;
    }

    return true;
  };

  /**
   * Validate password step
   */
  const validatePasswordStep = () => {
    if (!newPassword.trim()) {
      setError("New password is required");
      return false;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }

    if (!confirmPassword.trim()) {
      setError("Please confirm your password");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  /**
   * Handle moving to password step
   */
  const handleNextStep = (e) => {
    e.preventDefault();
    setError("");

    if (validateOtpStep()) {
      setStep(STEP.SET_PASSWORD);
    }
  };

  /**
   * Handle password reset submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validatePasswordStep()) {
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email, otp, newPassword);
      setStep(STEP.SUCCESS);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
      console.error("Reset password error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle redirect to login
   */
  const handleBackToLogin = () => {
    setTimeout(() => {
      navigate("/");
    }, 1000);
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
            {step === STEP.SUCCESS ? "Password Reset" : "Reset Your Password"}
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: theme.colors.text.secondary }}
          >
            {step === STEP.VERIFY_OTP && "Step 1 of 2: Verify OTP"}
            {step === STEP.SET_PASSWORD && "Step 2 of 2: Create new password"}
            {step === STEP.SUCCESS && "Your password has been successfully reset"}
          </p>
        </div>

        {/* Progress Indicator */}
        {step !== STEP.SUCCESS && (
          <div className="mb-8 flex gap-3">
            {[1, 2].map((s) => (
              <div
                key={s}
                className="h-2 flex-1 rounded-full"
                style={{
                  backgroundColor:
                    s <= step ? theme.colors.primary[500] : theme.colors.neutral[200],
                  transition: theme.transitions.base,
                }}
              />
            ))}
          </div>
        )}

        {/* Success State */}
        {step === STEP.SUCCESS ? (
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
              message="Your password has been successfully reset! You can now login with your new password."
            />

            {/* Info Box */}
            <div
              className="rounded-lg border p-4 text-center"
              style={{
                borderColor: theme.colors.success,
                backgroundColor: `${theme.colors.success}15`,
              }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: theme.colors.success }}
              >
                ✓ Ready to Login
              </p>
              <p
                className="mt-2 text-xs"
                style={{ color: theme.colors.success, opacity: 0.8 }}
              >
                Your new password is now active. Use your email and new password to sign in.
              </p>
            </div>

            {/* Login Button */}
            <Button fullWidth onClick={handleBackToLogin}>
              Go to Login
            </Button>
          </div>
        ) : (
          // Form States
          <>
            {/* OTP Verification Step */}
            {step === STEP.VERIFY_OTP && (
              <form onSubmit={handleNextStep} className="space-y-6">
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

                {/* OTP Input */}
                <FormInput
                  label="Enter OTP"
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength="6"
                  disabled={loading}
                  required
                />

                {/* OTP Info Box */}
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
                    💌 Check Your Email
                  </p>
                  <p
                    className="mt-2 text-xs"
                    style={{ color: theme.colors.primary[600] }}
                  >
                    We sent a 6-digit OTP to {email || "your email"}. If you didn't receive it, check your spam folder.
                  </p>
                </div>

                {/* Submit Button */}
                <Button type="submit" loading={loading} fullWidth>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>

                {/* Back to Forgot Password */}
                <div className="text-center">
                  <p
                    className="text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Need a new OTP?{" "}
                    <Link
                      to="/forgot-password"
                      className="font-medium hover:underline"
                      style={{ color: theme.colors.primary[500] }}
                    >
                      Request again
                    </Link>
                  </p>
                </div>
              </form>
            )}

            {/* Password Setup Step */}
            {step === STEP.SET_PASSWORD && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Alerts */}
                {error && <Alert type="error" message={error} />}

                {/* New Password Input */}
                <FormInput
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                />

                {/* Confirm Password Input */}
                <FormInput
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />

                {/* Show Password Toggle */}
                <label
                  className="flex items-center text-sm cursor-pointer"
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

                {/* Password Requirements */}
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
                    🔒 Password Requirements
                  </p>
                  <ul
                    className="mt-3 space-y-1 text-xs"
                    style={{ color: theme.colors.primary[600] }}
                  >
                    <li>✓ At least 8 characters long</li>
                    <li>✓ Mix of uppercase and lowercase</li>
                    <li>✓ Include numbers or symbols</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <Button type="submit" loading={loading} fullWidth>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>

                {/* Back to OTP */}
                <button
                  type="button"
                  onClick={() => setStep(STEP.VERIFY_OTP)}
                  className="w-full text-sm font-medium hover:underline"
                  style={{ color: theme.colors.primary[500] }}
                >
                  Back to OTP Verification
                </button>
              </form>
            )}
          </>
        )}

        {/* Back to Login - All States */}
        {step !== STEP.SUCCESS && (
          <div className="mt-8 text-center border-t pt-6" style={{ borderColor: theme.colors.border }}>
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
                Sign in here
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
