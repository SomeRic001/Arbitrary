// src/app/tilde/layout.tsx
// Completely isolated layout for Tilde event pages.
// No Arbitary header, footer, or NextAuth session provider.
// Tuborg-inspired theme: bottle green, lime yellow, red stripe, black.

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
      {/* Tuborg stripe — thin red band across the very top */}
      <div
        style={{
          height: "4px",
          background:
            "linear-gradient(90deg, #d42b2b 0%, #a01c1c 50%, #d42b2b 100%)",
        }}
      />
      {children}
    </div>
  );
}
