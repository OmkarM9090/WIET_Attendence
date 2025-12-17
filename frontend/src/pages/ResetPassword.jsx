import { useState } from "react";
import { resetPassword } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword({
        email,
        otp,
        newPassword,
      });
      setMessage(res.data.message);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Error resetting password");
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
              <span className="text-3xl">✓</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Password</h1>
          <p className="mt-2 text-gray-600">Reset your account password</p>
        </div>

        {/* Reset Password Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">
            Enter Reset Details
          </h2>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email Address"
              name="email"
              type="email"
              placeholder="your@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <FormInput
              label="OTP Code"
              name="otp"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />

            <FormInput
              label="New Password"
              name="newPassword"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <FormInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" fullWidth loading={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <Link
                to="/"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
