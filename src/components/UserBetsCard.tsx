import React from "react";

interface UserBetsCardProps {
  bets: Array<{ id: string; type: "YES" | "NO"; amount: number; timestamp: string }>;
  potentialWinYes: number;
  potentialLossNo: number;
}

export default function UserBetsCard({ bets, potentialWinYes, potentialLossNo }: UserBetsCardProps) {
  if (!bets || bets.length === 0) return null;

  return (
    <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-6 space-y-3.5">
      <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center justify-between">
        <span>Your Bets</span>
        <span className="text-zinc-650 font-mono">{bets.length} bets</span>
      </h4>
      <div className="space-y-2 max-h-[120px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {bets
          .slice()
          .reverse()
          .map((bet) => (
            <div
              key={bet.id}
              className="flex items-center justify-between p-2.5 bg-black/50 rounded-2xl border border-zinc-800"
            >
              <div className="flex items-center gap-2">
                <span
                  className={
                    bet.type === "YES"
                      ? "bg-yellow-500 text-zinc-950 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md"
                      : "bg-zinc-700 text-zinc-300 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md"
                  }
                >
                  {bet.type}
                </span>
                <span className="text-[9px] text-zinc-605">
                  {new Date(bet.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
              <span className="text-xs font-bold text-white font-mono">
                {bet.amount} USDT
              </span>
            </div>
          ))}
      </div>

      {/* Estimasi P&L (Total) */}
      <div className="flex items-center justify-between p-3 mt-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
        {/* Elemen Kiri (YES) */}
        <div className="flex items-center gap-2">
          <span className="bg-yellow-500 text-zinc-950 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md">
            YES
          </span>
          <span
            className={`text-sm font-bold font-mono ${
              potentialWinYes >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {potentialWinYes >= 0 ? "+" : ""}
            {potentialWinYes.toFixed(2)} USDT
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-zinc-700/50"></div>

        {/* Elemen Kanan (NO) */}
        <div className="flex items-center gap-2">
          <span className="bg-zinc-700 text-zinc-300 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md">
            NO
          </span>
          <span
            className={`text-sm font-bold font-mono ${
              potentialLossNo >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {potentialLossNo >= 0 ? "+" : ""}
            {potentialLossNo.toFixed(2)} USDT
          </span>
        </div>
      </div>
    </div>
  );
}
