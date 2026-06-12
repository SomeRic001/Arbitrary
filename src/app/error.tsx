"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="font-sans">
        <div className="min-h-screen flex flex-col bg-[#F5F5F0]">
          <main className="flex-1 flex items-center justify-center px-4">
            <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm w-full max-w-md overflow-hidden">
              {/* Dark header */}
              <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-5 pb-6">
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
                <div className="absolute right-16 -bottom-4 w-20 h-20 rounded-full bg-white/5" />
                <div className="relative z-10">
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">
                    Error
                  </p>
                  <h1 className="text-white text-2xl font-black leading-snug max-w-[300px]">
                    Something went wrong
                  </h1>
                  {error?.message &&
                   error.message !== "An error occurred" &&
                   error.message !== "Internal Server Error" && (
                    <p className="text-xs text-zinc-400 font-medium mt-2 max-w-xs text-center">
                      {error.message}
                    </p>
                  )}
                  <p className="text-white/50 text-xs font-black uppercase tracking-widest mt-1">
                    An unexpected error occurred
                  </p>
                </div>
              </div>

              {/* SVG curved transition */}
              <div className="relative h-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <svg
                  className="absolute bottom-0 w-full h-4"
                  viewBox="0 0 600 16"
                  preserveAspectRatio="none"
                >
                  <path d="M0,16 Q300,-8 600,16" fill="white" />
                </svg>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-4">
                <p className="text-zinc-600 text-sm leading-relaxed">
                  We&apos;re sorry for the inconvenience. Please try again.
                </p>
                <button
                  onClick={reset}
                  className="bg-[#FACC15] hover:bg-black hover:text-[#FACC15] text-black font-black text-xs uppercase tracking-wider px-6 py-3 rounded-2xl transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
