import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../services/authService";
import { KeyRound, Mail, Lock, ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";

import Button from "../components/Button";
import FormInput from "../components/FormInput";
import Alert from "../components/Alert";

const STEP = {
  VERIFY_OTP: 1,
  SET_PASSWORD: 2,
  SUCCESS: 3,
};

export default function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState(STEP.VERIFY_OTP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateOtpStep = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!otp.trim()) {
      setError("OTP is required");
      return false;
    }

    if (otp.length !== 6 || isNaN(otp)) {
      setError("OTP must be a 6-digit number");
      return false;
    }

    return true;
  };

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

  const handleNextStep = (e) => {
    e.preventDefault();
    setError("");

    if (validateOtpStep()) {
      setStep(STEP.SET_PASSWORD);
    }
  };

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

  const handleBackToLogin = () => {
    setTimeout(() => {
      navigate("/");
    }, 500);
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
            {step === STEP.SUCCESS ? "Password Reset" : "Reset Your Password"}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
            {step === STEP.VERIFY_OTP && "Step 1 of 2: Verify OTP Code"}
            {step === STEP.SET_PASSWORD && "Step 2 of 2: Set New Password"}
            {step === STEP.SUCCESS && "Your password has been successfully updated"}
          </p>
        </div>

        {/* Progress Bar */}
        {step !== STEP.SUCCESS && (
          <div className="flex gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 3: Success State */}
        {step === STEP.SUCCESS ? (
          <div className="space-y-6">
            <Alert
              type="success"
              message="Your password has been successfully reset! You can now login with your new password."
            />

            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 text-center">
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Ready to Login
              </p>
              <p className="mt-1 text-xs text-emerald-800 leading-relaxed font-medium">
                Your new password is active. Log in with your email and new password.
              </p>
            </div>

            <Button fullWidth size="lg" onClick={handleBackToLogin}>
              Go to Login
            </Button>
          </div>
        ) : (
          <>
            {/* Step 1: Verify OTP */}
            {step === STEP.VERIFY_OTP && (
              <form onSubmit={handleNextStep} className="space-y-4">
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

                <FormInput
                  label="Enter OTP Code"
                  type="text"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength="6"
                  disabled={loading}
                  required
                  icon={<ShieldCheck size={16} />}
                />

                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs space-y-1 text-slate-700">
                  <p className="font-bold text-blue-900 uppercase tracking-wider text-[11px]">
                    Check Your Email
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    We sent a 6-digit OTP code to {email || "your registered email"}.
                  </p>
                </div>

                <Button type="submit" loading={loading} fullWidth size="lg">
                  Verify OTP
                </Button>

                <div className="text-center pt-1">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Request a new OTP code
                  </Link>
                </div>
              </form>
            )}

            {/* Step 2: Set New Password */}
            {step === STEP.SET_PASSWORD && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <Alert type="error" message={error} />}

                <FormInput
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                  icon={<Lock size={16} />}
                />

                <FormInput
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  icon={<Lock size={16} />}
                />

                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                  />
                  Show password
                </label>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs space-y-1.5 text-slate-700">
                  <p className="font-bold text-blue-900 uppercase tracking-wider text-[11px]">
                    Password Security Criteria
                  </p>
                  <ul className="space-y-1 text-[11px] font-medium text-slate-600">
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-blue-600" /> At least 8 characters long</li>
                  </ul>
                </div>

                <Button type="submit" loading={loading} fullWidth size="lg">
                  Reset Password
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(STEP.VERIFY_OTP)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Back to OTP verification
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {step !== STEP.SUCCESS && (
          <div className="pt-4 border-t border-slate-100 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
