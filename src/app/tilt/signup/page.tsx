"use client";

// src/app/tilt/signup/page.tsx
//
// Two-step signup flow:
//   Step 1 — "details"  : user enters name / email / password → Send OTP
//   Step 2 — "verify"   : user enters the 6-digit code → account created
//
// The page never navigates between these steps; it keeps all state locally
// and swaps the rendered card, matching the existing single-page pattern
// used across the Tilt auth screens.

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "details" | "verify";

// ── shared inline styles / CSS ─────────────────────────────────────────────
const sharedCss = `
  @keyframes riseUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .rise  { animation: riseUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards; }
  .rise2 { animation: riseUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.1s forwards; opacity: 0; }
  .rise3 { animation: riseUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.2s forwards; opacity: 0; }

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
    box-sizing: border-box;
  }
  .tilt-input::placeholder { color: rgba(255,255,255,0.28); }
  .tilt-input:focus {
    border-color: #c8e63c;
    background: rgba(200,230,60,0.06);
  }

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
    overflow: hidden;
    background: #c8e63c;
    color: #0e1f10;
    border: none;
    cursor: pointer;
    transition: transform 0.15s, opacity 0.2s;
    margin-top: 8px;
  }
  .tilt-btn:hover { transform: scale(1.015); }
  .tilt-btn:active { transform: scale(0.985); }
  .tilt-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .tilt-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s;
  }
  .tilt-btn:hover::after { transform: translateX(100%); }

  .tilt-btn-ghost {
    background: transparent;
    border: 1.5px solid rgba(200,230,60,0.25);
    color: rgba(200,230,60,0.7);
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 10px 16px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    width: 100%;
  }
  .tilt-btn-ghost:hover:not(:disabled) {
    border-color: rgba(200,230,60,0.55);
    color: #c8e63c;
  }
  .tilt-btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }

  /* 6-digit OTP input grid */
  .otp-grid {
    display: flex;
    gap: 8px;
    justify-content: center;
  }
  .otp-digit {
    width: 44px;
    height: 52px;
    text-align: center;
    font-size: 22px;
    font-weight: 900;
    font-family: 'Courier New', monospace;
    color: #c8e63c;
    background: rgba(200,230,60,0.06);
    border: 1.5px solid rgba(200,230,60,0.2);
    border-radius: 10px;
    outline: none;
    caret-color: #c8e63c;
    transition: border-color 0.2s, background 0.2s;
    box-sizing: border-box;
  }
  .otp-digit:focus {
    border-color: #c8e63c;
    background: rgba(200,230,60,0.1);
  }
`;

// ── Reusable error banner ──────────────────────────────────────────────────
function ErrorBanner({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "rgba(212,43,43,0.12)",
        border: "1px solid rgba(212,43,43,0.35)",
        borderRadius: "10px",
        padding: "10px 14px",
        marginBottom: "20px",
      }}
    >
      <svg
        style={{
          width: "16px",
          height: "16px",
          color: "#d42b2b",
          flexShrink: 0,
        }}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        />
      </svg>
      <span
        style={{ color: "#e05555", fontSize: "12px", fontWeight: 600, flex: 1 }}
      >
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          color: "rgba(212,43,43,0.6)",
          background: "none",
          border: "none",
          cursor: "pointer",
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
    </div>
  );
}

