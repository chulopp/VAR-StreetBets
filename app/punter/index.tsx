import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMarketStore, MarketState } from "@/store/marketStore";
import {
  ArrowLeft,
  Users,
  Activity,
  DoorOpen,
  Wifi,
  Radio,
  Timer,
  AlertTriangle,
  Flame,
} from "lucide-react-native";
import GlobalPnlCard from "@/components/GlobalPnlCard";
import { MotiView, AnimatePresence } from "moti";
import { useToastStore } from "@/store/useToastStore";
import * as Clipboard from "expo-clipboard";

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─── MarketItem Sub-component ──────────────────────────────────────────────
interface MarketItemProps {
  market: MarketState;
  onEnter: (id: string) => void;
}

function MarketItem({ market, onEnter }: MarketItemProps) {
  const [openSecsLeft, setOpenSecsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (market.status !== "OPEN") {
      setOpenSecsLeft(null);
      return;
    }
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((60_000 - (Date.now() - market.created_timestamp)) / 1000)
      );
      setOpenSecsLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [market.status, market.created_timestamp]);

  const isOpenLowTime = openSecsLeft !== null && openSecsLeft <= 15;

  const dotColor =
    market.status === "FROZEN_BETTING" ? "#ef4444"
    : market.status === "AWAITING_CONSENSUS" ? "#facc15"
    : market.status === "DISPUTED_FROZEN" || market.status === "DISPUTED" ? "#eab308"
    : isOpenLowTime ? "#ef4444"
    : "#34d399";

  const textColor =
    market.status === "FROZEN_BETTING" ? "#f87171"
    : market.status === "AWAITING_CONSENSUS" ? "#facc15"
    : market.status === "DISPUTED_FROZEN" || market.status === "DISPUTED" ? "#eab308"
    : isOpenLowTime ? "#ef4444"
    : "#34d399";

  const statusLabel =
    market.status === "FROZEN_BETTING" ? "FROZEN"
    : market.status === "AWAITING_CONSENSUS" ? "CONSENSUS"
    : market.status === "DISPUTED_FROZEN" || market.status === "DISPUTED" ? "DISPUTED"
    : "OPEN";

  return (
    <View style={styles.marketCard} className="rounded-2xl p-4 gap-3">
      {/* Header Info */}
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-[9px] text-yellow-500 font-bold uppercase tracking-wide">
          {market.match_info.tournament}
        </Text>
        <View className="flex-row items-center gap-2">
          {market.status === "OPEN" && openSecsLeft !== null && openSecsLeft > 0 && (
            <Text
              style={{ color: isOpenLowTime ? "#ef4444" : "#facc15" }}
              className="font-mono font-bold text-xs"
            >
              {formatTime(openSecsLeft)}
            </Text>
          )}
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
          <Text
            style={{ color: textColor }}
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Match Title & ID */}
      <View>
        <Text className="text-base font-black text-white tracking-tight leading-tight">
          {market.match_info.match}
        </Text>
        <Text className="text-[10px] font-medium text-zinc-600 tracking-wider font-mono mt-1">
          ID: {market.market_id}
        </Text>
      </View>

      {/* ENTER BUTTON */}
      <Pressable
        onPress={() => onEnter(market.market_id)}
        style={styles.btnEnter}
        className="w-full flex-row items-center justify-center gap-2 py-3 px-4 rounded-xl mt-2"
      >
        <DoorOpen size={14} color="#09090b" />
        <Text className="text-[#09090b] font-black uppercase text-xs">JOIN MARKET</Text>
      </Pressable>
    </View>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function PunterDashboardPage() {
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);
  const { markets, bets, punterAddress, cumulativePnl } = useMarketStore();

  const handleEnterMarket = (id: string) => {
    router.push(`/punter/console?id=${id}`);
  };

  // Only show OPEN markets on dashboard
  const activeMarkets = markets.filter((m) => m.status === "OPEN");
  
  // Calculate Punter's personal P&L (simplified logic for demo)
  const myBets = bets.filter((b) => b.punter_pubkey === punterAddress);
  
  // PnL calculated based on closed markets
  let punterPnl = 0;
  markets.forEach(m => {
    if (m.status === "CLOSED" && m.resolution_outcome) {
      const myBetsOnMarket = myBets.filter(b => b.market_id === m.market_id);
      myBetsOnMarket.forEach(bet => {
        if (bet.choice === m.resolution_outcome) {
          // Win - simplified payout calculation
          // Base payout is original bet + profit portion (ignoring bandar fee here for simplicity)
          // In real logic, this should calculate exact odds payout
          punterPnl += bet.amount_usdt * (m.qvac_odds[bet.choice] - 1); 
        } else {
          // Loss
          punterPnl -= bet.amount_usdt;
        }
      });
    }
  });
  
  const estimatedBalance = 100 + punterPnl;
  const closedCount = markets.filter((m) => m.status === "CLOSED").length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View className="max-w-md w-full self-center px-5 pb-16">
          {/* Header */}
          <View className="py-3 flex-row items-center gap-3 mb-5">
            <Link href="/" asChild>
              <Pressable
                style={styles.backBtn}
                className="items-center justify-center p-2.5 rounded-full"
              >
                <ArrowLeft size={16} color="#d4d4d8" />
              </Pressable>
            </Link>
            <View>
              <Text className="text-sm font-black tracking-tight text-zinc-300 uppercase">
                Punter Console
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
                <Users size={12} color="#71717a" />
              </Pressable>
            </View>
          </View>

          <View className="gap-5">
            {/* ── Radar Scanner ── */}
            <View style={styles.radarCard} className="rounded-3xl p-6 items-center justify-center min-h-[220px]">
              {/* Radar Circle */}
              <View className="relative w-32 h-32 items-center justify-center mb-6">
                <View style={styles.radarBorder1} className="absolute w-32 h-32 rounded-full" />
                <View style={styles.radarBorder2} className="absolute w-24 h-24 rounded-full" />
                
                {/* Ping Animation via Moti */}
                <MotiView
                  from={{ scale: 0.5, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ type: "timing", duration: 2000, loop: true }}
                  style={[styles.radarPing, { position: 'absolute', width: 48, height: 48, borderRadius: 24 }]}
                />
                
                <View style={styles.radarCenter} className="w-12 h-12 rounded-full items-center justify-center z-10">
                  <Wifi size={20} color="#eab308" />
                </View>

                {/* Market Found Indicators */}
                <AnimatePresence>
                  {activeMarkets.map((m, i) => (
                    <MotiView
                      key={m.market_id}
                      from={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute z-20"
                      style={{
                        top: `${20 + (i * 30) % 60}%`,
                        left: `${20 + (i * 45) % 60}%`,
                      }}
                    >
                      <View style={styles.marketDot} className="w-3 h-3 rounded-full" />
                    </MotiView>
                  ))}
                </AnimatePresence>
              </View>

              <Text className="text-sm font-bold text-white tracking-widest uppercase mb-1">
                Scanning Pears Network...
              </Text>
              <Text className="text-xs text-zinc-400 font-medium">
                Searching for local Bookmakers
              </Text>
            </View>

            {/* ── Active Markets List ── */}
            <View style={styles.listCard} className="rounded-3xl p-5">
              <View className="flex-row items-center gap-2 mb-4">
                <Radio size={16} color="#34d399" />
                <Text className="text-xs font-bold text-white uppercase tracking-wider">
                  Nearby Markets
                </Text>
                <View style={styles.countBadge} className="ml-auto rounded-full px-2 py-0.5">
                  <Text className="text-[9px] font-mono text-zinc-600">
                    {activeMarkets.length} Found
                  </Text>
                </View>
              </View>

              {activeMarkets.length === 0 ? (
                <View style={styles.emptyBox} className="py-8 items-center rounded-2xl">
                  <Flame size={24} color="#3f3f46" />
                  <Text className="text-[11px] text-zinc-500 mt-2 text-center max-w-[200px]">
                    Waiting for a bookmaker to open a market nearby...
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  <AnimatePresence>
                    {activeMarkets.map((m) => (
                      <MotiView
                        key={m.market_id}
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <MarketItem market={m} onEnter={handleEnterMarket} />
                      </MotiView>
                    ))}
                  </AnimatePresence>
                </View>
              )}
            </View>

            {/* ── P&L Card ── */}
            <GlobalPnlCard
              title="PUNTER P&L"
              pnlAmount={punterPnl}
              statusText={punterPnl >= 0 ? "PROFIT" : "LOSS"}
              estimatedBalance={estimatedBalance}
              descriptionText="Estimated payout from won/lost bets."
              totalMarketsPlayed={closedCount}
            />
          </View>
        </View>
      </ScrollView>
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
  radarCard: {
    backgroundColor: "rgba(24,24,27,0.8)",
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.15)", // subtle yellow tint
    shadowColor: "rgba(234,179,8,0.1)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 8,
  },
  radarBorder1: {
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.15)",
  },
  radarBorder2: {
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.25)",
  },
  radarPing: {
    backgroundColor: "rgba(234,179,8,0.4)",
  },
  radarCenter: {
    backgroundColor: "rgba(234,179,8,0.15)",
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.5)",
    shadowColor: "rgba(234,179,8,0.5)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  marketDot: {
    backgroundColor: "#34d399", // emerald-400
    shadowColor: "#34d399",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  listCard: {
    backgroundColor: "rgba(24,24,27,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  countBadge: {
    backgroundColor: "rgba(39,39,42,0.6)",
    borderWidth: 1,
    borderColor: "rgba(63,63,70,0.5)",
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#27272a",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  marketCard: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  btnEnter: {
    backgroundColor: "#eab308",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.4)",
  },
});
