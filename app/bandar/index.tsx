import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMarketStore, MarketState } from "@/store/marketStore";
import {
  ArrowLeft,
  Crown,
  AlertTriangle,
  TrendingUp,
  Activity,
  DoorOpen,
  Copy,
} from "lucide-react-native";
import GlobalPnlCard from "@/components/GlobalPnlCard";
import { useToastStore } from "@/store/useToastStore";
import * as Clipboard from "expo-clipboard";

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─── MarketItem sub-component ──────────────────────────────────────────────
interface MarketItemProps {
  market: MarketState;
  isDisputed: boolean;
  onEnter: (id: string) => void;
}

function MarketItem({ market, isDisputed, onEnter }: MarketItemProps) {
  const { freezeMarketById, disputeMarketById, closeMarketById } = useMarketStore();

  const [openSecsLeft, setOpenSecsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (market.status !== "OPEN") { setOpenSecsLeft(null); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((60_000 - (Date.now() - market.created_timestamp)) / 1000));
      setOpenSecsLeft(remaining);
      if (remaining <= 0) freezeMarketById(market.market_id);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [market.market_id, market.status, market.created_timestamp, freezeMarketById]);

  const [frozenSecsLeft, setFrozenSecsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (market.status !== "FROZEN_BETTING" || !market.frozen_at) { setFrozenSecsLeft(null); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((600_000 - (Date.now() - market.frozen_at!)) / 1000));
      setFrozenSecsLeft(remaining);
      if (remaining <= 0) disputeMarketById(market.market_id);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [market.market_id, market.status, market.frozen_at, disputeMarketById]);

  const [consensusSecsLeft, setConsensusSecsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (market.status !== "AWAITING_CONSENSUS" || !market.resolved_at) { setConsensusSecsLeft(null); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((15_000 - (Date.now() - market.resolved_at!)) / 1000));
      setConsensusSecsLeft(remaining);
      if (remaining <= 0) closeMarketById(market.market_id);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [market.market_id, market.status, market.resolved_at, closeMarketById]);

  const isOpenLowTime = openSecsLeft !== null && openSecsLeft <= 15;
  const isConsensusLowTime = consensusSecsLeft !== null && consensusSecsLeft > 0;

  const dotColor = isDisputed ? "#eab308"
    : market.status === "FROZEN_BETTING" ? "#ef4444"
    : market.status === "AWAITING_CONSENSUS" ? "#facc15"
    : isOpenLowTime ? "#ef4444"
    : "#34d399";

  const textColor = isDisputed ? "#eab308"
    : market.status === "FROZEN_BETTING" ? "#f87171"
    : market.status === "AWAITING_CONSENSUS" ? "#facc15"
    : isOpenLowTime ? "#ef4444"
    : "#34d399";

  const statusLabel = isDisputed ? "DISPUTED"
    : market.status === "OPEN" ? "OPEN"
    : market.status === "FROZEN_BETTING" ? "FROZEN"
    : market.status === "AWAITING_CONSENSUS" ? "CONSENSUS"
    : market.status;

  const countdownDisplay = isDisputed ? null
    : market.status === "OPEN" && openSecsLeft !== null && openSecsLeft > 0 ? formatTime(openSecsLeft)
    : market.status === "FROZEN_BETTING" && frozenSecsLeft !== null && frozenSecsLeft > 0 ? formatTime(frozenSecsLeft)
    : market.status === "AWAITING_CONSENSUS" && consensusSecsLeft !== null && consensusSecsLeft > 0 ? formatTime(consensusSecsLeft)
    : null;

  const countdownColor = isDisputed ? "#a1a1aa"
    : market.status === "AWAITING_CONSENSUS" && isConsensusLowTime ? "#ef4444"
    : isOpenLowTime || market.status === "FROZEN_BETTING" ? "#ef4444"
    : "#facc15";

  return (
    <View className="gap-3">
      {/* Liga row */}
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-[9px] text-yellow-500 font-bold uppercase tracking-wide">
          {market.match_info.tournament}
        </Text>
        <View className="flex-row items-center gap-2">
          {countdownDisplay && (
            <Text style={{ color: countdownColor }} className="font-mono font-bold text-xs">
              {countdownDisplay}
            </Text>
          )}
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
          <Text style={{ color: textColor }} className="text-[10px] font-bold uppercase tracking-wider">
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Match title */}
      <Text className="text-base font-black text-white tracking-tight leading-tight">
        {market.match_info.match}
      </Text>

      {/* Incident Description */}
      <View style={styles.incidentBox} className="rounded-xl p-2.5">
        <Text className="text-[9px] uppercase font-bold text-zinc-500 mb-1">
          Incident Description
        </Text>
        <Text className="text-[11px] text-zinc-300 leading-relaxed font-medium">
          {market.incident_description}
        </Text>
      </View>

      {/* Market ID + divider */}
      <Text className="text-[10px] font-medium text-zinc-600 tracking-wider font-mono mt-1">
        ID: {market.market_id}
      </Text>
      <View style={styles.divider} />

      {/* Odds */}
      <View className="flex-row gap-2">
        <View style={styles.oddsYes} className="flex-1 items-center p-2.5 rounded-xl">
          <View className="flex-row items-center justify-center gap-1 mb-0.5">
            <TrendingUp size={12} color="#facc15" />
            <Text className="text-[9px] text-yellow-500 font-extrabold uppercase tracking-wide">Odds YES</Text>
          </View>
          <Text className="text-lg font-black text-yellow-400 font-mono">{market.qvac_odds.YES.toFixed(2)}x</Text>
        </View>
        <View style={styles.oddsNo} className="flex-1 items-center p-2.5 rounded-xl">
          <View className="flex-row items-center justify-center gap-1 mb-0.5">
            <TrendingUp size={12} color="#71717a" />
            <Text className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide">Odds NO</Text>
          </View>
          <Text className="text-lg font-black text-zinc-300 font-mono">{market.qvac_odds.NO.toFixed(2)}x</Text>
        </View>
      </View>

      {/* Pool Info */}
      <View className="border-t border-zinc-800 pt-2 gap-1.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] text-zinc-500">Total Pool</Text>
          <Text className="text-[11px] text-yellow-400 font-bold font-mono">{market.total_pool} USDT</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] text-zinc-500">Bandar Stake</Text>
          <Text className="text-[11px] text-zinc-300 font-bold font-mono">{market.bandar_stake} USDT</Text>
        </View>
      </View>

      {/* ENTER MARKET button */}
      <Pressable
        id={`btn-masuk-pasar-${market.market_id}`}
        onPress={() => onEnter(market.market_id)}
        style={styles.btnEnter}
        className="w-full flex-row items-center justify-center gap-2 py-3 px-4 rounded-xl"
      >
        <DoorOpen size={14} color="#a1a1aa" />
        <Text className="text-white font-bold text-xs">ENTER MARKET</Text>
      </Pressable>
    </View>
  );
}

