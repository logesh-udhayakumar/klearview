"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  LogIn,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.isBlocked) {
          setBlockedReason(data.remarks);
          setShowBlockedDialog(true);
          return;
        }
        throw new Error(data.message || "Failed to log in");
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.user_type?.toLowerCase() === "vendor" && data.user.vendor_id) {
        router.push(`/vendor-dashboard/${data.user.vendor_id}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);
    setResetMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reset link");
      setResetMessage("Reset link sent! Please check your email.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            prompt: 'select_account'
          },
          redirectTo: `${window.location.origin}/auth/callback?action=login`
        }
      });
      
      if (error) throw error;
      // Note: The page will redirect to Google, so we don't set isLoading to false here.
    } catch (err: any) {
      setError(err.message || "Failed to initialize Google login.");
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/guest-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "0cf411f1-8f35-4e3a-9a96-969d2e3a7ea2" }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.isBlocked) {
          setBlockedReason(data.remarks);
          setShowBlockedDialog(true);
          return;
        }
        throw new Error(data.message || "Failed to log in as Guest Admin");
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.user_type?.toLowerCase() === "vendor" && data.user.vendor_id) {
        router.push(`/vendor-dashboard/${data.user.vendor_id}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Left Panel – Branding ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow accents */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight">KlearView</span>
            <span className="block text-[11px] text-indigo-400 font-medium tracking-widest uppercase">
              Vendor Portal
            </span>
          </div>
        </motion.div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10"
        >
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight mb-5">
            Manage vendors,
            <br />
            <span className="text-indigo-400">smarter & faster.</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Real-time vendor insights, payment analytics and compliance management — all in one place.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {[
              "Unified vendor onboarding & compliance",
              "Payment reconciliation at a glance",
              "Role-based access for your entire team",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-indigo-400" />
                </div>
                <span className="text-slate-400 text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 text-slate-600 text-xs"
        >
          © {new Date().getFullYear()} KlearView. All rights reserved.
        </motion.p>
      </div>

      {/* ── Right Panel – Form ────────────────────────────────── */}
      <div className="flex-1 flex overflow-y-auto px-6 py-12">
        <div className="w-full max-w-[400px] m-auto flex flex-col">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10 mx-auto">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">KlearView</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {!showForgotPassword ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                <p className="text-slate-500 text-sm mt-1">Sign in to your KlearView account</p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-sm"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-600/20 active:scale-[0.99]"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Sign in
                      <LogIn className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Google */}
              <button
                id="google-login"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 text-sm font-medium rounded-lg flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.99]"
              >
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png"
                  className="w-4 h-4"
                  alt="Google"
                />
                Continue with Google
              </button>

              {/* Sign up link */}
              <p className="text-center text-sm text-slate-500 mt-6">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Sign up
                </Link>
              </p>

              <p className="text-center text-sm text-slate-500 mt-2">
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Guest Admin?
                </button>
              </p>
            </>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetMessage(null);
                    setError(null);
                  }}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </button>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset password</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      id="reset-email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-sm"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </motion.div>
                  )}
                  {resetMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>{resetMessage}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  id="reset-submit"
                  type="submit"
                  disabled={isResetLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-600/20 active:scale-[0.99]"
                >
                  {isResetLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
        </div>
      </div>

      {/* ── Blocked Vendor Dialog ─────────────────────────────── */}
      <AnimatePresence>
        {showBlockedDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Access Denied</h3>
                  <p className="text-sm text-slate-500">Your account has been restricted</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                A restriction has been placed on this account. Access to the vendor portal is currently suspended.
              </p>

              {blockedReason && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-slate-700 italic leading-relaxed">
                    &ldquo;{blockedReason}&rdquo;
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowBlockedDialog(false)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-all active:scale-[0.99]"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
