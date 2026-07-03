import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface MarketResultCardProps {
  tournament: string;
  teamA: string;
  teamB: string;
  incident: string;
  finalResult: "YES" | "NO";
  pnlAmount: number;
  statusText: "SUCCESS (WIN)" | "FAILED (LOSS)" | "PROFIT (FEE)";
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
      <View style={styles.card} className="rounded-2xl p-6 items-center">
        <View className="gap-1.5 items-center">
          <Text className="text-base font-extrabold text-white uppercase tracking-tight">
            MARKET CLOSED
          </Text>
          <Text className="text-xs text-zinc-500 font-semibold">
            {tournament} • {teamA} vs {teamB}
          </Text>
          <Text className="text-[11px] text-zinc-400 mt-1.5 italic font-medium text-center leading-normal max-w-[260px]">
            {"\u201C"}{incident}{"\u201D"}
          </Text>
        </View>

        <View style={styles.resultBox} className="rounded-2xl py-2.5 px-4 items-center mt-4">
          <Text className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">
            Final Decision
          </Text>
          <Text className="text-3xl font-extrabold text-yellow-500 font-mono tracking-wide mt-1">
            {finalResult || "YES"}
          </Text>
        </View>
      </View>

      {/* Profit & Loss Card */}
      {showPnL && (
        <View style={styles.card} className="rounded-2xl p-6">
          <Text className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-center">
            P&L
          </Text>

          <View className="py-2">
            {/* Highlight */}
            <View className="items-center pt-2 pb-1">
              <Text className={`text-3xl font-black font-mono tracking-tight ${isWin ? "text-emerald-400" : "text-red-400"}`}>
                {isWin ? `+ ${pnlAmount.toFixed(2)}` : `- ${Math.abs(pnlAmount).toFixed(2)}`}{" "}
                <Text className={`text-sm font-bold ${isWin ? "text-emerald-400" : "text-red-400"}`}>USDT</Text>
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} className="mt-2 mb-4" />

            {/* Details */}
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

            <Text className="text-[9px] text-zinc-500 font-mono text-center mt-6">
              {descriptionText}
            </Text>
          </View>
        </View>
      )}
    </>
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
  resultBox: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "#27272a",
    maxWidth: 200,
    alignSelf: "center",
  },
  divider: {
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(63,63,70,0.6)",
  },
});