// ─── Main Dashboard Page ───────────────────────────────────────────────────
export default function BandarDashboardPage() {
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);
  const { markets, cumulativePnl, addMarket } = useMarketStore();

  const handleEnterMarket = useCallback(
    (id: string) => router.push(`/bandar/console?id=${id}`),
    [router]
  );

  const handleOpenNewMarket = useCallback(() => {
    const newId = `MKT_${Date.now().toString().slice(-6)}`;
    router.push(`/bandar/console?id=${newId}`);
  }, [router]);

  const openMarkets = markets.filter((m) =>
    ["OPEN", "FROZEN_BETTING", "AWAITING_CONSENSUS"].includes(m.status)
  );
  const disputedMarkets = markets.filter((m) =>
    ["DISPUTED_FROZEN", "DISPUTED"].includes(m.status)
  );
  const closedCount = markets.filter((m) => m.status === "CLOSED").length;
  const estimatedBalance = 100 + cumulativePnl;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View className="max-w-md w-full self-center px-5 pb-16">

          {/* ─── Header ─── */}
          <View className="py-3 flex-row items-center gap-3 mb-5">
            <Link href="/" asChild>
              <Pressable style={styles.backBtn} className="items-center justify-center p-2.5 rounded-full">
                <ArrowLeft size={16} color="#d4d4d8" />
              </Pressable>
            </Link>
            <View>
              <Text className="text-sm font-black tracking-tight text-yellow-400 uppercase">
                Bandar Console
              </Text>
              <Pressable
                onPress={async () => {
                  await Clipboard.setStringAsync("0xWDK_Host_99A");
                  showToast("Address copied.", "success");
                }}
                className="flex-row items-center gap-1.5 mt-0.5"
              >
                <Text className="text-[10px] font-mono text-zinc-500">0xWD...99A</Text>
                <Copy size={14} color="#71717a" />
              </Pressable>
            </View>
          </View>

          {/* ─── BUKA PASAR Button ─── */}
          <Pressable
            id="btn-buka-pasar-dashboard"
            onPress={handleOpenNewMarket}
            style={styles.btnYellow}
            className="w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 mb-6"
          >
            <Crown size={16} color="#000000" />
            <Text style={styles.btnYellowText} className="text-sm font-black uppercase tracking-wider">
              OPEN MARKET
            </Text>
          </Pressable>

          <View className="gap-5">
            {/* ─── SECTION: PASAR TERBUKA ─── */}
            <View style={styles.section} className="rounded-2xl p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <Activity size={16} color="#34d399" />
                <Text className="text-xs font-bold text-white uppercase tracking-wider">OPEN MARKETS</Text>
                <View style={styles.countBadge} className="ml-auto rounded-full px-2 py-0.5">
                  <Text className="text-[9px] font-mono text-zinc-600">{openMarkets.length} Active</Text>
                </View>
              </View>

              {openMarkets.length === 0 ? (
                <View style={styles.emptyBox} className="py-8 items-center rounded-xl">
                  <Activity size={24} color="#3f3f46" />
                  <Text className="text-[11px] text-zinc-600 mt-2">No open markets.</Text>
                  <Text className="text-[10px] text-zinc-700 mt-0.5">
                    Click "OPEN MARKET" to start.
                  </Text>
                </View>
              ) : (
                openMarkets.slice().reverse().map((m, idx) => (
                  <React.Fragment key={m.market_id}>
                    {idx > 0 && <View style={styles.divider} className="my-4" />}
                    <MarketItem market={m} isDisputed={false} onEnter={handleEnterMarket} />
                  </React.Fragment>
                ))
              )}
            </View>

            {/* ─── SECTION: PASAR SENGKETA ─── */}
            <View style={styles.section} className="rounded-2xl p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <AlertTriangle size={16} color="#facc15" />
                <Text className="text-xs font-bold text-white uppercase tracking-wider">DISPUTED MARKETS</Text>
                <View style={styles.countBadge} className="ml-auto rounded-full px-2 py-0.5">
                  <Text className="text-[9px] font-mono text-zinc-600">{disputedMarkets.length} Disputed</Text>
                </View>
              </View>

              {disputedMarkets.length === 0 ? (
                <View style={styles.emptyBox} className="py-8 items-center rounded-xl">
                  <AlertTriangle size={24} color="#3f3f46" />
                  <Text className="text-[11px] text-zinc-600 mt-2">No disputed markets.</Text>
                </View>
              ) : (
                disputedMarkets.slice().reverse().map((m, idx) => (
                  <React.Fragment key={m.market_id}>
                    {idx > 0 && <View style={styles.divider} className="my-4" />}
                    <MarketItem market={m} isDisputed={true} onEnter={handleEnterMarket} />
                  </React.Fragment>
                ))
              )}
            </View>

            {/* ─── SECTION: PNL ALL-TIME ─── */}
            <GlobalPnlCard
              title="BOOKMAKER ALL-TIME P&L"
              pnlAmount={cumulativePnl}
              statusText={cumulativePnl >= 0 ? "PROFIT (FEE)" : "LOSS"}
              estimatedBalance={estimatedBalance}
              totalMarketsPlayed={closedCount}
              descriptionText="Estimated based on 10% Spread Fee from resolved pools."
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
    backgroundColor: "#27272a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  btnYellow: {
    backgroundColor: "#eab308",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.4)",
    shadowColor: "rgba(234,179,8,0.25)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  btnYellowText: { color: "#000000" },
  section: {
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
  },
  divider: {
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  incidentBox: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(39,39,42,0.6)",
  },
  oddsYes: {
    backgroundColor: "rgba(234,179,8,0.05)",
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.15)",
  },
  oddsNo: {
    backgroundColor: "rgba(39,39,42,0.5)",
    borderWidth: 1,
    borderColor: "rgba(63,63,70,0.5)",
  },
  btnEnter: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#3f3f46",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 0,
    elevation: 4,
  },
});
