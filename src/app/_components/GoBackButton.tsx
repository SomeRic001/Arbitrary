"use client";

import { useRouter } from "next/navigation";

export function GoBackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-2xl transition-all duration-200"
    >
      GO BACK
    </button>
  );
}
