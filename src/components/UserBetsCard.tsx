import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

interface UserBetsCardProps {
  bets: Array<{ id: string; type: "YES" | "NO"; amount: number; timestamp: string }>;
  potentialWinYes: number;
  potentialLossNo: number;
}

export default function UserBetsCard({ bets, potentialWinYes, potentialLossNo }: UserBetsCardProps) {
  if (!bets || bets.length === 0) return null;

  return (
    <View style={styles.card} className="rounded-2xl p-6">
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Your Bets</Text>
        <Text className="text-[10px] text-zinc-600 font-mono">{bets.length} bets</Text>
      </View>

      <ScrollView style={styles.betList} showsVerticalScrollIndicator={false}>
        {bets
          .slice()
          .reverse()
          .map((bet) => (
            <View
              key={bet.id}
              style={styles.betRow}
              className="flex-row items-center justify-between p-2.5 rounded-2xl border border-zinc-800"
            >
              <View className="flex-row items-center gap-2">
                <View style={bet.type === "YES" ? styles.badgeYes : styles.badgeNo} className="rounded-md px-2 py-0.5">
                  <Text style={bet.type === "YES" ? styles.badgeYesText : styles.badgeNoText}
                    className="text-[10px] uppercase tracking-wider font-bold">
                    {bet.type}
                  </Text>
                </View>
                <Text className="text-[9px] text-zinc-500">
                  {new Date(bet.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </Text>
              </View>
              <Text className="text-xs font-bold text-white font-mono">{bet.amount} USDT</Text>
            </View>
          ))}
      </ScrollView>

      {/* Estimasi P&L */}
      <View style={styles.plRow} className="flex-row items-center justify-between p-3 mt-4 rounded-xl border border-zinc-800/50">
        {/* YES P&L */}
        <View className="flex-row items-center gap-2">
          <View style={styles.badgeYes} className="rounded-md px-2 py-0.5">
            <Text style={styles.badgeYesText} className="text-[10px] uppercase tracking-wider font-bold">YES</Text>
          </View>
          <Text className={`text-sm font-bold font-mono ${potentialWinYes >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {potentialWinYes >= 0 ? "+" : ""}
            {potentialWinYes.toFixed(2)} USDT
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.vertDivider} />

        {/* NO P&L */}
        <View className="flex-row items-center gap-2">
          <View style={styles.badgeNo} className="rounded-md px-2 py-0.5">
            <Text style={styles.badgeNoText} className="text-[10px] uppercase tracking-wider font-bold">NO</Text>
          </View>
          <Text className={`text-sm font-bold font-mono ${potentialLossNo >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {potentialLossNo >= 0 ? "+" : ""}
            {potentialLossNo.toFixed(2)} USDT
          </Text>
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
    gap: 14,
  },
  betList: {
    maxHeight: 120,
    gap: 8,
  },
  betRow: {
    backgroundColor: "rgba(0,0,0,0.5)",
    marginBottom: 8,
  },
  badgeYes: {
    backgroundColor: "#eab308",
  },
  badgeYesText: {
    color: "#09090b",
  },
  badgeNo: {
    backgroundColor: "#3f3f46",
  },
  badgeNoText: {
    color: "#d4d4d8",
  },
  vertDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(63,63,70,0.5)",
  },
  plRow: {
    backgroundColor: "rgba(24,24,27,0.5)",
  },
});
