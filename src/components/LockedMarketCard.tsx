import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MarketStatus } from "./MarketStatusCard";

interface LockedMarketCardProps {
  status: MarketStatus;
  resolutionOutcome?: string;
}

export default function LockedMarketCard({ status, resolutionOutcome }: LockedMarketCardProps) {
  const isDisputed = status === "DISPUTED" || status === "DISPUTED_FROZEN";
  const dotColor = isDisputed ? "#eab308" : "#ef4444";
  const textColor = isDisputed ? "#facc15" : "#f87171";

  return (
    <View style={styles.card} className="rounded-2xl p-6 items-center">
      <View className="flex-row items-center justify-center gap-2">
        <Text className="text-base font-black text-white uppercase tracking-wide">
          Market Locked
        </Text>
      </View>

      <Text className="text-xs text-zinc-400 leading-relaxed text-center mt-4">
        {isDisputed
          ? "Betting closed. Awaiting automatic resolution via Oracle API due to an active dispute."
          : status === "FROZEN_BETTING"
          ? "Betting closed. Awaiting the official referee decision via Bookmaker input."
          : (
              <>
                {"Bookmaker submitted result: "}
                <Text className="text-yellow-500 font-bold">{resolutionOutcome || "YES"}</Text>
                {". Awaiting punter consensus..."}
              </>
            )}
      </Text>

      <View
        style={isDisputed ? styles.disputedIndicator : styles.frozenIndicator}
        className="flex-row items-center justify-center gap-2 pt-1 mt-4"
      >
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={{ color: textColor }} className="text-[10px] font-bold uppercase tracking-wider">
          {isDisputed
            ? "VERIFYING ORACLE API..."
            : status === "FROZEN_BETTING"
            ? "Awaiting Referee Decision"
            : "Awaiting Consensus"}
        </Text>
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
    gap: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  disputedIndicator: {
    // animate-pulse via Animated or Moti if needed
  },
  frozenIndicator: {},
});
