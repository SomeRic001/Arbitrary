"use client";

import { useState, useRef, useCallback } from "react";

type Props = {
  onTokenResolved: (token: string) => void;
  onClose: () => void;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RATE_LIMIT_WINDOW = 30000;
const MAX_LOOKUPS = 5;

export default function ManualEntry({ onTokenResolved, onClose }: Props) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const lookupsRef = useRef<number[]>([]);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    lookupsRef.current = lookupsRef.current.filter((t) => now - t < RATE_LIMIT_WINDOW);
    return lookupsRef.current.length < MAX_LOOKUPS;
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Please enter a token");
      return;
    }
    if (!UUID_REGEX.test(trimmed)) {
      setError("Invalid token format — expected a UUID");
      return;
    }
    if (!checkRateLimit()) {
      setError(`Rate limit: max ${MAX_LOOKUPS} lookups per 30s`);
      return;
    }
    setError("");
    setLoading(true);
    lookupsRef.current.push(Date.now());
    onTokenResolved(trimmed);
  }, [input, checkRateLimit, onTokenResolved]);

  return (
    <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-6">
      <div className="bg-zinc-900 rounded-3xl p-8 w-full max-w-md border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg font-bold">Enter Token Manually</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-white/50 text-sm mb-4">
          Paste the ticket token (UUID format) from the ticket or QR code.
        </p>
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="00000000-0000-0000-0000-000000000000"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm font-mono placeholder-white/20 outline-none focus:border-white/30 transition-colors"
          autoFocus
        />
        {error && (
          <p className="text-red-400 text-xs mt-2">{error}</p>
        )}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-white text-black font-semibold text-sm rounded-2xl hover:bg-white/90 transition-all disabled:opacity-50"
          >
            {loading ? "Looking up..." : "Look Up"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white/5 text-white font-semibold text-sm rounded-2xl hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
