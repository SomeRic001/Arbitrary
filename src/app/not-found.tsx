import Link from "next/link";
import { GoBackButton } from "./_components/GoBackButton";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm w-full max-w-md overflow-hidden">
        {/* Dark header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-8 pb-8">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute right-16 -bottom-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative z-10">
            <h1 className="text-8xl font-black text-white leading-none">
              404
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mt-2">
              PAGE NOT FOUND
            </p>
          </div>
        </div>

        {/* SVG curved transition */}
        <div className="relative h-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <svg className="absolute bottom-0 w-full h-6" viewBox="0 0 600 24" preserveAspectRatio="none">
            <path d="M0,24 Q300,-4 600,24" fill="white" />
          </svg>
        </div>

        {/* Body */}
        <div className="px-6 pb-8 pt-4 text-center">
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Link
              href="/"
              className="bg-[#FACC15] hover:bg-black hover:text-[#FACC15] text-black font-black text-xs uppercase tracking-wider px-6 py-3 rounded-2xl transition-all duration-200"
            >
              GO HOME
            </Link>
            <GoBackButton />
          </div>
        </div>
      </div>
    </div>
  );
}
