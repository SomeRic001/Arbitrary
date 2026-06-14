

import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface UseDailyLoginOptions {
  /** Authenticated user id. Pass null/undefined when user is not logged in. */
  userId: number | null | undefined;
}

function nextMilestoneLabel(days: number): string {
  if (days === 5) return "5-day";
  if (days === 7) return "7-day";
  if (days === 30) return "30-day";
  return `${days}-day`;
}

export function useDailyLogin({ userId }: UseDailyLoginOptions) {
  // Prevent double-firing in React StrictMode (double-mount in dev)
  const firedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    if (firedRef.current) return;

    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    const storageKey = `daily_login_claimed:${userId}`;

    try {
      const lastClaimed = localStorage.getItem(storageKey);
      if (lastClaimed === today) return; // Already claimed today in this browser
    } catch {
      // localStorage may be unavailable (private mode, etc.) — still attempt
    }

    firedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/user/tasks/daily-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (res.status === 429) {
          // Already claimed server-side today — just update local storage
          try { localStorage.setItem(storageKey, today); } catch { }
          return;
        }

        if (!res.ok) {
          // Non-429 error: reset flag so it can retry next navigation
          firedRef.current = false;
          return;
        }

        const data = await res.json();

        // Persist claim date so subsequent route visits skip the request
        try { localStorage.setItem(storageKey, today); } catch { }

        // Show reward notification
        const msg =
          data.bonusPoints > 0
            ? data.message
            : `Daily login reward! +${data.pointsAwarded ?? 5} pts`;
        toast.success(msg);

        if (data.streak) {
          const nextInfo = data.nextMilestone
            ? ` Next milestone at ${nextMilestoneLabel(data.nextMilestone.days)}: +${data.nextMilestone.bonus} pts`
            : " All milestones reached!";
          setTimeout(
            () => toast.info(`🔥 ${data.streak}-day streak!${nextInfo}`),
            600,
          );
        }
      } catch {
        // Network error — silently reset so it can retry
        firedRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
