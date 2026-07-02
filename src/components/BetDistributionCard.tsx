"use client";

import React from "react";

interface BetDistributionCardProps {
  totalPunters: number;
  totalPool: number;
  yesPercentage: number;
  noPercentage: number;
  yesPool: number;
  noPool: number;
}

export default function BetDistributionCard({
  totalPunters,
  totalPool,
  yesPercentage,
  noPercentage,
  yesPool,
  noPool,
}: BetDistributionCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3.5">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-zinc-400">
          Bet Distribution ({totalPunters} Punters)
        </h4>
        <div className="text-[11px] text-zinc-500 font-mono">
          Pool:{" "}
          <span className="text-yellow-400 font-bold">{totalPool} USDT</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-3 w-full rounded-full overflow-hidden bg-zinc-800 flex">
          <div
            style={{ width: `${yesPercentage}%` }}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full transition-all duration-500"
          />
          <div
            style={{ width: `${noPercentage}%` }}
            className="bg-gradient-to-l from-zinc-500 to-zinc-600 h-full transition-all duration-500"
          />
        </div>
        <div className="flex justify-between text-xs font-bold">
          <span className="text-yellow-400">
            YES: {yesPercentage.toFixed(0)}%{" "}
            <span className="text-[10px] text-zinc-500 font-normal">
              ({yesPool} USDT)
            </span>
          </span>
          <span className="text-zinc-400">
            <span className="text-[10px] text-zinc-500 font-normal">
              ({noPool} USDT)
            </span>{" "}
            NO: {noPercentage.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
