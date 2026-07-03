import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMarketStore } from "@/store/marketStore";
import { useToastStore } from "@/store/useToastStore";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Gavel,
  ShieldCheck,
} from "lucide-react-native";
import MarketStatusCard from "@/components/MarketStatusCard";
import BetDistributionCard from "@/components/BetDistributionCard";
import MarketResultCard from "@/components/MarketResultCard";
import LockedMarketCard from "@/components/LockedMarketCard";
import UserBetsCard from "@/components/UserBetsCard";
import { MotiView, AnimatePresence } from "moti";
import * as Clipboard from "expo-clipboard";

export default function PunterConsolePage() {
  const { id: marketId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { markets, bets: allBets, addBetToMarket, punterAddress, cumulativePnl } = useMarketStore();
  const showToast = useToastStore((s) => s.showToast);

  const market = markets.find((m) => m.market_id === marketId) ?? null;
  const bets = allBets.filter((b) => b.market_id === marketId);

  const [betAmount, setBetAmount] = useState("10");

  // Filter bets just for this user
  const userBets = bets.filter((b) => b.punter_pubkey === punterAddress);

  // ── Timer state ──
  const [openSecsLeft, setOpenSecsLeft] = useState<number | null>(null);
  const [frozenSecsLeft, setFrozenSecsLeft] = useState<number | null>(null);
  const [consensusSecsLeft, setConsensusSecsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!market || market.status !== "OPEN") { setOpenSecsLeft(null); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((60_000 - (Date.now() - market.created_timestamp)) / 1000));
      setOpenSecsLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [market?.status, market?.created_timestamp]); // eslint-disable-line

  useEffect(() => {
    if (!market || market.status !== "FROZEN_BETTING" || !market.frozen_at) { setFrozenSecsLeft(null); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((600_000 - (Date.now() - market.frozen_at!)) / 1000));
      setFrozenSecsLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [market?.status, market?.frozen_at]); // eslint-disable-line

  useEffect(() => {
    if (!market || market.status !== "AWAITING_CONSENSUS" || !market.resolved_at) { setConsensusSecsLeft(null); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((15_000 - (Date.now() - market.resolved_at!)) / 1000));
      setConsensusSecsLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [market?.status, market?.resolved_at]); // eslint-disable-line

  // ── Calculations ──
  const yesBetsSum = bets.filter((b) => b.choice === "YES").reduce((a, b) => a + b.amount_usdt, 0);
  const noBetsSum = bets.filter((b) => b.choice === "NO").reduce((a, b) => a + b.amount_usdt, 0);
  const totalPunterBets = yesBetsSum + noBetsSum;
  const yesPercent = totalPunterBets > 0 ? (yesBetsSum / totalPunterBets) * 100 : 50;
  const noPercent = totalPunterBets > 0 ? (noBetsSum / totalPunterBets) * 100 : 50;

  const myYesAmt = userBets.filter((b) => b.choice === "YES").reduce((a, b) => a + b.amount_usdt, 0);
  const myNoAmt = userBets.filter((b) => b.choice === "NO").reduce((a, b) => a + b.amount_usdt, 0);
  const potentialWinYes = market ? myYesAmt * (market.qvac_odds.YES - 1) - myNoAmt : 0;
  const potentialLossNo = market ? myNoAmt * (market.qvac_odds.NO - 1) - myYesAmt : 0;

  // ── Handlers ──
  const handlePlaceBet = (choice: "YES" | "NO") => {
    if (!market || market.status !== "OPEN" || !marketId) return;
    const amount = Number(betAmount);
    if (amount <= 0 || isNaN(amount)) {
      showToast("Invalid bet amount", "warning");
      return;
    }
    addBetToMarket(marketId, choice, amount, punterAddress);
    showToast(`Placed ${amount} USDT on ${choice}`, "success");
    setBetAmount("");
  };

  // ── Fallback if no market ──
  if (!marketId || !market) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-zinc-400 text-sm">Market not found or ended.</Text>
          <Link href="/punter" asChild>
            <Pressable style={styles.btnReturn} className="px-6 py-3 rounded-xl flex-row items-center gap-2">
              <ArrowLeft size={16} color="#d4d4d8" />
              <Text className="text-sm font-black uppercase text-white">Back to List</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View className="max-w-md w-full self-center px-6 pb-6">
            
            {/* ── Header ── */}
            <View className="py-3 flex-row justify-between items-center z-10 mb-6 w-full">
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => router.push("/punter")}
                  style={styles.backBtn}
                  className="items-center justify-center p-2.5 rounded-full"
                >
                  <ArrowLeft size={16} color="#d4d4d8" />
                </Pressable>
                <View>
                  <Text className="text-sm font-black tracking-tight text-white uppercase">
                    Place Bet
                  </Text>
                  <Pressable
                    onPress={async () => {
                      await Clipboard.setStringAsync(punterAddress);
                      showToast("Address copied.", "success");
                    }}
                    className="flex-row items-center gap-1.5 mt-0.5"
                  >
                    <Text className="text-[10px] font-mono text-zinc-500">
                      {punterAddress.slice(0, 6)}...{punterAddress.slice(-4)}
                    </Text>
                  </Pressable>
                </View>
              </View>
              {marketId && (
                <View style={styles.marketIdBadge} className="rounded-md px-2 py-1">
                  <Text className="text-[9px] font-mono text-emerald-400 font-bold">{marketId}</Text>
                </View>
              )}
            </View>

            {/* ── Content ── */}
            <View className="gap-5 pb-8">
              
              {/* Market Status Summary */}
              <MarketStatusCard
                title="Active Market"
                tournament={market.match_info.tournament}
                match={market.match_info.match}
                incidentDescription={market.incident_description}
                marketId={market.market_id}
                oddsYes={market.qvac_odds.YES}
                oddsNo={market.qvac_odds.NO}
                totalPool={market.total_pool}
                bandarStake={market.bandar_stake}
                timeLeftSeconds={
                  market.status === "OPEN" ? openSecsLeft
                  : market.status === "AWAITING_CONSENSUS" ? consensusSecsLeft
                  : market.status === "FROZEN_BETTING" ? frozenSecsLeft
                  : null
                }
                status={market.status}
                statusText={market.status === "DISPUTED_FROZEN" ? "DISPUTED" : undefined}
                statusColor={market.status === "DISPUTED_FROZEN" ? "#eab308" : undefined}
              />

              {/* ═══ STATE: DISPUTED ═══ */}
              {market.status === "DISPUTED_FROZEN" && (
                <LockedMarketCard
                  status={market.status}
                  resolutionOutcome={market.resolution_outcome ?? undefined}
                />
              )}

              {/* ═══ STATE: AWAITING_CONSENSUS ═══ */}
              {market.status === "AWAITING_CONSENSUS" && (
                <View style={styles.consensusPanel} className="rounded-3xl p-6 items-center">
                  <Gavel size={24} color="#facc15" />
                  <Text className="text-sm font-black text-white uppercase mt-3 text-center">
                    Bookmaker Proposed:{" "}
                    <Text className="text-yellow-400">{market.resolution_outcome}</Text>
                  </Text>
                  <Text className="text-xs text-zinc-400 mt-2 text-center leading-relaxed">
                    If this is incorrect, you can raise a dispute to trigger the Oracle API.
                  </Text>
                  
                  <View className="flex-row gap-3 w-full mt-5 pt-5 border-t border-yellow-900/30">
                    <Pressable
                      style={styles.btnAccept}
                      className="flex-1 py-3.5 rounded-xl flex-row items-center justify-center gap-2"
                    >
                      <ShieldCheck size={16} color="#34d399" />
                      <Text className="text-emerald-400 font-black uppercase text-xs">Accept (Auto)</Text>
                    </Pressable>
                    <Pressable
                      style={styles.btnDispute}
                      className="flex-1 py-3.5 rounded-xl flex-row items-center justify-center gap-2"
                    >
                      <AlertTriangle size={16} color="#ef4444" />
                      <Text className="text-red-500 font-black uppercase text-xs">Dispute</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ═══ STATE: FROZEN ═══ */}
              {market.status === "FROZEN_BETTING" && (
                <View style={styles.frozenPanel} className="rounded-2xl p-6 items-center">
                  <AlertTriangle size={32} color="#ef4444" className="mb-3" />
                  <Text className="text-base font-black text-red-500 uppercase tracking-widest text-center">
                    Betting Closed
                  </Text>
                  <Text className="text-xs text-zinc-300 mt-2 text-center leading-relaxed">
                    The referee has blown the whistle. Waiting for Bookmaker to input the official decision.
                  </Text>
                </View>
              )}

              {/* ═══ STATE: OPEN ═══ */}
              {market.status === "OPEN" && (
                <View style={styles.betPanel} className="rounded-3xl p-5 border border-zinc-800 gap-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Stake Amount</Text>
                    <Text className="text-xs font-mono text-zinc-500">
                      Balance: <Text className="text-white font-bold">{100 + cumulativePnl} USDT</Text>
                    </Text>
                  </View>
                  
                  <View className="relative">
                    <TextInput
                      keyboardType="numeric"
                      value={betAmount}
                      onChangeText={setBetAmount}
                      style={styles.input}
                      className="w-full text-center text-3xl font-black font-mono text-yellow-400 py-4 rounded-2xl"
                      placeholder="0"
                      placeholderTextColor="#52525b"
                    />
                    <View className="absolute right-4 top-0 bottom-0 justify-center">
                      <Text className="text-sm font-bold text-zinc-500">USDT</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row gap-3 pt-2">
                    <Pressable
                      onPress={() => handlePlaceBet("YES")}
                      style={({ pressed }) => [
                        styles.btnBetYes,
                        pressed && styles.btnPressed,
                        (!betAmount || isNaN(Number(betAmount)) || Number(betAmount) <= 0) && styles.btnDisabled
                      ]}
                      className="flex-1 py-4 rounded-xl items-center flex-row justify-center gap-2"
                    >
                      <TrendingUp size={16} color="#000000" />
                      <Text style={styles.btnBetYesText} className="text-sm font-black uppercase tracking-wider">
                        BET YES
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handlePlaceBet("NO")}
                      style={({ pressed }) => [
                        styles.btnBetNo,
                        pressed && styles.btnPressed,
                        (!betAmount || isNaN(Number(betAmount)) || Number(betAmount) <= 0) && styles.btnDisabled
                      ]}
                      className="flex-1 py-4 rounded-xl items-center flex-row justify-center gap-2"
                    >
                      <TrendingUp size={16} color="#d4d4d8" />
                      <Text style={styles.btnBetNoText} className="text-sm font-black uppercase tracking-wider">
                        BET NO
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ═══ STATE: CLOSED ═══ */}
              {market.status === "CLOSED" && (() => {
                const parts = market.match_info.match.split(" vs ");
                let payout = 0;
                let statusTxt: "SUCCESS (WIN)" | "FAILED (LOSS)" = "FAILED (LOSS)";
                
                myYesAmt > 0 && market.resolution_outcome === "YES" && (payout += myYesAmt * market.qvac_odds.YES, statusTxt = "SUCCESS (WIN)");
                myNoAmt > 0 && market.resolution_outcome === "NO" && (payout += myNoAmt * market.qvac_odds.NO, statusTxt = "SUCCESS (WIN)");
                const profitLoss = payout > 0 ? payout - (myYesAmt + myNoAmt) : -(myYesAmt + myNoAmt);

                return (
                  <View className="gap-3">
                    <MarketResultCard
                      tournament={market.match_info.tournament}
                      teamA={parts[0] || ""}
                      teamB={parts[1] || ""}
                      incident={market.incident_description}
                      finalResult={market.resolution_outcome as "YES" | "NO"}
                      pnlAmount={profitLoss}
                      statusText={statusTxt}
                      estimatedBalance={100 + cumulativePnl + profitLoss}
                      descriptionText={payout > 0 ? "Winnings credited to wallet." : "Better luck next time."}
                      showPnL={userBets.length > 0}
                    />
                  </View>
                );
              })()}

              {/* Punter's Active Bets & Distribution */}
              <UserBetsCard
                bets={userBets.map(b => ({
                  id: b.bet_id,
                  type: b.choice,
                  amount: b.amount_usdt,
                  timestamp: new Date(b.timestamp).toISOString()
                }))}
                potentialWinYes={potentialWinYes}
                potentialLossNo={potentialLossNo}
              />
              
              <BetDistributionCard
                totalPunters={bets.length}
                totalPool={market.total_pool}
                yesPercentage={yesPercent}
                noPercentage={noPercent}
                yesPool={yesBetsSum}
                noPool={noBetsSum}
              />

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000000" },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  backBtn: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  marketIdBadge: {
    backgroundColor: "rgba(52,211,153,0.1)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.2)",
  },
  btnReturn: {
    backgroundColor: "#27272a",
  },
  consensusPanel: {
    backgroundColor: "rgba(24,24,27,0.8)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.2)",
  },
  frozenPanel: {
    backgroundColor: "rgba(69,10,10,0.3)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  betPanel: {
    backgroundColor: "rgba(24,24,27,0.6)",
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  btnBetYes: {
    backgroundColor: "#eab308",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.4)",
    shadowColor: "rgba(234,179,8,0.25)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  btnBetNo: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#3f3f46",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  btnBetYesText: { color: "#000000" },
  btnBetNoText: { color: "#d4d4d8" },
  btnPressed: { opacity: 0.8 },
  btnDisabled: { opacity: 0.3 },
  btnAccept: {
    backgroundColor: "rgba(52,211,153,0.1)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.3)",
  },
  btnDispute: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
});
