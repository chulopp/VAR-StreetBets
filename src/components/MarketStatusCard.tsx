"use client";

import React from "react";
import { Activity, TrendingUp } from "lucide-react";

export type MarketStatus =
  | "OPEN"
  | "FROZEN_BETTING"
  | "AWAITING_CONSENSUS"
  | "DISPUTED_FROZEN"
  | "DISPUTED"
  | "GRACE_PERIOD"
  | "CLOSED";

interface MarketStatusCardProps {
  /** Label di pojok kiri atas (e.g. "STATUS PASAR" atau "PASAR AKTIF") */
  title: string;
  tournament: string;
  match: string;
  incidentDescription: string;
  marketId: string;
  oddsYes: number;
  oddsNo: number;
  totalPool: number;
  bandarStake: number;
  /** Waktu tersisa dalam detik. Null/undefined = sembunyikan timer */
  timeLeftSeconds?: number | null;
  status: MarketStatus;
  statusText?: string;
  statusColor?: string;
}

/** Format detik → "MM:SS" */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Dot + label badge sesuai status */
function StatusBadge({ status, statusText, statusColor }: { status: MarketStatus; statusText?: string; statusColor?: string; }) {
  const dotClass = {
    OPEN: "bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]",
    FROZEN_BETTING: "bg-red-500 shadow-[0_0_6px_#ef4444]",
    AWAITING_CONSENSUS: "bg-yellow-400 animate-pulse",
    DISPUTED_FROZEN: "bg-yellow-500 animate-pulse",
    DISPUTED: "bg-yellow-500 animate-pulse",
    GRACE_PERIOD: "bg-yellow-400 animate-pulse",
    CLOSED: "bg-zinc-500",
  }[status] ?? "bg-zinc-500";

  const textClass = statusColor || ({
    OPEN: "text-emerald-400",
    FROZEN_BETTING: "text-red-400",
    AWAITING_CONSENSUS: "text-yellow-400",
    DISPUTED_FROZEN: "text-yellow-500",
    DISPUTED: "text-yellow-400",
    GRACE_PERIOD: "text-yellow-400",
    CLOSED: "text-zinc-400",
  }[status] ?? "text-zinc-400");

  const label = statusText || ({
    OPEN: "Terbuka",
    FROZEN_BETTING: "Kunci Taruhan",
    AWAITING_CONSENSUS: "Konsensus",
    DISPUTED_FROZEN: "Sengketa",
    DISPUTED: "Sengketa",
    GRACE_PERIOD: "Masa Sanggah",
    CLOSED: "Selesai",
  }[status] ?? status);

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
      <span className={`text-[10px] font-bold uppercase ${textClass}`}>
        {label}
      </span>
    </div>
  );
}

export default function MarketStatusCard({
  title,
  tournament,
  match,
  incidentDescription,
  marketId,
  oddsYes,
  oddsNo,
  totalPool,
  bandarStake,
  timeLeftSeconds,
  status,
  statusText,
  statusColor,
}: MarketStatusCardProps) {
  const showTimer =
    timeLeftSeconds !== null &&
    timeLeftSeconds !== undefined &&
    timeLeftSeconds > 0;

  // Guard: only trigger low-time red blink when timer is actually shown AND timeLeftSeconds is a real number
  const isLowTime = showTimer && typeof timeLeftSeconds === "number" && timeLeftSeconds <= 15;

  return (
    <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-6 space-y-4 transition-all duration-300">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-yellow-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            {title}
          </h4>
        </div>
        <div className="flex items-center gap-3">
          {showTimer && (
            <span
              className={`text-xs font-mono font-bold ${
                isLowTime
                  ? "text-red-500 animate-pulse font-black"
                  : "text-yellow-500"
              }`}
            >
              {formatTime(timeLeftSeconds!)}
            </span>
          )}
          <StatusBadge status={status} statusText={statusText} statusColor={statusColor} />
        </div>
      </div>

      {/* ── Match Info ── */}
      <div className="space-y-1.5 border-b border-zinc-800 pb-3">
        <p className="text-[10px] text-yellow-500 font-bold uppercase">
          {tournament}
        </p>
        <h2 className="text-lg font-black text-white tracking-tight">
          {match}
        </h2>
        <div className="bg-black/40 border border-zinc-800/60 rounded-2xl p-3 mt-2">
          <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">
            Deskripsi Insiden
          </span>
          <h3 className="text-xs text-zinc-200 leading-relaxed font-semibold">
            {incidentDescription}
          </h3>
        </div>
        <p className="text-[9px] text-zinc-500 font-mono mt-1">
          ID: {marketId}
        </p>
      </div>

      {/* ── Odds Display ── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-3 rounded-2xl bg-yellow-500/5 border border-yellow-500/15">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-yellow-400" />
            <p className="text-[9px] text-yellow-500 font-extrabold uppercase tracking-wide">
              Odds YES
            </p>
          </div>
          <p className="text-xl font-black text-yellow-400 font-mono">
            {oddsYes.toFixed(2)}x
          </p>
        </div>
        <div className="text-center p-3 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-zinc-400" />
            <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide">
              Odds NO
            </p>
          </div>
          <p className="text-xl font-black text-zinc-300 font-mono">
            {oddsNo.toFixed(2)}x
          </p>
        </div>
      </div>

      {/* ── Pool Info ── */}
      <div className="mt-5 border-t border-zinc-800 pt-2 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Total Pool</span>
          <span className="text-yellow-400 font-bold font-mono">
            {totalPool} USDT
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Bandar Stake</span>
          <span className="text-zinc-300 font-bold font-mono">
            {bandarStake} USDT
          </span>
        </div>
      </div>
    </div>
  );
}
