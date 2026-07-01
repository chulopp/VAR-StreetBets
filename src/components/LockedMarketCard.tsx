import React from "react";
import { MarketStatus } from "./MarketStatusCard";

interface LockedMarketCardProps {
  status: MarketStatus;
  resolutionOutcome?: string;
}

export default function LockedMarketCard({ status, resolutionOutcome }: LockedMarketCardProps) {
  return (
    <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-6 text-center space-y-4">
      <div className="flex items-center justify-center gap-2">
        <h3 className="text-base font-black text-white uppercase tracking-wide">
          Pasar Dikunci
        </h3>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed">
        {status === "DISPUTED" || status === "DISPUTED_FROZEN"
          ? "Taruhan ditutup. Menunggu resolusi otomatis via Oracle API karena terjadi sengketa."
          : status === "FROZEN_BETTING"
          ? "Taruhan ditutup. Menunggu keputusan resmi wasit melalui input Bandar."
          : `Bandar telah menginput hasil: "${resolutionOutcome || "YES"}". Menunggu konsensus petaruh...`}
      </p>
      <div className={`flex items-center justify-center gap-2 pt-1 ${
        status === "DISPUTED" || status === "DISPUTED_FROZEN" ? "animate-pulse" : ""
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          status === "DISPUTED" || status === "DISPUTED_FROZEN" ? "bg-yellow-500" : "bg-red-500"
        }`} />
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          status === "DISPUTED" || status === "DISPUTED_FROZEN"
            ? "text-yellow-400"
            : "text-red-400"
        }`}>
          {status === "DISPUTED" || status === "DISPUTED_FROZEN"
            ? "MEMVERIFIKASI ORACLE API..."
            : status === "FROZEN_BETTING"
            ? "Menunggu Keputusan Wasit"
            : "Menunggu Konsensus"}
        </span>
      </div>
    </div>
  );
}
