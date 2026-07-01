"use client";

import React from "react";
import { DollarSign } from "lucide-react";

interface GlobalPnlCardProps {
  /** Judul kotak PnL (default: "P&L ALL-TIME") */
  title?: string;
  /** Nilai PnL total. Positif = profit, negatif = loss */
  pnlAmount: number;
  /** Teks status (e.g. "PROFIT (FEE)", "BERHASIL (WIN)") */
  statusText: string;
  /** Estimasi saldo akhir */
  estimatedBalance: number;
  /** Teks keterangan kecil di bawah */
  descriptionText?: string;
  /** Jumlah total pasar yang sudah ditutup (opsional) */
  totalMarketsPlayed?: number;
}

export default function GlobalPnlCard({
  title = "P&L ALL-TIME",
  pnlAmount,
  statusText,
  estimatedBalance,
  descriptionText = "Kalkulasi berdasarkan 10% Spread Fee dari total pool yang berhasil ditutup.",
  totalMarketsPlayed,
}: GlobalPnlCardProps) {
  const isWin = pnlAmount >= 0;

  return (
    <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-yellow-400" />
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            {title}
          </span>
        </div>
        {totalMarketsPlayed !== undefined && (
          <span className="text-[9px] text-zinc-600 font-mono bg-zinc-800/60 border border-zinc-700/50 rounded-full px-2 py-0.5">
            {totalMarketsPlayed} Pasar Selesai
          </span>
        )}
      </div>

      {/* PnL Highlight */}
      <div className="text-center pt-2 pb-1">
        <span
          className={`text-4xl font-black font-mono tracking-tight ${
            isWin ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isWin ? "+" : "-"}
          {Math.abs(pnlAmount).toFixed(2)}
        </span>
        <span className={`text-base font-bold ml-1.5 ${isWin ? "text-emerald-400" : "text-red-400"}`}>
          USDT
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-zinc-700/60" />

      {/* Detail Rows */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Status</span>
          <span
            className={`font-bold uppercase tracking-wider text-xs ${
              isWin ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {statusText}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Saldo Akhir (Estimasi)</span>
          <span className="text-white font-bold font-mono">
            {estimatedBalance.toFixed(2)} USDT
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[9px] text-zinc-600 font-mono text-center pt-2 leading-relaxed">
        {descriptionText}
      </p>
    </div>
  );
}
