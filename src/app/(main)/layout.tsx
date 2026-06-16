"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDailyLogin } from "@/src/hooks/useDailyLogin";
import { useNotificationSSE } from "@/src/hooks/use-notification-sse";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Real-time notifications — start SSE FIRST so the connection is open
  // before useDailyLogin fires and the server calls NotificationService.deliver().
  // This ensures the notification lands in the bell in real-time on the very
  // first login of the day (including right after signup).
  useNotificationSSE({ enabled: status === "authenticated" });

  // Auto daily-login: fires once per day, only for authenticated users.
  // We wait for status === "authenticated" (not just session?.user?.id) so that
  // the SSE connection above has already been established before the API call
  // goes out — otherwise the server sees no live listener and can only fall
  // back to email for the notification.
  const userId =
    status === "authenticated" ? ((session?.user as any)?.id ?? null) : null;
  useDailyLogin({ userId });

  return <>{children}</>;
}
