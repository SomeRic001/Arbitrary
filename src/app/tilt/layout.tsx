// src/app/tilt/layout.tsx
//
// Root shell for every /tilt/* page.
//
// What this intentionally DOES:
//   ✓ Wraps children in TiltLoadingWrapper → Tilt splash on hard reload
//   ✓ Applies bottle-green background + red top stripe (Tilt visual identity)
//   ✓ Exports metadata so the browser tab reads "Tilt" not "Arbitrary"
//
// What this intentionally does NOT do:
//   ✗ Import SessionProvider  — Tilt uses its own tilt_token JWT cookie
//   ✗ Import QueryClientProvider — not needed for Tilt's simple pages
//   ✗ Import Arbitrary's LoadingWrapper or LoadingScreen
//   ✗ Touch any Arbitrary auth, routes, or components

import TiltLoadingWrapper from "@/src/app/tilt/_component/tilt-loading-wrapper";

export const metadata = {
  title: "Tilt · Event Registration",
  description: "Tilt Your Music event registration portal",
};

export default function TiltLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen selection:bg-[#c8e63c] selection:text-black"
      style={{ background: "#0e1f10" }}
    >
      {/* Tilt signature red stripe — runs across the very top of every page */}
      <div
        style={{
          height: "4px",
          background:
            "linear-gradient(90deg, #d42b2b 0%, #a01c1c 50%, #d42b2b 100%)",
        }}
      />

      {/* TiltLoadingWrapper owns the splash sequence for all /tilt/* routes */}
      <TiltLoadingWrapper>{children}</TiltLoadingWrapper>
    </div>
  );
}
