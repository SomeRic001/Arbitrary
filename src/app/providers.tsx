"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import LoadingWrapper from "@/src/components/layout/loading-wrapper";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60 * 1000 } },
      }),
  );

  // Detect /tilt/* — these routes manage their own loading experience
  const pathname = usePathname();
  const isTiltRoute = pathname.startsWith("/tilt");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {isTiltRoute ? (
          // Tilt routes: no Arbitrary splash. TiltLoadingWrapper in
          // src/app/tilt/layout.tsx handles the loading experience.
          <>{children}</>
        ) : (
          // All other routes: existing Arbitrary loading, completely unchanged.
          <LoadingWrapper>{children}</LoadingWrapper>
        )}
      </SessionProvider>
    </QueryClientProvider>
  );
}