// ── Brand header (shared between both steps) ───────────────────────────────
function TiltHeader({ subtitle }: { subtitle: string }) {
  return (
    <>
      <div
        style={{
          background: "linear-gradient(135deg, #1a4a1f 0%, #0e2b10 100%)",
          border: "1.5px solid rgba(200,230,60,0.2)",
          borderRadius: "18px 18px 0 0",
          padding: "32px 32px 28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Red stripe */}
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

        <div className="flex flex-col items-center text-center gap-4 relative z-10">
          <div
            style={{
              width: "60px",
              height: "60px",
              background: "#c8e63c",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 28px rgba(200,230,60,0.35)",
            }}
          >
            <span
              style={{
                color: "#0e1f10",
                fontWeight: 900,
                fontSize: "32px",
                lineHeight: 1,
              }}
            >
              ~
            </span>
          </div>
          <div>
            <h1
              style={{
                color: "#fff",
                fontSize: "26px",
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
                margin: "6px 0 0",
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Connector seam */}
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
    </>
  );
}

// ── Main page component ────────────────────────────────────────────────────
export default function TiltSignupPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("details");

  // Step 1 state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 state — 6 individual digit inputs
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Shared state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    document.title = "Sign Up | Tiltyourmusic";
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // ── Start 60-second resend cooldown ───────────────────────────────────
  function startCooldown() {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  // ── Step 1: request OTP ────────────────────────────────────────────────
  async function handleRequestOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/tilt/signup/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      // Advance to verification screen
      startCooldown();
      setDigits(["", "", "", "", "", ""]);
      setStep("verify");
      // Auto-focus first digit on next render
      setTimeout(() => digitRefs.current[0]?.focus(), 50);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Step 2: verify OTP ─────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const otp = digits.join("");
    if (otp.length < 6) {
      setError("Please enter all 6 digits of your verification code.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/tilt/signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/tilt/outlet");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Resend OTP ─────────────────────────────────────────────────────────
  async function handleResend() {
    if (resendCooldown > 0 || isLoading) return;
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/tilt/signup/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to resend code.");
        return;
      }
      startCooldown();
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => digitRefs.current[0]?.focus(), 50);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── OTP digit input handlers ───────────────────────────────────────────
  function handleDigitChange(index: number, value: string) {
    // Accept only digits; handle paste of full code
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) {
      // User pasted a multi-digit string — distribute across boxes
      const arr = [...digits];
      const chars = cleaned.slice(0, 6).split("");
      chars.forEach((ch, i) => {
        if (index + i < 6) arr[index + i] = ch;
      });
      setDigits(arr);
      const nextFocus = Math.min(index + chars.length, 5);
      digitRefs.current[nextFocus]?.focus();
      return;
    }
    const arr = [...digits];
    arr[index] = cleaned;
    setDigits(arr);
    if (cleaned && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  }

  function handleDigitKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const arr = [...digits];
      arr[index - 1] = "";
      setDigits(arr);
      digitRefs.current[index - 1]?.focus();
    }
  }

  // ── Layout shell ───────────────────────────────────────────────────────
  return (
    <div className="tilt-noise min-h-screen flex items-center justify-center px-4 py-14 relative overflow-hidden">
      {/* Bottle-green ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(28,74,30,0.55) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <style>{sharedCss}</style>

      <div className="relative z-10 w-full max-w-sm">
<<<<<<< Updated upstream
        {/* Brand text header */}
        <div className={`text-center mb-10 ${mounted ? "rise" : "opacity-0"}`}>
          <h1
            style={{
              color: "#fff",
              fontSize: "32px",
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
              color: "rgba(200,230,60,0.5)",
              fontSize: "13px",
              fontWeight: 600,
              marginTop: "8px",
            }}
          >
            Get your outlet on the map
          </p>
        </div>

        {/* Form body */}
        <div
          className={mounted ? "rise2" : "opacity-0"}
          style={{
            padding: "0",
          }}
        >
          {/* Error banner */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(212,43,43,0.12)",
                border: "1px solid rgba(212,43,43,0.35)",
                borderRadius: "10px",
                padding: "10px 14px",
                marginBottom: "20px",
=======
        {/* ── STEP 1: Details ─────────────────────────────────────────── */}
        {step === "details" && (
          <>
            <div className={mounted ? "rise" : "opacity-0"}>
              <TiltHeader subtitle="Create account" />
            </div>

            <div
              className={mounted ? "rise2" : "opacity-0"}
              style={{
                background: "#0e1f10",
                border: "1.5px solid rgba(200,230,60,0.12)",
                borderTop: "none",
                borderRadius: "0 0 18px 18px",
                padding: "24px 32px 32px",
              }}
            >
              {error && (
                <ErrorBanner message={error} onClose={() => setError("")} />
              )}

              <form
                onSubmit={handleRequestOtp}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div>
                  <label htmlFor="name" className="tilt-label">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your full name"
                    className="tilt-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="tilt-label">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="your@email.com"
                    className="tilt-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="tilt-label">
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Min. 8 characters"
                      className="tilt-input"
                      style={{ paddingRight: "44px" }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(200,230,60,0.4)",
                        padding: 0,
                        display: "flex",
                      }}
                    >
                      {showPassword ? (
                        <svg
                          style={{ width: "16px", height: "16px" }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"
                          />
                        </svg>
                      ) : (
                        <svg
                          style={{ width: "16px", height: "16px" }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                          />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm" className="tilt-label">
                    Confirm Password
                  </label>
                  <input
                    id="confirm"
                    name="confirm"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Repeat your password"
                    className="tilt-input"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={isLoading} className="tilt-btn">
                  {isLoading ? "Sending code…" : "Send Verification Code"}
                </button>

                <p
                  style={{
                    textAlign: "center",
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.35)",
                    marginTop: "4px",
                  }}
                >
                  Already have an account?{" "}
                  <Link
                    href="/tilt/login"
                    style={{
                      color: "#c8e63c",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            </div>

            <div
              className={`text-center mt-6 ${mounted ? "rise3" : "opacity-0"}`}
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
            </div>
          </>
        )}

        {/* ── STEP 2: OTP Verification ─────────────────────────────────── */}
        {step === "verify" && (
          <>
            <div className="rise">
              <TiltHeader subtitle="Verify your email" />
            </div>

            <div
              className="rise2"
              style={{
                background: "#0e1f10",
                border: "1.5px solid rgba(200,230,60,0.12)",
                borderTop: "none",
                borderRadius: "0 0 18px 18px",
                padding: "24px 32px 32px",
>>>>>>> Stashed changes
              }}
            >
              {/* Description */}
              <p
                style={{
                  fontSize: "13px",
                  color: "rgba(200,200,200,0.6)",
                  marginBottom: "20px",
                  lineHeight: 1.6,
                }}
              >
                We sent a 6-digit code to{" "}
                <span style={{ color: "#c8e63c", fontWeight: 700 }}>
                  {email}
                </span>
                . Enter it below — the code expires in 10 minutes.
              </p>

              {error && (
                <ErrorBanner message={error} onClose={() => setError("")} />
              )}

              <form
                onSubmit={handleVerifyOtp}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {/* 6-digit OTP grid */}
                <div>
                  <label
                    className="tilt-label"
                    style={{
                      textAlign: "center",
                      display: "block",
                      marginBottom: "12px",
                    }}
                  >
                    Verification Code
                  </label>
                  <div className="otp-grid">
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          digitRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={d}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(i, e)}
                        className="otp-digit"
                        autoComplete="one-time-code"
                        aria-label={`Digit ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

<<<<<<< Updated upstream
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="tilt-label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Your full name"
                className="tilt-input"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="tilt-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="your@email.com"
                className="tilt-input"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="tilt-label">
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min. 8 characters"
                  className="tilt-input"
                  style={{ paddingRight: "44px" }}
                />
=======
>>>>>>> Stashed changes
                <button
                  type="submit"
                  disabled={isLoading || digits.join("").length < 6}
                  className="tilt-btn"
                >
                  {isLoading ? "Verifying…" : "Verify & Create Account"}
                </button>

                {/* Resend */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isLoading}
                    className="tilt-btn-ghost"
                  >
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Resend Code"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("details");
                      setError("");
                      setDigits(["", "", "", "", "", ""]);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(200,230,60,0.4)",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      padding: "4px 0",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "rgba(200,230,60,0.7)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(200,230,60,0.4)")
                    }
                  >
                    ← Change email or password
                  </button>
                </div>
              </form>
            </div>

            <div className="text-center mt-6 rise3">
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
