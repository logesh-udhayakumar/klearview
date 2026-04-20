"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, CheckCircle, Loader2, AlertCircle, KeyRound, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token is missing or invalid.");
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <div className="flex items-center justify-center p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl w-full max-w-md">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
          alt="Reset Password Banner" 
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
              Identity <br/>
              <span className="text-blue-500">Restoration</span> <br/>
              Protocol.
            </h2>
            <p className="text-lg xl:text-xl text-white/50 font-medium leading-relaxed max-w-sm">
              Re-establish your encrypted access credentials through our secure sovereignty verification system.
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

      {/* Reset Card - Ultra Compact */}
      <motion.div 
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", damping: 25, delay: 0.2 }}
        className="w-full max-w-[350px] p-[1px] bg-gradient-to-b from-white/30 to-white/5 rounded-[1.8rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative z-20 mx-4"
      >
        <div className="bg-white/10 backdrop-blur-[50px] rounded-[1.7rem] p-7 overflow-hidden relative border border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="text-center mb-7 relative z-10">
            <h1 className="text-xl font-black text-white tracking-tight">Security Reset</h1>
            <p className="text-[12px] text-white/50 mt-1 font-medium">Update access keys.</p>
          </div>

          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5 py-4 relative z-10"
            >
              <div className="flex justify-center flex-col items-center gap-4 text-green-400">
                <div className="w-16 h-16 bg-green-500/10 rounded-[1.2rem] flex items-center justify-center border border-green-500/20 backdrop-blur-md">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <p className="font-black text-lg tracking-tight text-white">Success</p>
              </div>
              <p className="text-[11px] text-white/40 font-medium leading-relaxed">Protocol restored.<br/>Redirecting...</p>
              <Link href="/login" className="inline-block text-white font-black hover:text-blue-400 py-2.5 px-6 bg-white/5 border border-white/10 rounded-xl transition-all uppercase tracking-widest text-[8px]">
                Sign In
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5 relative z-10">
              <div className="space-y-3">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 group-focus-within:text-blue-400 transition-colors z-10" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    required
                    className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium text-white text-[13px] placeholder:text-white/30"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 group-focus-within:text-blue-400 transition-colors z-10" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm keys"
                    required
                    className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium text-white text-[13px] placeholder:text-white/30"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-[11px] bg-red-500/10 p-3 rounded-xl border border-red-500/20 backdrop-blur-md">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <p className="font-bold">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !!error}
                className="w-full py-3.5 px-4 bg-white hover:bg-gray-100 text-[#0f172a] rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-2xl uppercase tracking-[0.15em] text-[10px]"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalize Key Update"}
              </button>

              <Link 
                href="/login" 
                className="block text-center text-[8px] font-black text-white/30 hover:text-white transition-colors uppercase tracking-[0.4em]"
              >
                Abort
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
