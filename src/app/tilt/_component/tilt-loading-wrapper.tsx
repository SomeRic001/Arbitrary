"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TiltLoadingScreen from "@/src/app/tilt/_component/tilt-loading-screen";

export default function TiltLoadingWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Start rendering children early so they're hydrated when splash exits
    const renderTimer = setTimeout(() => setShouldRender(true), 80);
    // Splash duration: 2.8 s (Arbitrary uses 3 s — Tilt feels slightly snappier)
    const loadTimer = setTimeout(() => setIsLoading(false), 2800);
    return () => {
      clearTimeout(renderTimer);
      clearTimeout(loadTimer);
    };
  }, []);

  return (
    <div
      className={`relative min-h-screen ${
        isLoading ? "overflow-hidden h-screen" : "overflow-visible"
      }`}
    >
      {/* Tilt splash — slides up and out, same motion curve as Arbitrary */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-[100]"
            initial={{ y: 0, opacity: 1 }}
            exit={{
              y: "-100%",
              opacity: 0,
              transition: { duration: 1, ease: [0.23, 1, 0.32, 1] },
            }}
          >
            <TiltLoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page content rises into view once splash exits */}
      <motion.div
        className="min-h-screen"
        initial={{ y: "6vw", opacity: 0 }}
        animate={!isLoading ? { y: 0, opacity: 1 } : { y: "6vw", opacity: 0 }}
        transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
      >
        {shouldRender && children}
      </motion.div>
    </div>
  );
}
