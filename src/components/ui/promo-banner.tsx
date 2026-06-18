"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const BANNER_CONFIG = {
  eventDate: "2026-08-15T20:00:00",
  registerHref: "/participants",
  storageKey: "tilt-promo-banner-dismissed-v2",
} as const;

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
}

function calcTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
  const totalMinutes = Math.floor(diff / 1000 / 60);
  const days = Math.floor(totalMinutes / 60 / 24);
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes, expired: false };
}

function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <span
      aria-hidden="true"
      className="absolute pointer-events-none select-none"
      style={style}
    >
      ✦
    </span>
  );
}

function updateBannerHeight(el: HTMLElement | null) {
  const h = el ? el.getBoundingClientRect().height : 0;
  document.documentElement.style.setProperty("--banner-h", `${h}px`);
}

export default function PromoBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(
    calcTimeLeft(BANNER_CONFIG.eventDate),
  );
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(BANNER_CONFIG.storageKey);
    const isDismissed = stored === "true";
    setDismissed(isDismissed);
    setMounted(true);

    if (isDismissed) {
      document.documentElement.style.setProperty("--banner-h", "0px");
    }
  }, []);

  // Set CSS var once banner is visible in the DOM
  useEffect(() => {
    if (!mounted || dismissed) return;

    // Use rAF to ensure layout has painted before measuring
    const id = requestAnimationFrame(() => {
      updateBannerHeight(bannerRef.current);
    });

    // Also handle window resize
    const onResize = () => updateBannerHeight(bannerRef.current);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResize);
    };
  }, [mounted, dismissed]);

  useEffect(() => {
    if (dismissed) return;
    const id = setInterval(
      () => setTimeLeft(calcTimeLeft(BANNER_CONFIG.eventDate)),
      30_000,
    );
    return () => clearInterval(id);
  }, [dismissed]);

  const handleDismiss = () => {
    document.documentElement.style.setProperty("--banner-h", "0px");
    setDismissed(true);
    localStorage.setItem(BANNER_CONFIG.storageKey, "true");
  };

  if (!mounted || dismissed) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      id="promo-banner"
      ref={bannerRef}
      role="banner"
      aria-label="Promotional announcement"
      className="fixed top-0 left-0 right-0 w-full overflow-hidden z-[10000]"
      style={{
        background:
          "linear-gradient(90deg, #15803d 0%, #16a34a 30%, #22c55e 60%, #15803d 100%)",
      }}
    >
      <Particle
        style={{
          top: "4px",
          left: "3%",
          fontSize: "8px",
          color: "rgba(255,255,255,0.5)",
        }}
      />
      <Particle
        style={{
          top: "2px",
          left: "12%",
          fontSize: "6px",
          color: "rgba(255,255,255,0.35)",
        }}
      />
      <Particle
        style={{
          bottom: "4px",
          left: "22%",
          fontSize: "7px",
          color: "rgba(255,255,255,0.4)",
        }}
      />
      <Particle
        style={{
          top: "3px",
          left: "42%",
          fontSize: "5px",
          color: "rgba(255,255,255,0.3)",
        }}
      />
      <Particle
        style={{
          bottom: "3px",
          left: "55%",
          fontSize: "9px",
          color: "rgba(255,255,255,0.45)",
        }}
      />
      <Particle
        style={{
          top: "5px",
          right: "32%",
          fontSize: "6px",
          color: "rgba(255,255,255,0.35)",
        }}
      />
      <Particle
        style={{
          bottom: "3px",
          right: "18%",
          fontSize: "8px",
          color: "rgba(255,255,255,0.4)",
        }}
      />
      <Particle
        style={{
          top: "2px",
          right: "8%",
          fontSize: "5px",
          color: "rgba(255,255,255,0.3)",
        }}
      />

      <div className="relative flex items-center justify-between gap-2 px-3 py-2 md:px-6 md:py-2.5">
        {/* LEFT — Branding badge */}
        <div className="flex-shrink-0 hidden sm:flex">
          <span
            className="text-white font-black text-[10px] md:text-xs tracking-widest uppercase px-3 py-1 rounded-full border border-white/40"
            style={{ background: "rgba(0,0,0,0.25)" }}
          >
            TUBORG × ARBITARY
          </span>
        </div>

        {/* CENTER — Event text */}
        <div className="flex-1 flex justify-center">
          <p className="text-white font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wider text-center leading-tight">
            <span className="sm:hidden font-black">
              TILT YOUR MUSIC SESSION
            </span>
            <span className="hidden sm:inline">
              <span className="font-black">TILT YOUR MUSIC SESSION</span>
              <span className="mx-2 opacity-60">—</span>
              <span className="font-medium opacity-90">
                Meet your favourite artist
              </span>
            </span>
          </p>
        </div>

        {/* RIGHT — Countdown + Register + Close */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {!timeLeft.expired ? (
            <span
              className="hidden md:flex items-center gap-1.5 text-white font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full"
              style={{ background: "rgba(0,0,0,0.3)" }}
              aria-live="polite"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              CLOSES IN {pad(timeLeft.days)}D {pad(timeLeft.hours)}H
            </span>
          ) : (
            <span className="hidden md:inline text-white/70 text-[10px] font-black uppercase tracking-widest">
              EVENT CLOSED
            </span>
          )}

          <Link
            href={BANNER_CONFIG.registerHref}
            className="flex-shrink-0 bg-white text-green-700 font-black text-[10px] md:text-xs uppercase tracking-widest px-3 py-1.5 md:px-4 rounded-md hover:bg-green-50 transition-colors duration-150 shadow-sm"
          >
            PARTICIPANT
          </Link>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss promotional banner"
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors duration-150 p-0.5 rounded"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
