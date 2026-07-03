"use client";

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DollarSign } from "lucide-react-native";

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
  descriptionText = "Estimated based on 10% Spread Fee from resolved pools.",
  totalMarketsPlayed,
}: GlobalPnlCardProps) {
  const isWin = pnlAmount >= 0;

  return (
    <View style={styles.card} className="rounded-2xl p-6">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <DollarSign size={16} color="#facc15" />
          <Text className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            {title}
          </Text>
        </View>
        {totalMarketsPlayed !== undefined && (
          <View style={styles.badgeBg} className="rounded-full px-2 py-0.5">
            <Text className="text-[9px] text-zinc-600 font-mono">
              {totalMarketsPlayed} Markets Closed
            </Text>
          </View>
        )}
      </View>

      {/* PnL Highlight */}
      <View className="items-center pt-2 pb-1">
        <Text className={`text-4xl font-black font-mono tracking-tight ${isWin ? "text-emerald-400" : "text-red-400"}`}>
          {isWin ? "+" : "-"}
          {Math.abs(pnlAmount).toFixed(2)}
          <Text className={`text-base font-bold ${isWin ? "text-emerald-400" : "text-red-400"}`}> USDT</Text>
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} className="border-t border-dashed border-zinc-700/60" />

      {/* Detail Rows */}
      <View className="gap-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-zinc-400">Status</Text>
          <Text className={`font-bold uppercase tracking-wider text-xs ${isWin ? "text-emerald-400" : "text-red-400"}`}>
            {statusText}
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-zinc-400">Final Balance (Est.)</Text>
          <Text className="text-white font-bold font-mono">{estimatedBalance.toFixed(2)} USDT</Text>
        </View>
      </View>

      {/* Description */}
      <Text className="text-[9px] text-zinc-600 font-mono text-center pt-2 leading-relaxed">
        {descriptionText}
      </Text>
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
  badgeBg: {
    backgroundColor: "rgba(39,39,42,0.6)",
    borderWidth: 1,
    borderColor: "rgba(63,63,70,0.5)",
  },
  divider: {
    borderStyle: "dashed",
  },
});
