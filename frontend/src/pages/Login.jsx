import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";
import { GraduationCap, Mail, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";

import Button from "../components/Button";
import FormInput from "../components/FormInput";
import Alert from "../components/Alert";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser(email, password);
      const { token, role, name } = response.data;

      login({
        token,
        role,
        name,
      });

      setSuccess("Login successful! Redirecting...");

      setTimeout(() => {
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "teacher") {
          navigate("/teacher");
        } else if (role === "student") {
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
    <div className="flex min-h-screen bg-[#f8f9fa] text-[#212529] font-sans antialiased">
      {/* Left Side - Brand Hero Section */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle Background Glow Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <GraduationCap size={26} className="stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-wide text-white">WIET Attendance</h2>
            <p className="text-xs text-slate-400 font-medium">Enterprise Management Portal</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg my-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} /> Official Portal
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            Streamlined Academic Attendance Tracking.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed font-medium">
            Empowering faculty, administration, and students with real-time tracking, automated reports, and instant attendance analytics.
          </p>

          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
              <CheckCircle2 size={18} className="text-blue-400" /> Fast & Intuitive Roll Call Marking
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
              <CheckCircle2 size={18} className="text-blue-400" /> Automated Excel & WhatsApp Reports
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
              <CheckCircle2 size={18} className="text-blue-400" /> Complete Defaulter & History Tracking
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-medium">
          © 2026 WIET System • All rights reserved
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
          {/* Mobile Header Branding */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-2">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap size={22} />
            </div>
            <span className="text-lg font-bold text-slate-900">WIET Attendance</span>
          </div>

          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {/* Alerts */}
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <FormInput
              label="Email Address"
              type="email"
              placeholder="e.g. user@college.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              icon={<Mail size={16} />}
            />

            <FormInput
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              icon={<Lock size={16} />}
            />

            <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                />
                Show password
              </label>
              <Link
                to="/forgot-password"
                className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* Demo Credentials Box */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs space-y-2">
            <p className="font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              Quick Demo Logins
            </p>
            <div className="space-y-1 text-slate-700 font-mono text-[11px]">
              <p><span className="font-bold text-slate-900">Admin:</span> admin@college.com / admin123</p>
              <p><span className="font-bold text-slate-900">Teacher:</span> omkarm842584@gmail.com / 123456</p>
              <p><span className="font-bold text-slate-900">Student:</span> aditya.student@gmail.com / 123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
