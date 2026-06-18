"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Section = "song" | "dance";

interface FormState {
  name: string;
  email: string;
  phone: string;
  file: File | null;
}

const emptyForm: FormState = { name: "", email: "", phone: "", file: null };

function ParticipantForm({
  type,
  onClose,
}: {
  type: Section;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isSong = type === "song";
  const accent = isSong ? "#6366f1" : "#a855f7";
  const accentLight = isSong ? "#eef2ff" : "#faf5ff";
  const accentMid = isSong ? "#818cf8" : "#c084fc";
  const label = isSong ? "Song" : "Dance";
  const uploadLabel = isSong ? "Upload music file" : "Upload dance video";
  const uploadAccept = isSong ? "audio/*" : "video/*";
  const uploadIcon = isSong ? (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ) : (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <rect x="2" y="7" width="15" height="10" rx="2" />
      <path
        d="M17 9l5-3v12l-5-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-4 py-10 px-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          style={{ background: accentLight, color: accent }}
          className="w-16 h-16 rounded-full flex items-center justify-center"
        >
          <svg
            width="32"
            height="32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M20 6L9 17l-5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        <h3 className="text-xl font-semibold" style={{ color: accent }}>
          You're registered!
        </h3>
        <p className="text-sm text-gray-500 max-w-[220px]">
          Your {label.toLowerCase()} entry has been received. We'll be in touch.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm(emptyForm);
            onClose();
          }}
          className="mt-2 text-sm font-medium px-5 py-2 rounded-full transition-all"
          style={{ background: accentLight, color: accent }}
        >
          Close
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: accentMid }}
        >
          {label} entry
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500">Full name</label>
        <input
          required
          type="text"
          placeholder="Ada Lovelace"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none transition-all focus:ring-2"
          style={{ ["--tw-ring-color" as string]: accentMid + "66" }}
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500">Email</label>
        <input
          required
          type="email"
          placeholder="ada@example.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none transition-all focus:ring-2"
          style={{ ["--tw-ring-color" as string]: accentMid + "66" }}
        />
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500">Phone</label>
        <input
          required
          type="tel"
          placeholder="+1 555 000 0000"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none transition-all focus:ring-2"
          style={{ ["--tw-ring-color" as string]: accentMid + "66" }}
        />
      </div>

      {/* File upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500">
          {uploadLabel}
        </label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-dashed transition-all text-sm font-medium"
          style={{
            borderColor: form.file ? accent : "#e5e7eb",
            background: form.file ? accentLight : "white",
            color: form.file ? accent : "#9ca3af",
          }}
        >
          <span style={{ color: form.file ? accent : "#9ca3af" }}>
            {uploadIcon}
          </span>
          <span className="truncate">
            {form.file ? form.file.name : `Choose a file…`}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={uploadAccept}
          className="hidden"
          onChange={(e) =>
            setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))
          }
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        type="submit"
        className="w-full py-3 rounded-xl text-white text-sm font-semibold tracking-wide mt-1 transition-all"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accentMid})`,
        }}
      >
        Submit entry
      </motion.button>
    </form>
  );
}

function Panel({
  type,
  isActive,
  onClick,
  onClose,
}: {
  type: Section;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}) {
  const isSong = type === "song";
  const accent = isSong ? "#6366f1" : "#a855f7";
  const accentLight = isSong ? "#eef2ff" : "#faf5ff";
  const accentMid = isSong ? "#818cf8" : "#c084fc";
  const label = isSong ? "Song" : "Dance";

  const IdleIcon = isSong ? (
    <svg
      width="48"
      height="48"
      fill="none"
      stroke={accentMid}
      strokeWidth="1.4"
      viewBox="0 0 24 24"
    >
      <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ) : (
    <svg
      width="48"
      height="48"
      fill="none"
      stroke={accentMid}
      strokeWidth="1.4"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 2a5 5 0 015 5c0 5-5 9-5 9S7 12 7 7a5 5 0 015-5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 21c0-2.2 1.8-4 4-4s4 1.8 4 4" strokeLinecap="round" />
    </svg>
  );

  return (
    <motion.div
      layout
      className="relative overflow-hidden flex flex-col"
      style={{
        width: isActive ? "60%" : "40%",
        background: isActive ? "white" : accentLight,
        borderRight: isSong ? `1px solid ${accentMid}22` : "none",
        transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Decorative circle */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentMid}22 0%, transparent 70%)`,
          top: isActive ? -80 : -40,
          right: -60,
          transition: "all 0.6s ease",
        }}
      />

      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, rotateY: -90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: 90 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: "left center", perspective: 1000 }}
            className="w-full h-full overflow-y-auto"
          >
            <ParticipantForm type={type} onClose={onClose} />
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center h-full gap-5 px-8"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              {IdleIcon}
            </motion.div>

            <div className="text-center">
              <p
                className="text-xs font-semibold tracking-widest uppercase mb-1.5"
                style={{ color: accentMid }}
              >
                Register for
              </p>
              <h2 className="text-2xl font-bold" style={{ color: accent }}>
                {label}
              </h2>
            </div>

            <motion.button
              whileHover={{ scale: 1.06, boxShadow: `0 8px 24px ${accent}44` }}
              whileTap={{ scale: 0.95 }}
              onClick={onClick}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accentMid})`,
              }}
            >
              Enter {label}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ParticipantPage() {
  const [active, setActive] = useState<Section | null>(null);

  return (
    <main
      className="flex overflow-hidden rounded-2xl shadow-xl border border-gray-100"
      style={{ height: 520, minWidth: 340 }}
    >
      <Panel
        type="song"
        isActive={active === "song"}
        onClick={() => setActive("song")}
        onClose={() => setActive(null)}
      />
      <Panel
        type="dance"
        isActive={active === "dance"}
        onClick={() => setActive("dance")}
        onClose={() => setActive(null)}
      />
    </main>
  );
}
