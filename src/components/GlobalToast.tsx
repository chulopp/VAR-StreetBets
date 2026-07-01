"use client";

import React, { useState, useEffect } from "react";
import { useToastStore } from "@/store/useToastStore";

export default function GlobalToast() {
  const { message, isVisible } = useToastStore();
  const [isToastHiding, setIsToastHiding] = useState(false);
  const [localVisible, setLocalVisible] = useState(false);
  const [localMessage, setLocalMessage] = useState("");

  useEffect(() => {
    if (isVisible && message) {
      setLocalMessage(message);
      setIsToastHiding(false);
      setLocalVisible(true);
    } else if (!isVisible && localVisible) {
      setIsToastHiding(true);
      const t = setTimeout(() => {
        setLocalVisible(false);
        setIsToastHiding(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isVisible, message]);

  if (!localVisible) return null;

  return (
    <div className="fixed top-5 left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4">
      <div
        className={`px-5 py-3 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] text-white text-xs font-bold tracking-wide whitespace-nowrap ${
          isToastHiding
            ? "animate-out slide-out-to-top fade-out duration-300"
            : "animate-in slide-in-from-top fade-in duration-300"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse shrink-0" />
          {localMessage}
        </div>
      </div>
    </div>
  );
}

