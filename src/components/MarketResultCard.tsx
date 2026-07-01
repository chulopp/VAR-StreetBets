import React from "react";

interface MarketResultCardProps {
  tournament: string;
  teamA: string;
  teamB: string;
  incident: string;
  finalResult: 'YES' | 'NO';
  pnlAmount: number;
  statusText: 'BERHASIL (WIN)' | 'GAGAL (LOSS)' | 'PROFIT (FEE)';
  estimatedBalance: number;
  descriptionText: string;
  showPnL?: boolean;
}

export default function MarketResultCard({
  tournament,
  teamA,
  teamB,
  incident,
  finalResult,
  pnlAmount,
  statusText,
  estimatedBalance,
  descriptionText,
  showPnL = true,
}: MarketResultCardProps) {
  const isWin = pnlAmount >= 0;

  return (
    <>
      {/* Finished Card */}
      <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-6 text-center space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-white uppercase tracking-tight">
            PASAR SELESAI
          </h3>
          <p className="text-xs text-zinc-500 font-semibold">
            {tournament} • {teamA} vs {teamB}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1.5 italic font-medium max-w-[260px] mx-auto leading-normal">
            &ldquo;{incident}&rdquo;
          </p>
        </div>

        <div className="bg-black/60 border border-zinc-800 rounded-2xl py-2.5 px-4 max-w-[200px] mx-auto">
          <span className="text-[9px] uppercase font-bold text-zinc-500 block tracking-wider mb-0.5">
            Keputusan Akhir
          </span>
          <h2 className="text-3xl font-extrabold text-yellow-500 font-mono tracking-wide mt-1">
            {finalResult || "YES"}
          </h2>
        </div>
      </div>

      {/* Profit & Loss Card */}
      {showPnL && (
        <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-6 space-y-4">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block text-center">
            P&L
          </span>
          <div className="py-2">
          {/* Highlight (top) */}
          <div className="text-center pt-2 pb-1">
            <span className={`text-3xl font-black font-mono tracking-tight ${isWin ? "text-emerald-400" : "text-red-400"}`}>
              {isWin ? `+ ${pnlAmount.toFixed(2)}` : `- ${Math.abs(pnlAmount).toFixed(2)}`} <span className="text-sm font-bold">USDT</span>
            </span>
          </div>
          
          {/* Divider */}
          <div className="border-t border-dashed border-zinc-700/60 mt-2 mb-4" />
          
          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Status</span>
              <span className={`font-bold uppercase tracking-wider text-xs ${isWin ? "text-emerald-400" : "text-red-400"}`}>
                {statusText}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Saldo Akhir (Estimasi)</span>
              <span className="text-white font-bold font-mono">{estimatedBalance.toFixed(2)} USDT</span>
            </div>
          </div>
          
          <p className="text-[9px] text-zinc-500 font-mono text-center mt-6">
            {descriptionText}
          </p>
        </div>
      </div>
      )}
    </>
  );
}
