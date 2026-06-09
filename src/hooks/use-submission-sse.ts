"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useSubmissionSSE() {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let es = esRef.current;
    if (!es) {
      es = new EventSource("/api/user/tasks/subscribe");
      esRef.current = es;
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "status_change") {
          queryClient.invalidateQueries({ queryKey: ["user-tasks"] });
          queryClient.invalidateQueries({ queryKey: ["user-points"] });
        }
      } catch {
        // ignore parse errors (heartbeat comments, etc.)
      }
    };

    es.onerror = () => {
      // SSE will auto-reconnect; no action needed
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [queryClient]);

  return null;
}
