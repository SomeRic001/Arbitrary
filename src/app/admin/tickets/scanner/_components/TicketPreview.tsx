"use client";

import { useEffect, useRef, useCallback } from "react";
import type { TicketWithDetails } from "@/src/services/ticket.service";

type Props = {
  ticket: TicketWithDetails;
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
  autoCloseMs?: number;
};

export default function TicketPreview({
  ticket,
  onConfirm,
  onCancel,
  confirming,
  autoCloseMs = 30000,
}: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onCancel, autoCloseMs);
  }, [onCancel, autoCloseMs]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [resetTimer]);

  const isUsed = ticket.status === "used";
  const isExpired = ticket.event?.eventDate
    ? new Date(ticket.event.eventDate) < new Date()
    : false;
  const canRedeem = !isUsed && !isExpired;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-3xl w-full max-w-sm border border-white/10 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-bold">Ticket Preview</h2>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                isUsed
                  ? "bg-red-500/20 text-red-400"
                  : isExpired
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              {isUsed ? "Used" : isExpired ? "Expired" : "Active"}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                Ticket #
              </p>
              <p className="text-white text-sm font-mono">
                {ticket.id.toString().padStart(6, "0")}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                Event
              </p>
              <p className="text-white text-sm font-semibold">
                {ticket.event?.title ?? "Unknown Event"}
              </p>
              {ticket.event?.eventDate && (
                <p className="text-white/50 text-xs mt-0.5">
                  {new Date(ticket.event.eventDate).toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              )}
              {ticket.event?.venue && (
                <p className="text-white/40 text-xs">{ticket.event.venue}</p>
              )}
            </div>
            <div>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                Attendee
              </p>
              <p className="text-white text-sm">
                {ticket.user.name ?? "Unnamed"}
              </p>
              <p className="text-white/50 text-xs">{ticket.user.email}</p>
            </div>
            {ticket.accessType && (
              <div>
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                  Ticket Type
                </p>
                <p className="text-white text-sm">{ticket.accessType.title}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-white/5 text-white font-semibold text-sm rounded-2xl hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canRedeem || confirming}
            className="flex-1 px-4 py-2.5 bg-white text-black font-semibold text-sm rounded-2xl hover:bg-white/90 transition-all disabled:opacity-40"
          >
            {confirming ? "Confirming..." : "Confirm Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
