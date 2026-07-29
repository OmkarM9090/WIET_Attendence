import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import { KeyRound, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

import Button from "../components/Button";
import FormInput from "../components/FormInput";
import Alert from "../components/Alert";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
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
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] text-[#212529] p-6 font-sans antialiased">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
            <KeyRound size={24} />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Reset Password
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
            Enter your email and we'll send you an OTP to reset your password
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <Alert
              type="success"
              message="OTP sent successfully! Check your email for the one-time password. It will expire in 10 minutes."
            />

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-center">
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                What's Next?
              </p>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-medium">
                Check your inbox for an email with the OTP code. Then proceed to verify it and set your new password.
              </p>
            </div>

            <Link to="/reset-password" className="block">
              <Button fullWidth size="lg">Proceed to Reset Password</Button>
            </Link>

            <div className="text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <FormInput
              label="Email Address"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              icon={<Mail size={16} />}
            />

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs space-y-1.5 text-slate-700">
              <p className="font-bold text-blue-900 uppercase tracking-wider text-[11px]">
                What happens next?
              </p>
              <ul className="space-y-1 text-[11px] font-medium text-slate-600">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-blue-600" /> We'll send an OTP code to your email</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-blue-600" /> Code expires in 10 minutes</li>
              </ul>
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
            >
              Send OTP
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
