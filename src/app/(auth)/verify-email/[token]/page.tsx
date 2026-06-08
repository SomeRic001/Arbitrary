"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const VerifyEmailPage = () => {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = useState<"loading" | "success" | "already-verified" | "error">("loading");
  const [error, setError] = useState("");
  const [mounted] = useState(true);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify-email/${token}`);
        const data = await res.json();
        if (data.valid) {
          setStatus(data.alreadyVerified ? "already-verified" : "success");
        } else {
          setStatus("error");
          setError(data.error || "Verification failed");
        }
      } catch {
        setStatus("error");
        setError("Something went wrong. Please try again.");
      }
    }
    if (token) verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10 relative overflow-hidden selection:bg-[#FACC15] selection:text-black">
      <style>{`
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .float-up   { animation: floatUp 0.5s cubic-bezier(0.23,1,0.32,1) forwards; }
        .float-up-2 { animation: floatUp 0.5s cubic-bezier(0.23,1,0.32,1) 0.07s forwards; opacity: 0; }
        .float-up-3 { animation: floatUp 0.5s cubic-bezier(0.23,1,0.32,1) 0.14s forwards; opacity: 0; }
      `}</style>

      <div className="relative z-10 w-full max-w-sm">
        <div className={`relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-t-3xl px-8 pt-8 pb-10 ${mounted ? "float-up" : "opacity-0"}`}>
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute right-12 -bottom-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative z-10 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 bg-[#FACC15] rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
              <span className="text-black font-black text-xl">A</span>
            </div>
            <div>
              <h1 className="text-white text-2xl font-black tracking-[0.15em] uppercase">Arbitrary</h1>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-[0.25em] mt-1">Email verification</p>
            </div>
          </div>
        </div>

        <div className={`h-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative ${mounted ? "float-up" : "opacity-0"}`}>
          <div className="absolute inset-x-0 bottom-0 h-4 bg-white rounded-t-3xl" />
        </div>

        <div className={`bg-white rounded-b-3xl border border-gray-100 border-t-0 shadow-xl shadow-black/5 px-8 pb-8 ${mounted ? "float-up-2" : "opacity-0"}`}>
          {status === "loading" && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-4 pt-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Email verified!</p>
              <p className="text-xs text-gray-500 leading-relaxed">Your account is now active. You can sign in with your credentials.</p>
              <Link href="/login" className="inline-block mt-1 py-2.5 px-6 rounded-xl bg-[#FACC15] text-black text-xs font-black uppercase tracking-[0.15em] hover:bg-[#eab308] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                Sign in
              </Link>
            </div>
          )}

          {status === "already-verified" && (
            <div className="text-center space-y-4 pt-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Already verified</p>
              <p className="text-xs text-gray-500 leading-relaxed">Your email has already been verified. You can sign in with your credentials.</p>
              <Link href="/login" className="inline-block mt-1 py-2.5 px-6 rounded-xl bg-[#FACC15] text-black text-xs font-black uppercase tracking-[0.15em] hover:bg-[#eab308] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                Sign in
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4 pt-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Verification failed</p>
              <p className="text-xs text-gray-500 leading-relaxed">{error}</p>
              <Link href="/verify-email" className="inline-block mt-1 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:underline transition-colors">
                Request a new verification link
              </Link>
            </div>
          )}
        </div>

        <div className={`text-center mt-5 ${mounted ? "float-up-3" : "opacity-0"}`}>
          <button onClick={() => router.push("/")} className="group inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-gray-700 transition-colors duration-200">
            <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
            Back to site
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
