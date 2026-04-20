"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/db";
import { Loader2, AlertCircle } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action") || "login";
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session) {
          throw new Error("No active session found. Please try again.");
        }

        const email = session.user.email;
        // In Supabase, the user.id is the UUID from auth.users, while identities contains the provider id
        const google_id = session.user.id; 

        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, google_id, action }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 403 && data.isBlocked) {
            setError(`Account Blocked: ${data.remarks}`);
            return;
          }
          throw new Error(data.message || "Authentication failed");
        }

        if (action === "login") {
            if (data.isNewUser) {
                router.push("/signup");
            } else {
                localStorage.setItem("user", JSON.stringify(data.user));
                if (data.user.user_type?.toLowerCase() === "vendor" && data.user.vendor_id) {
                    router.push(`/vendor-dashboard/${data.user.vendor_id}`);
                } else {
                    router.push("/dashboard");
                }
            }
        } else {
            // signup flow
            if (data.isNewUser) {
                const finalizeRes = await fetch("/api/auth/signup", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email, google_id, user_type: "Vendor" }),
                });
                const finalizeData = await finalizeRes.json();
                if (!finalizeRes.ok) throw new Error(finalizeData.message || "Failed to finalize account");
            }
            localStorage.setItem("user", JSON.stringify({ email, user_type: "Vendor" }));
            router.push("/dashboard");
        }

      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "An unexpected error occurred during authentication.");
      }
    };

    handleAuth();
  }, [router, action]);

  if (error) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Failed</h2>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button 
            onClick={() => router.push(`/${action === "login" ? "login" : "signup"}`)}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all"
        >
          Back to {action === "login" ? "Login" : "Sign Up"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
      <h2 className="text-xl font-bold text-slate-900 mb-2">Completing sign in...</h2>
      <p className="text-sm text-slate-500">Please wait while we set up your account.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full flex flex-col items-center justify-center">
        <Suspense fallback={
          <div className="flex flex-col items-center text-center">
             <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
             <p className="text-sm text-slate-500">Loading...</p>
          </div>
        }>
          <AuthCallbackContent />
        </Suspense>
      </div>
    </div>
  );
}
