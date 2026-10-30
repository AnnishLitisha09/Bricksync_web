import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Building2,
  Truck,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { useUserStore } from "../../store/useUserStore";
import { BASE_URL } from "../../api/base";
import Logo from "../../assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { setToken } = useUserStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!validateEmail(email)) {
      setAuthError("Please enter a valid business email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid email or password.");

      // 1. Set the token first
      setToken(data.token);

      // 2. Fetch profile to verify role
      await useUserStore.getState().fetchProfile();
      const user = useUserStore.getState().user;

      // 3. Role Authorization Check
      if (user && user.userRole !== 1) {
        useUserStore.getState().logout();
        throw new Error(
          "Access Denied: Administrative privileges are required for this web portal."
        );
      }

      // 4. Navigate to dashboard
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      {/* LEFT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 md:p-16 bg-white relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* BRAND HEADER */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-600/30">
                <img src={Logo} alt="BrickSync" className="h-7 w-7 object-contain brightness-0 invert" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    Brick<span className="text-indigo-600">Sync</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                    CRM & ERP
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Aswath Hollow Bricks & Transport
                </p>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Enter your enterprise credentials to access management controls.
            </p>
          </div>

          {/* ERROR ALERT */}
          {authError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-start gap-3 animate-in">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EMAIL FIELD */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Business Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aswathbricks.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* REMEMBER ME */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-600">
                  Keep me signed in for 30 days
                </span>
              </label>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Authenticating Session...
                </>
              ) : (
                <>
                  Sign In to BrickSync
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* SECURITY FOOTER */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              256-Bit SSL Encrypted
            </span>
            <span>Version 2.4.0</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - ENTERPRISE SHOWCASE */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-12 lg:p-16 flex-col justify-between overflow-hidden">
        {/* AMBIENT GLOW */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* TOP BADGE */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Cloud Infrastructure
          </div>
          <span className="text-xs font-mono text-slate-400">UTC +05:30 (IST)</span>
        </div>

        {/* CENTER CONTENT */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
              Operations & Logistics Suite
            </span>
            <h2 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
              Unified CRM, Fleet Telematics & Yard Production.
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              Real-time monitoring of commercial vehicles, automated production tracking,
              customer ledger reconciliation, and staff payroll under one robust platform.
            </p>
          </div>

          {/* FEATURE PILLS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                <Truck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Fleet & Fuel Audits</h4>
                <p className="text-[10px] text-slate-400">Bunk & trip tracking</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                <Building2 size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Multi-Yard Stock</h4>
                <p className="text-[10px] text-slate-400">Live inventory reconciliation</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <BarChart3 size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Automated Ledger</h4>
                <p className="text-[10px] text-slate-400">PDF statements & billing</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Daily Attendance</h4>
                <p className="text-[10px] text-slate-400">Staff wages & salaries</p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM METRICS PREVIEW */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>© 2026 Aswath Hollow Bricks. All rights reserved.</span>
          <span>BrickSync Engine v2.4</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
