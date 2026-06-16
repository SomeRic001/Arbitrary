"use client";

// src/components/tilt/tilt-loading-screen.tsx
//
// Tilt-branded splash shown on hard reload of any /tilt/* route.
// Zero dependency on Arbitrary's LoadingScreen, LoadingWrapper, or NextAuth.
//
// Visual identity:
//   • Background : #0a160b  (dark bottle-green — immersive, not the page bg)
//   • Accent     : #c8e63c  (lime-yellow — Tilt's primary colour)
//   • Stripes    : #d42b2b  (red, top + bottom — Tilt's signature mark)
//   • Word reveal: "TILT" letter-by-letter with a lime cursor (≠ Arbitrary white)

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TiltLoadingScreen() {
  const word = "TILT";
  const [revealed, setRevealed] = useState(0);
  const [barDone, setBarDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let i = 0;
    intervalRef.current = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= word.length) clearInterval(intervalRef.current!);
    }, 160);

    // Progress bar runs for 2.4 s → then show subtext
    const barTimer = setTimeout(() => setBarDone(true), 2400);

    return () => {
      clearInterval(intervalRef.current!);
      clearTimeout(barTimer);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0a160b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* ── Red stripe — top ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background:
            "linear-gradient(90deg, #a01c1c 0%, #d42b2b 50%, #a01c1c 100%)",
          transformOrigin: "left",
        }}
      />

      {/* ── Ambient glow ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          width: "520px",
          height: "520px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(28,74,30,0.45) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Logo mark ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "72px",
          height: "72px",
          background: "#c8e63c",
          borderRadius: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 40px rgba(200,230,60,0.4)",
          marginBottom: "28px",
        }}
      >
        <span
          style={{
            color: "#0e1f10",
            fontWeight: 900,
            fontSize: "38px",
            lineHeight: 1,
            fontFamily: "monospace",
          }}
        >
          ~
        </span>
      </motion.div>

      {/* ── Letter-by-letter word reveal ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "40px" }}>
        {word.split("").map((letter, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={
              revealed > i ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
            }
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: "clamp(2.5rem, 10vw, 5rem)",
              fontWeight: 900,
              letterSpacing: "0.2em",
              color: "#ffffff",
              fontFamily: "'Arial Black', Arial, sans-serif",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            {letter}
          </motion.span>
        ))}

        {/* Lime-yellow cursor — Arbitrary uses white; this is deliberate */}
        <motion.span
          animate={
            revealed < word.length ? { opacity: [1, 0, 1] } : { opacity: 0 }
          }
          transition={
            revealed < word.length
              ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.4 }
          }
          style={{
            display: "inline-block",
            width: "0.08em",
            height: "0.75em",
            background: "#c8e63c",
            marginLeft: "4px",
            alignSelf: "center",
          }}
        />
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          width: "clamp(120px, 28vw, 220px)",
          height: "2px",
          background: "rgba(200,230,60,0.1)",
          borderRadius: "1px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2.4, ease: [0.65, 0, 0.35, 1] }}
          style={{
            position: "absolute",
            inset: 0,
            background: "#c8e63c",
            transformOrigin: "left",
          }}
        />
      </div>

      {/* ── Subtext — appears after bar ──────────────────────────────────── */}
      <AnimatePresence>
        {barDone && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              marginTop: "20px",
              fontSize: "10px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "rgba(200,230,60,0.45)",
            }}
          >
            Tiltyourmusic · Events
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Red stripe — bottom ──────────────────────────────────────────── */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "4px",
          background:
            "linear-gradient(90deg, #a01c1c 0%, #d42b2b 50%, #a01c1c 100%)",
          transformOrigin: "left",
        }}
      />
    </div>
  );
}
