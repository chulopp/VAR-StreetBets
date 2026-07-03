"use client";

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Activity, TrendingUp } from "lucide-react-native";

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
function StatusBadge({
  status,
  statusText,
  statusColor,
}: {
  status: MarketStatus;
  statusText?: string;
  statusColor?: string;
}) {
  const dotColor = {
    OPEN: "#34d399",
    FROZEN_BETTING: "#ef4444",
    AWAITING_CONSENSUS: "#facc15",
    DISPUTED_FROZEN: "#eab308",
    DISPUTED: "#eab308",
    GRACE_PERIOD: "#facc15",
    CLOSED: "#71717a",
  }[status] ?? "#71717a";

  const textColor = statusColor || ({
    OPEN: "#34d399",
    FROZEN_BETTING: "#f87171",
    AWAITING_CONSENSUS: "#facc15",
    DISPUTED_FROZEN: "#eab308",
    DISPUTED: "#facc15",
    GRACE_PERIOD: "#facc15",
    CLOSED: "#a1a1aa",
  }[status] ?? "#a1a1aa");

  const label = statusText || ({
    OPEN: "Open",
    FROZEN_BETTING: "Frozen",
    AWAITING_CONSENSUS: "Consensus",
    DISPUTED_FROZEN: "Disputed",
    DISPUTED: "Disputed",
    GRACE_PERIOD: "Grace Period",
    CLOSED: "Closed",
  }[status] ?? status);

  return (
    <View className="flex-row items-center gap-1.5">
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={{ color: textColor }} className="text-[10px] font-bold uppercase">
        {label}
      </Text>
    </View>
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

  const isLowTime = showTimer && typeof timeLeftSeconds === "number" && timeLeftSeconds <= 15;

  return (
    <View style={styles.card} className="rounded-2xl p-6">
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Activity size={16} color="#facc15" />
          <Text className="text-xs font-bold text-white uppercase tracking-wider">{title}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          {showTimer && (
            <Text
              className={`text-xs font-mono font-bold ${
                isLowTime ? "text-red-500" : "text-yellow-500"
              }`}
            >
              {formatTime(timeLeftSeconds!)}
            </Text>
          )}
          <StatusBadge status={status} statusText={statusText} statusColor={statusColor} />
        </View>
      </View>

      {/* ── Match Info ── */}
      <View className="gap-1.5 border-b border-zinc-800 pb-3">
        <Text className="text-[10px] text-yellow-500 font-bold uppercase">{tournament}</Text>
        <Text className="text-lg font-black text-white tracking-tight">{match}</Text>
        <View style={styles.incidentBox} className="rounded-2xl p-3 mt-2">
          <Text className="text-[9px] uppercase font-bold text-zinc-500 mb-1">
            Incident Description
          </Text>
          <Text className="text-xs text-zinc-200 leading-relaxed font-semibold">
            {incidentDescription}
          </Text>
        </View>
        <Text className="text-[9px] text-zinc-500 font-mono mt-1">ID: {marketId}</Text>
      </View>

      {/* ── Odds Display ── */}
      <View className="flex-row gap-2">
        <View style={styles.oddsYesBox} className="flex-1 items-center p-3 rounded-2xl">
          <View className="flex-row items-center justify-center gap-1 mb-1">
            <TrendingUp size={12} color="#facc15" />
            <Text className="text-[9px] text-yellow-500 font-extrabold uppercase tracking-wide">
              Odds YES
            </Text>
          </View>
          <Text className="text-xl font-black text-yellow-400 font-mono">{oddsYes.toFixed(2)}x</Text>
        </View>
        <View style={styles.oddsNoBox} className="flex-1 items-center p-3 rounded-2xl">
          <View className="flex-row items-center justify-center gap-1 mb-1">
            <TrendingUp size={12} color="#71717a" />
            <Text className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide">
              Odds NO
            </Text>
          </View>
          <Text className="text-xl font-black text-zinc-300 font-mono">{oddsNo.toFixed(2)}x</Text>
        </View>
      </View>

      {/* ── Pool Info ── */}
      <View className="border-t border-zinc-800 pt-2 gap-1.5 mt-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] text-zinc-500">Total Pool</Text>
          <Text className="text-[11px] text-yellow-400 font-bold font-mono">{totalPool} USDT</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] text-zinc-500">Bandar Stake</Text>
          <Text className="text-[11px] text-zinc-300 font-bold font-mono">{bandarStake} USDT</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(24,24,27,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
    gap: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  incidentBox: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(39,39,42,0.6)",
  },
  oddsYesBox: {
    backgroundColor: "rgba(234,179,8,0.05)",
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.15)",
  },
  oddsNoBox: {
    backgroundColor: "rgba(39,39,42,0.5)",
    borderWidth: 1,
    borderColor: "rgba(63,63,70,0.5)",
  },
});
