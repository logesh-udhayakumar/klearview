"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Chrome, Loader2, CheckCircle2, KeyRound, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

      if (data.devMode) {
        setDevInfo(data.message);
      } else {
        setDevInfo(null);
      }

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

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    let otpArray = otp.split('');
    while (otpArray.length < 6) otpArray.push('');

    otpArray[index] = digit;
    setOtp(otpArray.join(''));

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && index > 0 && (!otp.split('')[index] || otp.split('')[index] === ' ')) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setError("Password must be at least 8 characters, with uppercase, lowercase, number and special character.");
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

      if (data.devMode) {
        setDevInfo(data.message);
      } else {
        setDevInfo(null);
      }

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
      // In a real app we'd redirect to Google OAuth flow or use Firebase/Supabase Auth.
      // Here we simulate the callback process for demonstrating the exact logic requested.
      const mockGoogleId = "google-oauth2|123456789";
      const mockGoogleEmail = `${Math.random().toString(36).substring(7)}@gmail.com`;

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mockGoogleEmail, google_id: mockGoogleId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Google auth failed");

      if (data.isNewUser) {
        // Automatically finalize Google sign up as Vendor
        const finalizeRes = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: mockGoogleEmail,
            google_id: mockGoogleId,
            user_type: "Vendor",
          }),
        });
        const finalizeData = await finalizeRes.json();
        if (!finalizeRes.ok) throw new Error(finalizeData.message || "Failed to finalize account");
      }

      localStorage.setItem("user", JSON.stringify({ email: mockGoogleEmail, user_type: "Vendor" }));
      setStep("success");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center lg:justify-end lg:pr-[10%] xl:pr-[12%] relative overflow-hidden font-sans bg-[#050a14]">
      {/* Background Banner - Full Width/Height */}
      <div className="absolute inset-0 z-0 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-[#050a14]/60 via-[#050a14]/60 to-[#050a14]/90 z-10" />
        <div className="absolute inset-0 bg-blue-900/5 backdrop-blur-[0.5px] z-10" />
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="/images/login_banner.png"
          alt="Signup Banner"
          className="w-full h-full object-cover"
        />

        {/* Left Side Branding Content */}
        <div className="absolute inset-0 hidden lg:flex items-center px-20 xl:px-32 z-20 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="max-w-lg"
          >
            <h2 className="text-5xl xl:text-6xl font-black mb-6 leading-tight tracking-tighter">
              Secure <br />
              <span className="text-blue-500">Onboarding</span> <br />
              Process.
            </h2>
            <p className="text-lg xl:text-xl text-white/50 font-medium leading-relaxed max-w-sm">
              Establish your sovereign identity and integrate into the Klear View intelligence network.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Brand Identity - Top Left */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-10 z-30 flex items-center gap-4 group cursor-default"
      >
        <div className="p-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl">
          <img src="/images/logo_trans.png" alt="Logo" className="h-10 w-auto filter brightness-110" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white tracking-[0.1em] uppercase drop-shadow-lg leading-none">Klear View</span>
          <span className="text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase mt-1 opacity-80">Corporate Portal</span>
        </div>
      </motion.div>

      {/* Signup Card - Further Reduced Size */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", damping: 25, delay: 0.2 }}
        className="w-full max-w-[360px] p-[1px] bg-gradient-to-b from-white/30 to-white/5 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative z-20 mx-4"
      >
        <div className="bg-white/10 backdrop-blur-[50px] rounded-[1.9rem] p-8 overflow-hidden relative border border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="text-center mb-7 relative z-10">
            {/* <div className="mx-auto mb-5 inline-block p-3.5 bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/10">
              <img src="/images/logo_trans.png" alt="Klear View Logo" className="mx-auto h-11 w-auto drop-shadow-lg" />
            </div> */}
            <h1 className="text-xl font-black text-white tracking-tight">Identity Setup</h1>
            <p className="text-[12px] text-white/50 mt-1.5 font-medium">Register portal access.</p>
          </div>

          <AnimatePresence mode="wait">
            {step === "initial" && (
              <motion.div
                key="initial"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="relative z-10"
              >
                <form onSubmit={handleEmailSignUp} className="space-y-3.5">
                  <div className="space-y-3">
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 group-focus-within:text-blue-400 transition-colors z-10" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium text-white text-[13px] placeholder:text-white/30"
                      />
                    </div>

                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 group-focus-within:text-blue-400 transition-colors z-10" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Corporate email"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium text-white text-[13px] placeholder:text-white/30"
                      />
                    </div>

                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 group-focus-within:text-blue-400 transition-colors z-10" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New password"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium text-white text-[13px] placeholder:text-white/30"
                      />
                    </div>

                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 group-focus-within:text-blue-400 transition-colors z-10" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium text-white text-[13px] placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-start gap-2.5 text-red-400 text-[11px] bg-red-500/10 p-3 rounded-xl border border-red-500/20 font-medium backdrop-blur-md"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <p className="leading-snug">{error}</p>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 bg-white hover:bg-gray-100 text-[#0f172a] rounded-xl font-black transition-all flex items-center justify-center gap-2.5 shadow-2xl active:scale-[0.98] uppercase tracking-[0.15em] text-[10px]"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Identity"}
                  </button>
                </form>

                <div className="mt-7 flex items-center justify-between text-[8px] text-white/20 uppercase tracking-[0.3em] font-black">
                  <div className="w-full h-px bg-white/10" />
                  <span className="px-3 whitespace-nowrap">Encryption Check</span>
                  <div className="w-full h-px bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                  className="w-full mt-5 py-3 px-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 backdrop-blur-md active:scale-[0.98] text-[12px]"
                >
                  <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" className="w-4 h-4 filter brightness-125" alt="Google" />
                  Continue with Google
                </button>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative z-10"
              >
                <div className="text-center mb-7 bg-blue-500/10 p-4 rounded-[1.2rem] border border-blue-500/20 backdrop-blur-md">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-[0.8rem] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-600/30">
                    <Mail className="w-6 h-6" />
                  </div>
                  <p className="text-white/50 text-[11px] font-medium leading-relaxed">
                    Verification sent to
                    <br />
                    <span className="font-black text-white text-[12px]">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="flex justify-between gap-1">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp.split('')[index]?.trim() || ""}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-9 h-12 text-center text-xl font-black text-white bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all"
                      />
                    ))}
                  </div>

                  {error && <p className="text-[11px] text-red-400 text-center font-bold bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 backdrop-blur-md">{error}</p>}

                  <button
                    type="submit"
                    disabled={isLoading || otp.replace(/\s/g, '').length !== 6}
                    className="w-full py-3.5 px-4 bg-white hover:bg-gray-100 text-[#0f172a] rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-2xl uppercase tracking-[0.15em] text-[10px]"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validate Identity"}
                  </button>

                  <div className="text-center mt-6">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={!canResend || isLoading}
                      className={`text-[8px] font-black tracking-[0.2em] uppercase transition-colors ${canResend
                          ? "text-blue-400 hover:text-blue-300 border-b border-blue-400/20"
                          : "text-white/20 cursor-not-allowed"
                        }`}
                    >
                      Resend {!canResend && `in ${formatTime(timer)}`}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("initial")}
                    disabled={isLoading}
                    className="w-full py-2 px-4 hover:bg-white/5 text-white/30 rounded-xl font-black transition-all text-[8px] mt-1 uppercase tracking-[0.3em]"
                  >
                    Back to Details
                  </button>
                </form>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 flex flex-col items-center justify-center text-center space-y-3 relative z-10"
              >
                <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-[1.5rem] flex items-center justify-center mb-2 shadow-inner border border-green-500/20 backdrop-blur-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">Access Granted</h2>
                <p className="text-[12px] text-white/40 font-medium leading-relaxed">Identity established.<br />Redirecting...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {step === "initial" && (
            <div className="mt-7 pt-4 border-t border-white/10 text-center relative z-10">
              <p className="text-[12px] text-white/40 font-medium tracking-tight">
                Already member?{" "}
                <Link href="/login" className="font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest text-[10px] ml-2 pb-0.5 border-b border-blue-400/20">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
