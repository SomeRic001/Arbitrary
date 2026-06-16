"use client";

// src/app/tilt/page.tsx
// Event registration form — only accessible after tilt login.
// Checks the tilt_token cookie on mount; redirects to /tilt/login if missing.
// Pre-fills existing submission. Uses PATCH/upsert so users can update their entry.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface UserInfo {
  name: string;
  email: string;
}

// Shared rise animation variants
const riseVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function TiltPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [existing, setExisting] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    document.title = "Register | Tilt Event";

    fetch("/api/tilt/me")
      .then(async (r) => {
        if (r.status === 401) {
          router.replace("/tilt/login");
          return;
        }
        if (r.ok) {
          const data = await r.json();
          setUserInfo(data.user ?? null);
          setExisting(data.registration ?? null);
        }
        setIsChecking(false);
      })
      .catch(() => setIsChecking(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      address: fd.get("address") as string,
    };

    try {
      const res = await fetch("/api/tilt/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 401) {
        router.replace("/tilt/login");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setIsLoading(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/tilt/logout", { method: "POST" });
    router.push("/tilt/login");
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "3px solid rgba(200,230,60,0.15)",
            borderTop: "3px solid #c8e63c",
          }}
        />
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (submitted) {
    return (
<<<<<<< Updated upstream
      <div className="tilt-noise min-h-screen flex items-center justify-center px-4">
        <div
=======
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={riseVariants}
>>>>>>> Stashed changes
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
            transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
                transition: "transform 0.15s",
              }}
            >
              Back to Arbitrary
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
<<<<<<< Updated upstream
    <div className="tilt-noise min-h-screen flex items-center justify-center px-4 py-14 relative overflow-hidden">
=======
    <div className="min-h-screen flex items-center justify-center px-4 py-14 relative overflow-hidden">
      {/* Ambient glow */}
>>>>>>> Stashed changes
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

      <style>{`
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
          overflow: hidden;
          background: #c8e63c;
          color: #0e1f10;
          border: none;
          cursor: pointer;
          margin-top: 8px;
          font-family: inherit;
        }
        .tilt-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="relative z-10 w-full max-w-sm">
<<<<<<< Updated upstream
        {/* Header */}
        <div className={`text-center mb-10 ${mounted ? "rise" : "opacity-0"}`}>
          <h1
=======
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={riseVariants}
        >
          <div
>>>>>>> Stashed changes
            style={{
              color: "#fff",
              fontSize: "28px",
              fontWeight: 900,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
<<<<<<< Updated upstream
            tilt
          </h1>
          <p
            style={{
              color: "rgba(200,230,60,0.5)",
              fontSize: "13px",
              fontWeight: 600,
              marginTop: "6px",
            }}
          >
            {existing ? "Update your registration" : "Register for the event"}
          </p>

          {/* Logged-in user badge + logout */}
          {userInfo && (
=======
            {/* Red stripe accent */}
>>>>>>> Stashed changes
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "16px",
              }}
<<<<<<< Updated upstream
            >
              <span
=======
            />

            <div className="flex flex-col items-center text-center gap-3 relative z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.15,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
>>>>>>> Stashed changes
                style={{
                  fontSize: "11px",
                  color: "rgba(200,230,60,0.45)",
                  fontWeight: 600,
                }}
              >
<<<<<<< Updated upstream
                {userInfo.name}
              </span>
              <button
                onClick={handleLogout}
                title="Sign out"
                style={{
                  background: "rgba(212,43,43,0.12)",
                  border: "1px solid rgba(212,43,43,0.25)",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "rgba(212,43,43,0.7)",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(212,43,43,0.2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(212,43,43,0.12)"}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
=======
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
                  {existing ? "Update your registration" : "Event Registration"}
                </p>
              </div>
            </div>

            {/* Logged-in user badge + logout */}
            {userInfo && (
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "rgba(200,230,60,0.55)",
                    fontWeight: 600,
                    maxWidth: "100px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {userInfo.name}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  title="Logout"
                  style={{
                    background: "rgba(212,43,43,0.15)",
                    border: "1px solid rgba(212,43,43,0.3)",
                    borderRadius: "6px",
                    padding: "3px 7px",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#d42b2b",
                    cursor: "pointer",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Logout
                </motion.button>
              </div>
            )}
          </div>

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
        </motion.div>
>>>>>>> Stashed changes

        {/* ── Form body ────────────────────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.1}
          variants={riseVariants}
          style={{
            padding: "0",
          }}
        >
          {/* Pre-fill notice */}
          <AnimatePresence>
            {existing && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: "rgba(200,230,60,0.07)",
                  border: "1px solid rgba(200,230,60,0.2)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "20px",
                  fontSize: "12px",
                  color: "rgba(200,230,60,0.7)",
                  fontWeight: 600,
                }}
              >
                Your previous registration is pre-filled. Update and submit to
                save changes.
              </motion.div>
            )}
          </AnimatePresence>

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
                  }}
                >
                  {error}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {[
              {
                id: "name",
                label: "Full Name",
                type: "text",
                placeholder: "Your full name",
                autoComplete: "name",
                defaultValue: existing?.name ?? userInfo?.name ?? "",
              },
              {
                id: "email",
                label: "Email",
                type: "email",
                placeholder: "your@email.com",
                autoComplete: "email",
                defaultValue: existing?.email ?? userInfo?.email ?? "",
              },
              {
                id: "phone",
                label: "Phone Number",
                type: "tel",
                placeholder: "+977 98XXXXXXXX",
                autoComplete: "tel",
                defaultValue: existing?.phone ?? "",
              },
            ].map((field, i) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.15 + i * 0.06,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
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
                  defaultValue={field.defaultValue}
                  className="tilt-input"
                />
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.33,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
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
                defaultValue={existing?.address ?? ""}
                className="tilt-input tilt-textarea"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.39,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.button
                type="submit"
                disabled={isLoading}
                className="tilt-btn"
                whileHover={isLoading ? {} : { scale: 1.015 }}
                whileTap={isLoading ? {} : { scale: 0.985 }}
                transition={{ duration: 0.15 }}
              >
                {isLoading
                  ? "Submitting…"
                  : existing
                    ? "Update Registration"
                    : "Register for tilt"}
              </motion.button>
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
