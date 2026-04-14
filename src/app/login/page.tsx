"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, Chrome, Loader2, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

      // Role-based redirection
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
      // In a real app we'd redirect to Google OAuth flow.
      const mockGoogleId = "google-oauth2|123456789"; // simulating existing user
      const mockGoogleEmail = "demo@gmail.com";

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mockGoogleEmail, google_id: mockGoogleId, action: "login" }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.isBlocked) {
          setBlockedReason(data.remarks);
          setShowBlockedDialog(true);
          return;
        }
        throw new Error(data.message || "Google auth failed. Account may not exist.");
      }

      if (data.isNewUser) {
        // Normally redirect to signup if trying to log in but account doesn't exist
        router.push("/signup");
      } else {
        localStorage.setItem("user", JSON.stringify(data.user));

        // Role-based redirection
        if (data.user.user_type?.toLowerCase() === "vendor" && data.user.vendor_id) {
          router.push(`/vendor-dashboard/${data.user.vendor_id}`);
        } else {
          router.push("/dashboard");
        }
      }
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
          alt="Login Banner"
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
              Advanced <br />
              <span className="text-blue-500">Intelligence</span> <br />
              Dashboard.
            </h2>
            <p className="text-lg xl:text-xl text-white/50 font-medium leading-relaxed max-w-sm">
              Access real-time vendor insights, payment analytics and sovereign data management.
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
        {/* <div className="p-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl">
          <img src="/images/logo_trans.png" alt="Logo" className="h-10 w-auto filter brightness-110" />
        </div> */}
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white tracking-[0.1em] uppercase drop-shadow-lg leading-none">Klear View</span>
          <span className="text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase mt-1 opacity-80">Vendor Portal</span>
        </div>
      </motion.div>

      {/* Sign-In Card - Ultra Compact */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", damping: 25, delay: 0.2 }}
        className="w-full max-w-[350px] p-[1px] bg-gradient-to-b from-white/30 to-white/5 rounded-[1.8rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative z-20 mx-4"
      >
        <div className="bg-white/10 backdrop-blur-[50px] rounded-[1.7rem] p-7 overflow-hidden relative border border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

          {!showForgotPassword ? (
            <>
              <div className="text-center mb-7 relative z-10">
                <h1 className="text-xl font-black text-white tracking-tight">Login Portal</h1>
                <p className="text-[12px] text-white/50 mt-1 font-medium">Identity check required.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 relative z-10">
                <div className="space-y-3">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 group-focus-within:text-blue-400 transition-all z-10" />
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
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 group-focus-within:text-blue-400 transition-all z-10" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Security password"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium text-white text-[13px] placeholder:text-white/30"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[8px] font-black text-blue-400 hover:text-blue-300 transition-colors tracking-[0.2em] uppercase"
                  >
                    Forgot Password?
                  </button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-2 text-red-400 text-[11px] bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 font-medium backdrop-blur-md"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p className="leading-snug">{error}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 bg-white hover:bg-gray-100 text-[#0f172a] rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-2xl active:scale-[0.98] uppercase tracking-[0.15em] text-[10px]"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Login <LogIn className="w-3.5 h-3.5" /></>}
                </button>
              </form>

              <div className="mt-7 flex items-center justify-between text-[7px] text-white/20 uppercase tracking-[0.3em] font-black">
                <div className="w-full h-px bg-white/10" />
                <span className="px-3 whitespace-nowrap">Encryption Gate</span>
                <div className="w-full h-px bg-white/10" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full mt-5 py-3 px-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 backdrop-blur-md active:scale-[0.98] text-[12px]"
              >
                <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" className="w-4 h-4 filter brightness-125" alt="Google" />
                Continue with Google
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-[1rem] flex items-center justify-center mb-4 text-blue-400 border border-blue-500/20">
                  <Mail className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-black text-white tracking-tight">Recovery</h1>
                <p className="text-[11px] text-white/50 mt-1 font-medium px-2 leading-relaxed">Secure link transmission.</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-blue-400 transition-all" />
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="Registered email"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium text-white text-[13px]"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-red-400 text-[11px] bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 backdrop-blur-md">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p className="font-semibold leading-snug">{error}</p>
                  </div>
                )}
                {resetMessage && (
                  <div className="flex items-start gap-2 text-green-400 text-[11px] bg-green-500/10 p-2.5 rounded-xl border border-green-500/20 backdrop-blur-md">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p className="font-semibold leading-snug">{resetMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isResetLoading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/30 uppercase tracking-[0.15em] text-[10px]"
                >
                  {isResetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Transmit"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetMessage(null);
                    setError(null);
                  }}
                  className="w-full text-[8px] font-black text-white/40 hover:text-white transition-colors uppercase tracking-[0.4em] mt-1"
                >
                  Abort
                </button>
              </form>
            </>
          )}

          <div className="mt-8 pt-4 border-t border-white/10 text-center">
            <p className="text-[12px] text-white/40 font-medium tracking-tight">
              New User?{" "}
              <Link href="/signup" className="font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest text-[9px] ml-2 pb-0.5 border-b border-blue-400/20">
                Join Now
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Blocked Vendor Dialog */}
      {showBlockedDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f172a] rounded-[2.5rem] p-10 max-w-sm w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] relative z-50 border border-white/10"
          >
            <div className="flex items-center gap-4 text-red-500 mb-6">
              <div className="p-4 bg-red-500/10 rounded-3xl shrink-0 border border-red-500/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white leading-tight">Access<br />Denied</h3>
            </div>
            <p className="text-white/50 mb-6 text-sm leading-relaxed font-medium">
              Security protocol has identified a restriction on this account. Access to the intelligence dashboard is currently suspended.
            </p>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8 font-bold text-white text-[13px] italic tracking-wide">
              "{blockedReason || "No documentation provided for this restriction protocol."}"
            </div>
            <button
              onClick={() => setShowBlockedDialog(false)}
              className="w-full py-4.5 px-6 bg-white hover:bg-gray-100 text-[#0f172a] rounded-2xl font-black transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-[11px]"
            >
              Acknowledge
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
