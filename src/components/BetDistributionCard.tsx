"use client";

import React from "react";
import { View, Text, StyleSheet } from "react-native";

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
    <View style={styles.card} className="rounded-3xl p-4">
      <View className="flex-row justify-between items-center">
        <Text className="text-xs font-bold text-zinc-400">
          Bet Distribution ({totalPunters} Punters)
        </Text>
        <Text className="text-[11px] text-zinc-500 font-mono">
          Pool:{" "}
          <Text className="text-yellow-400 font-bold">{totalPool} USDT</Text>
        </Text>
      </View>

      <View className="gap-1.5 mt-3.5">
        {/* Progress Bar */}
        <View style={styles.progressTrack} className="rounded-full overflow-hidden flex-row">
          <View
            style={[
              styles.progressYes,
              { width: `${yesPercentage}%` as any },
            ]}
          />
          <View
            style={[
              styles.progressNo,
              { width: `${noPercentage}%` as any },
            ]}
          />
        </View>

        {/* Labels */}
        <View className="flex-row justify-between">
          <Text className="text-xs font-bold text-yellow-400">
            YES: {yesPercentage.toFixed(0)}%{" "}
            <Text className="text-[10px] text-zinc-500 font-normal">({yesPool} USDT)</Text>
          </Text>
          <Text className="text-xs font-bold text-zinc-400">
            <Text className="text-[10px] text-zinc-500 font-normal">({noPool} USDT) </Text>
            NO: {noPercentage.toFixed(0)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  progressTrack: {
    height: 12,
    backgroundColor: "#27272a",
  },
  progressYes: {
    height: "100%",
    // gradient approximated with solid color (LinearGradient would need expo-linear-gradient)
    backgroundColor: "#facc15",
  },
  progressNo: {
    height: "100%",
    backgroundColor: "#71717a",
  },
});
