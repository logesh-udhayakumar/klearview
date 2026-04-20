"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<"initial" | "otp" | "success">("initial");
  const [otp, setOtp] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [devInfo, setDevInfo] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((p) => p - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ── OTP helpers ── */
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const arr = otp.split("");
    while (arr.length < 6) arr.push("");
    arr[index] = digit;
    setOtp(arr.join(""));
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && index > 0 && (!otp[index] || otp[index] === "")) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");
      setDevInfo(data.devMode ? data.message : null);
      setTimer(120);
      setCanResend(false);
      setOtp("");
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Form submit ── */
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    const strongPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPwd.test(password)) {
      setError(
        "Password must be at least 8 characters with uppercase, lowercase, number and special character."
      );
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setDevInfo(data.devMode ? data.message : null);
      setStep("otp");
      setTimer(120);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (otp.length !== 6) {
      setError("OTP must be exactly 6 digits");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, user_type: "Vendor", otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to verify OTP and sign up");

      localStorage.setItem("user", JSON.stringify({ email, name, user_type: "Vendor" }));
      setStep("success");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            prompt: 'select_account'
          },
          redirectTo: `${window.location.origin}/auth/callback?action=signup`
        }
      });
      
      if (error) throw error;
      // Page redirects to Google, keep loading state active
    } catch (err: any) {
      setError(err.message || "Failed to initialize Google signup.");
      setIsLoading(false);
    }
  };

  /* ─────────────────────────────── UI ─────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Left Panel – Branding ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Grid pattern */}
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
            Get started in
            <br />
            <span className="text-indigo-400">minutes, not days.</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Create your KlearView account and gain full access to vendor onboarding, compliance tracking, and payment analytics.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {[
              "Secure OTP-based email verification",
              "Instant access to the vendor dashboard",
              "Role-based permissions from day one",
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

        <AnimatePresence mode="wait">

            {/* ── Step 1: Registration Form ── */}
            {step === "initial" && (
              <motion.div
                key="initial"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create an account</h2>
                  <p className="text-slate-500 text-sm mt-1">Join KlearView as a vendor</p>
                </div>

                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  {/* Full name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="signup-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="signup-email"
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
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 chars, mixed case + symbol"
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

                  {/* Confirm password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
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

                  <button
                    id="signup-submit"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-600/20 active:scale-[0.99]"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
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
                  id="google-signup"
                  type="button"
                  onClick={handleGoogleSignUp}
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

                {/* Sign in link */}
                <p className="text-center text-sm text-slate-500 mt-6">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ── Step 2: OTP Verification ── */}
            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
              >
                <button
                  type="button"
                  onClick={() => { setStep("initial"); setError(null); setOtp(""); }}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                {/* Info banner */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <div className="h-9 w-9 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <KeyRound className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Check your inbox</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      We&apos;ve sent a 6-digit code to{" "}
                      <span className="font-semibold text-slate-700">{email}</span>
                    </p>
                  </div>
                </div>

                {devInfo && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-3 text-xs mb-4">
                    <span className="font-semibold">Dev mode:</span> {devInfo}
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Enter verification code
                    </label>
                    {/* OTP inputs */}
                    <div className="flex justify-between gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          ref={(el) => { inputRefs.current[index] = el; }}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={otp.split("")[index]?.trim() || ""}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-11 h-13 text-center text-lg font-bold text-slate-900 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                          style={{ height: "52px" }}
                        />
                      ))}
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
                  </AnimatePresence>

                  <button
                    id="verify-otp-submit"
                    type="submit"
                    disabled={isLoading || otp.replace(/\s/g, "").length !== 6}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-600/20 active:scale-[0.99]"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & create account"}
                  </button>

                  {/* Resend */}
                  <div className="text-center">
                    <span className="text-sm text-slate-500">Didn&apos;t receive the code? </span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={!canResend || isLoading}
                      className={`text-sm font-medium transition-colors ${
                        canResend
                          ? "text-indigo-600 hover:text-indigo-700"
                          : "text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {canResend ? "Resend" : `Resend in ${formatTime(timer)}`}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── Step 3: Success ── */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-12 space-y-4"
              >
                <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Account created!</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Your KlearView account is ready.
                  <br />
                  Redirecting to your dashboard…
                </p>
                <div className="w-8 h-1 bg-indigo-600 rounded-full animate-pulse mt-2" />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
