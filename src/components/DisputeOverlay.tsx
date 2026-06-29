"use client";

import { useMarketStore } from "@/store/marketStore";
import { AlertTriangle, WifiOff, Globe } from "lucide-react";

export default function DisputeOverlay() {
  const market = useMarketStore((s) => s.market);

  if (!market || market.status !== "DISPUTED_FROZEN") return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-dispute-pulse">
      {/* Backdrop noise texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(127,29,29,0.95)_0%,_rgba(50,10,10,0.98)_100%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-sm mx-auto space-y-6">
        {/* Warning icon with pulse rings */}
        <div className="relative">
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-red-500/20 animate-ping" />
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-red-500/10 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center border-2 border-red-400/30 shadow-[0_0_40px_rgba(220,38,38,0.4)]">
            <AlertTriangle className="w-10 h-10 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            ⚠️ Sengketa Terjadi
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-red-500 to-red-700 mx-auto rounded-full" />
        </div>

        {/* Description */}
        <p className="text-sm text-red-200/80 leading-relaxed font-medium">
          Dana seluruh petaruh telah di-<span className="text-white font-bold">Escrow</span> dan dibekukan di dalam <span className="text-white font-bold">Local Vault</span>.
        </p>

        {/* Connection status */}
        <div className="bg-red-950/60 border border-red-800/40 rounded-2xl p-4 w-full space-y-3">
          <div className="flex items-center justify-center gap-2 text-red-300">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Status Koneksi: Offline</span>
          </div>
          <p className="text-xs text-red-300/60 leading-relaxed">
            Harap sambungkan perangkat ke <span className="text-red-200 font-semibold">Internet</span> untuk memanggil <span className="text-red-200 font-semibold">Oracle API</span> dan menyelesaikan sengketa secara otomatis.
          </p>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <Globe className="w-3.5 h-3.5 text-red-500 animate-spin" />
            <span className="text-[10px] text-red-400 font-mono">Menunggu koneksi internet...</span>
          </div>
        </div>

        {/* Market info */}
        <div className="text-[10px] text-red-500/50 font-mono space-y-0.5">
          <p>Market ID: {market.market_id}</p>
          <p>Total Pool: {market.total_pool} USDT (Frozen)</p>
        </div>
      </div>
    </div>
  );
}
