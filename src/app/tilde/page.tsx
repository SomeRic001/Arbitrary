"use client";

// src/app/tilde/page.tsx
// Event registration form — only accessible after Tilde login.
// Checks the tilde_token cookie on mount; redirects to /tilde/login if missing.
// Pre-fills existing submission. Uses PATCH/upsert so users can update their entry.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserInfo {
  name: string;
  email: string;
}

export default function TildePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [existing, setExisting] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    setMounted(true);
    document.title = "Register | Tilde Event";

    // Auth check: GET /api/tilde/me returns 200+user or 401
    fetch("/api/tilde/me")
      .then(async (r) => {
        if (r.status === 401) {
          router.replace("/tilde/login");
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
      const res = await fetch("/api/tilde/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 401) {
        router.replace("/tilde/login");
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
    await fetch("/api/tilde/logout", { method: "POST" });
    router.push("/tilde/login");
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "3px solid rgba(200,230,60,0.15)",
            borderTop: "3px solid #c8e63c",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div
          className="relative z-10 w-full max-w-sm text-center"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div
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
          </div>
          <div>
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
              We&apos;ve received your details. See you at Tilde.
            </p>
          </div>
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
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-14 relative overflow-hidden">
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
        @keyframes riseUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rise  { animation: riseUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards; }
        .rise2 { animation: riseUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.1s forwards; opacity: 0; }

        .tilde-input {
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
        }
        .tilde-input::placeholder { color: rgba(255,255,255,0.28); }
        .tilde-input:focus {
          border-color: #c8e63c;
          background: rgba(200,230,60,0.06);
        }
        .tilde-textarea {
          resize: none;
          min-height: 80px;
        }

        .tilde-label {
          display: block;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(200,230,60,0.6);
          margin-bottom: 6px;
        }

        .tilde-btn {
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
          font-family: inherit;
        }
        .tilde-btn:hover { transform: scale(1.015); }
        .tilde-btn:active { transform: scale(0.985); }
        .tilde-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      `}</style>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className={mounted ? "rise" : "opacity-0"}>
          <div
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
              <div
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
              </div>

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
                  Tilde
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
                <button
                  onClick={handleLogout}
                  title="Sign out"
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
                  Out
                </button>
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
        </div>

        {/* Form body */}
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
          {/* Pre-fill notice */}
          {existing && (
            <div
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
            </div>
          )}

          {/* Error */}
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
              }}
            >
              <span
                style={{ color: "#e05555", fontSize: "12px", fontWeight: 600 }}
              >
                {error}
              </span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label htmlFor="name" className="tilde-label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Your full name"
                autoComplete="name"
                defaultValue={existing?.name ?? userInfo?.name ?? ""}
                className="tilde-input"
              />
            </div>

            <div>
              <label htmlFor="email" className="tilde-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="your@email.com"
                autoComplete="email"
                defaultValue={existing?.email ?? userInfo?.email ?? ""}
                className="tilde-input"
              />
            </div>

            <div>
              <label htmlFor="phone" className="tilde-label">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="+977 98XXXXXXXX"
                autoComplete="tel"
                defaultValue={existing?.phone ?? ""}
                className="tilde-input"
              />
            </div>

            <div>
              <label htmlFor="address" className="tilde-label">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                required
                rows={3}
                placeholder="Your full address"
                defaultValue={existing?.address ?? ""}
                className="tilde-input tilde-textarea"
              />
            </div>

            <button type="submit" disabled={isLoading} className="tilde-btn">
              {isLoading
                ? "Submitting…"
                : existing
                  ? "Update Registration"
                  : "Register for Tilde"}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
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
            }}
          >
            <span>←</span> Back to Arbitrary
          </Link>
        </div>
      </div>
    </div>
  );
}
