"use client";

// src/app/tilt/page.tsx
//
// Public Tilt event registration page.
// No authentication required to view or submit the registration form.
// Accessed via QR code at the event — pure guest registration only.
//
// Flow:
//   1. User fills in name / email / phone / address and clicks "Register".
//   2. POST /api/tilt/register → registration saved directly.
//   3. Success screen shown.

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants, Transition } from "framer-motion";

type PageStep = "form" | "success";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const riseVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.55,
      ease: EASE,
    } as Transition,
  }),
};

// ── Inline CSS ─────────────────────────────────────────────────────────────
const pageCss = `
  .tilt-input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255,255,255,0.04);
    border: 1.5px solid rgba(200,230,60,0.15);
    border-radius: 10px;
    font-size: 14px;
    color: #fff;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    font-family: inherit;
    box-sizing: border-box;
  }
  .tilt-input::placeholder { color: rgba(255,255,255,0.28); }
  .tilt-input:focus {
    border-color: #c8e63c;
    background: rgba(200,230,60,0.06);
  }
  .tilt-textarea { resize: none; min-height: 80px; }
  .tilt-label {
    display: block;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(200,230,60,0.6);
    margin-bottom: 6px;
  }
  .tilt-btn {
    position: relative;
    width: 100%;
    padding: 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    background: #c8e63c;
    color: #0e1f10;
    border: none;
    cursor: pointer;
    margin-top: 8px;
    font-family: inherit;
    overflow: hidden;
    transition: transform 0.15s, opacity 0.2s;
  }
  .tilt-btn:hover { transform: scale(1.015); }
  .tilt-btn:active { transform: scale(0.985); }
  .tilt-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

export default function TiltPage() {
  const [step, setStep] = useState<PageStep>("form");
  const [mounted, setMounted] = useState(false);

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Register | Tilt Event";
    setMounted(true);
  }, []);

  // ── Submit form → save registration ──────────────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      address: fd.get("address") as string,
    };

    try {
      const res = await fetch("/api/tilt/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        setIsLoading(false);
        return;
      }

      setStep("success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={riseVariants}
          className="relative z-10 w-full max-w-sm text-center"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "rgba(200,230,60,0.12)",
              border: "1.5px solid rgba(200,230,60,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              style={{ width: "40px", height: "40px", color: "#c8e63c" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <h1
              style={{
                color: "#fff",
                fontSize: "22px",
                fontWeight: 900,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              You&apos;re registered!
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "14px",
                marginTop: "8px",
              }}
            >
              We&apos;ve received your details. See you at Tilt.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 28px",
                background: "#c8e63c",
                color: "#0e1f10",
                fontSize: "12px",
                fontWeight: 900,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                borderRadius: "10px",
                textDecoration: "none",
              }}
            >
              Back to Arbitrary
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-14 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "-80px",
          right: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(28,74,30,0.4) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <style>{pageCss}</style>

      <div className="relative z-10 w-full max-w-sm">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={riseVariants}
          style={{
            background: "linear-gradient(135deg, #1a4a1f 0%, #0e2b10 100%)",
            border: "1.5px solid rgba(200,230,60,0.2)",
            borderRadius: "18px 18px 0 0",
            padding: "28px 32px 24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              height: "2px",
              background:
                "linear-gradient(90deg, transparent, #d42b2b 20%, #d42b2b 80%, transparent)",
              opacity: 0.5,
            }}
          />

          <div className="flex flex-col items-center text-center gap-3 relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4, ease: EASE }}
              style={{
                width: "56px",
                height: "56px",
                background: "#c8e63c",
                borderRadius: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 24px rgba(200,230,60,0.35)",
              }}
            >
              <span
                style={{
                  color: "#0e1f10",
                  fontWeight: 900,
                  fontSize: "30px",
                  lineHeight: 1,
                }}
              >
                ~
              </span>
            </motion.div>

            <div>
              <h1
                style={{
                  color: "#fff",
                  fontSize: "24px",
                  fontWeight: 900,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                tilt
              </h1>
              <p
                style={{
                  color: "rgba(200,230,60,0.65)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  margin: "5px 0 0",
                }}
              >
                Event Registration
              </p>
            </div>
          </div>
        </motion.div>

        {/* Red-stripe seam */}
        <div
          style={{
            height: "8px",
            background: "linear-gradient(135deg, #1a4a1f 0%, #0e2b10 100%)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: "2px",
              background: "#d42b2b",
              transform: "translateY(-50%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "8px",
              background: "#0e1f10",
              borderRadius: "12px 12px 0 0",
            }}
          />
        </div>

        {/* ── Form body ───────────────────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.1}
          variants={riseVariants}
          style={{
            background: "#0e1f10",
            border: "1.5px solid rgba(200,230,60,0.12)",
            borderTop: "none",
            borderRadius: "0 0 18px 18px",
            padding: "24px 32px 32px",
          }}
        >
          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "rgba(212,43,43,0.12)",
                  border: "1px solid rgba(212,43,43,0.35)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "20px",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    color: "#e05555",
                    fontSize: "12px",
                    fontWeight: 600,
                    flex: 1,
                  }}
                >
                  {error}
                </span>
                <button
                  onClick={() => setError("")}
                  style={{
                    color: "rgba(212,43,43,0.6)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    style={{ width: "14px", height: "14px" }}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={handleFormSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {[
              {
                id: "name",
                label: "Full Name",
                type: "text",
                placeholder: "Your full name",
                autoComplete: "name",
              },
              {
                id: "email",
                label: "Email",
                type: "email",
                placeholder: "your@email.com",
                autoComplete: "email",
              },
              {
                id: "phone",
                label: "Phone Number",
                type: "tel",
                placeholder: "+977 98XXXXXXXX",
                autoComplete: "tel",
              },
            ].map((field, i) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 16 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: 0.15 + i * 0.06,
                  duration: 0.4,
                  ease: EASE,
                }}
              >
                <label htmlFor={field.id} className="tilt-label">
                  {field.label}
                </label>
                <input
                  id={field.id}
                  name={field.id}
                  type={field.type}
                  required
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  className="tilt-input"
                />
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.33, duration: 0.4, ease: EASE }}
            >
              <label htmlFor="address" className="tilt-label">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                required
                rows={3}
                placeholder="Your full address"
                className="tilt-input tilt-textarea"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.39, duration: 0.4, ease: EASE }}
            >
              <button type="submit" disabled={isLoading} className="tilt-btn">
                {isLoading ? "Saving…" : "Register for Tilt"}
              </button>
            </motion.div>
          </form>
        </motion.div>

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-center mt-6"
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(200,230,60,0.3)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "rgba(200,230,60,0.7)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(200,230,60,0.3)")
            }
          >
            <span>←</span> Back to Arbitrary
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
