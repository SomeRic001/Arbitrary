"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from "@/src/components/layout/loading-screen";

export default function LoadingWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRenderContent, setShouldRenderContent] = useState(false);

  useEffect(() => {
    const renderTimer = setTimeout(() => {
      setShouldRenderContent(true);
    }, 100);

    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      clearTimeout(renderTimer);
      clearTimeout(loadTimer);
    };
  }, []);

  return (
    <div
      className={`relative min-h-screen bg-white ${isLoading ? "overflow-hidden h-screen" : "overflow-visible"}`}
    >
      {/* Loading Screen — slides up and out */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-[100]"
            initial={{ y: 0, opacity: 1 }}
            exit={{
              y: "-100%",
              opacity: 0,
              transition: {
                duration: 1,
                ease: [0.23, 1, 0.32, 1],
              },
            }}
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content — slides up into view */}
      <motion.div
        className="min-h-screen"
        initial={{ y: "8vw", opacity: 0 }}
        animate={!isLoading ? { y: 0, opacity: 1 } : { y: "8vw", opacity: 0 }}
        transition={{
          duration: 1.2,
          ease: [0.23, 1, 0.32, 1],
          delay: 0.1,
        }}
      >
        {shouldRenderContent && children}
      </motion.div>
    </div>
  );
}
