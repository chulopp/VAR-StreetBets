import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMarketStore } from "@/store/marketStore";
import { useToastStore } from "@/store/useToastStore";
import {
  ArrowLeft,
  Flame,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Users,
  DollarSign,
  Cpu,
  Wallet,
  Globe,
  ChevronDown,
  Copy,
  TrendingUp,
  Gavel,
} from "lucide-react-native";
import MarketStatusCard from "@/components/MarketStatusCard";
import BetDistributionCard from "@/components/BetDistributionCard";
import MarketResultCard from "@/components/MarketResultCard";
import LockedMarketCard from "@/components/LockedMarketCard";
import { MotiView } from "moti";
import * as Clipboard from "expo-clipboard";
import { generateOracleOdds } from "@/lib/oracleService";

// ─── Data ──────────────────────────────────────────────────────────────────
const TOURNAMENT_DATA: Record<string, string[]> = {
  "🌍 World Cup 2026": [
    "Argentina","France","Brazil","England","Germany","Japan",
    "Morocco","Portugal","Spain","Netherlands","Mexico","USA",
  ],
  "🦁 Premier League 2025/26": [
    "Arsenal","Manchester City","Liverpool","Manchester United",
    "Chelsea","Tottenham","Newcastle","Aston Villa",
  ],
};

const INCIDENT_PILLS = [
  { label: "VAR Incident", text: "The referee is consulting the Video Assistant Referee (VAR) to check for a potential penalty or a cancelled goal.", incidentType: "VAR_INCIDENT" },
  { label: "Penalty",      text: "A direct free kick offense is committed by a player in their team's penalty area, resulting in a penalty kick.", incidentType: "PENALTY" },
  { label: "Card",         text: "A player commits a cautionable or sending-off offense, such as serious foul play or violent conduct.", incidentType: "CARD" },
  { label: "Surprise Incident", text: "An unexpected critical match event, such as an own goal, has occurred.", incidentType: "SURPRISE" },
];

// ─── Inner component ───────────────────────────────────────────────────────
export default function BandarConsolePage() {
  const { id: marketId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    markets,
    bets: allBets,
    addMarket,
    freezeMarketById,
    disputeMarketById,
    closeMarketById,
    resolveMarketById,
    addBetToMarket,
  } = useMarketStore();

  const showToast = useToastStore((s) => s.showToast);

  const market = markets.find((m) => m.market_id === marketId) ?? null;
  const bets = allBets.filter((b) => b.market_id === marketId);

  // ── Form state ──
  const [tournament, setTournament] = useState("");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [probYes, setProbYes] = useState(60);
  const [bandarStake, setBandarStake] = useState<string>("50");
  const [hostAddress] = useState("0xWDK_Host_99A");
  const [incidentLabel, setIncidentLabel] = useState<string>("VAR_INCIDENT");
  const [fixtureId, setFixtureId] = useState("");
  const [matchMinute, setMatchMinute] = useState("");

  const [isTournamentOpen, setIsTournamentOpen] = useState(false);
  const [isTeamAOpen, setIsTeamAOpen] = useState(false);
  const [isTeamBOpen, setIsTeamBOpen] = useState(false);
  const [isGeneratingOdds, setIsGeneratingOdds] = useState(false);

  // RAG Progress Modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("");

  useEffect(() => { setTeamA(""); setTeamB(""); }, [tournament]);

  const probNo = 100 - probYes;
  const qvacOddsYes = Number((1 / (probYes / 100)).toFixed(2));
  const qvacOddsNo = Number((1 / (probNo / 100)).toFixed(2));
  const availableTeams = tournament ? TOURNAMENT_DATA[tournament] || [] : [];

  // ── Timer state ──
  const [timeLeft, setTimeLeft] = useState("01:00");
  const [isLowTime, setIsLowTime] = useState(false);
  const [varResolutionTime, setVarResolutionTime] = useState<number>(0);
  const [consensusTimeLeft, setConsensusTimeLeft] = useState<number>(0);

  const logMsg = (msg: string) =>
    console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

  // Countdown: OPEN → FROZEN auto
  useEffect(() => {
    if (!market || market.status !== "OPEN") return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - market.created_timestamp;
      const remaining = Math.max(0, 60_000 - elapsed);
      const minutes = Math.floor(remaining / 60_000);
      const seconds = Math.floor((remaining % 60_000) / 1_000);
      setTimeLeft(`${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`);
      setIsLowTime(remaining < 15_000);
      if (remaining <= 0) {
        clearInterval(interval);
        handleFreezeMarket(true);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [market?.status, market?.created_timestamp]); // eslint-disable-line

  // Countdown: FROZEN → DISPUTE auto (600s)
  useEffect(() => {
    if (!market || market.status !== "FROZEN_BETTING") {
      setVarResolutionTime(0);
      return;
    }
    if (!market.frozen_at) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((600_000 - (Date.now() - market.frozen_at!)) / 1000));
      setVarResolutionTime(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        disputeMarketById(market.market_id);
        logMsg("[SYSTEM] VAR timer expired → DISPUTE.");
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [market?.status, market?.frozen_at, market?.market_id]); // eslint-disable-line

  // Countdown: AWAITING_CONSENSUS (15s)
  useEffect(() => {
    if (!market || (market.status !== "AWAITING_CONSENSUS" && market.status !== "GRACE_PERIOD")) {
      setConsensusTimeLeft(0);
      return;
    }
    if (!market.resolved_at) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((15_000 - (Date.now() - market.resolved_at!)) / 1_000));
      setConsensusTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        closeMarketById(market.market_id);
        logMsg("[SYSTEM] Consensus timer expired → CLOSED.");
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [market?.status, market?.resolved_at, market?.market_id]); // eslint-disable-line

  // ── STATE TRANSITION MONITOR (TOAST LOGIC) ──
  const prevStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!market) { prevStatusRef.current = null; return; }
    const prev = prevStatusRef.current;
    const curr = market.status;
    if (prev === 'OPEN' && curr === 'FROZEN_BETTING') showToast("Time's up. Market frozen.", "warning");
    if (prev === 'FROZEN_BETTING' && curr === 'AWAITING_CONSENSUS') showToast("Input received. Consensus started.", "info");
    if (prev !== 'DISPUTED' && curr === 'DISPUTED') showToast("Dispute raised! Market frozen.", "warning");
    if (prev !== 'CLOSED' && curr === 'CLOSED') showToast("Market closed.", "success");
    prevStatusRef.current = curr;
  }, [market?.status, showToast]);

  // ── Handlers ──
  const generateOracleOddsHandler = async () => {
    if (!incidentDesc.trim()) {
      showToast("Incident description is required for Oracle calculation.", "warning");
      return;
    }
    setIsGeneratingOdds(true);
    logMsg("[ORACLE] Starting local QVAC inference...");

    // Show progress modal (non-dismissible) for RAG ingest/LLM load
    setShowProgressModal(true);
    setDownloadProgress(0);
    setDownloadStatus("Preparing AI VAR Oracle...");

    const onProgress: (pct: number, status: string) => void = (pct, status) => {
      setDownloadProgress(pct);
      setDownloadStatus(status);
    };

    try {
      const { oddsYes, oddsNo } = await generateOracleOdds(incidentDesc.trim(), { onProgress });
      const calculatedProbYes = Math.round((1 / oddsYes) / ((1 / oddsYes) + (1 / oddsNo)) * 100);
      const clampedProbYes = Math.min(90, Math.max(10, calculatedProbYes));
      setProbYes(clampedProbYes);
      showToast("Oracle odds generated successfully!", "success");
      logMsg(`[ORACLE] Completed. YES: ${oddsYes}x, NO: ${oddsNo}x`);
    } catch (err: any) {
      showToast(err.message || "Failed to calculate odds.", "warning");
    } finally {
      setShowProgressModal(false);
      setIsGeneratingOdds(false);
    }
  };

  const handleOpenMarket = () => {
    if (!marketId || !incidentDesc.trim() || !tournament || !teamA || !teamB || teamA === teamB) return;
    if (!fixtureId.trim() || isNaN(Number(fixtureId))) {
      showToast("Fixture ID must be a valid number.", "warning");
      return;
    }
    if (!matchMinute.trim() || isNaN(Number(matchMinute))) {
      showToast("Match Minute must be a valid number.", "warning");
      return;
    }
    const matchName = `${teamA} vs ${teamB}`;
    const odds = { YES: qvacOddsYes, NO: qvacOddsNo };
    const matchInfo = { tournament, match: matchName };
    addMarket(
      marketId,
      matchInfo,
      incidentLabel,
      incidentDesc.trim(),
      odds,
      Number(bandarStake),
      hostAddress,
      fixtureId.trim(),
      Number(matchMinute),
    );
    showToast("Market created.", "success");
    logMsg(`[WDK] Locked ${bandarStake} USDT as Bandar Guarantee.`);
    logMsg(`[PEARS] Broadcasted Market: ${marketId} - "${matchName}"`);
  };

  const handleFreezeMarket = (isAuto = false) => {
    if (!marketId) return;
    freezeMarketById(marketId);
    if (!isAuto) showToast("Market frozen.", "warning");
    logMsg("[PEARS] Broadcasted STOP TARUHAN.");
  };

  const handleResolveMarket = (outcome: "YES" | "NO") => {
    if (!marketId) return;
    resolveMarketById(marketId, outcome);
    logMsg(`[SYSTEM] Bandar input: "${outcome}". Awaiting punter consensus (15s)...`);
  };

  const simulatePunterBet = () => {
    if (!market || market.status !== "OPEN" || !marketId) return;
    const n = Math.floor(Math.random() * 100) + 10;
    const addr = `0xWDK_Punter_${n}`;
    const ch = Math.random() > 0.4 ? "YES" : "NO";
    const amt = Math.floor(Math.random() * 15) + 5;
    addBetToMarket(marketId, ch as "YES" | "NO", amt, addr);
    logMsg(`[PEARS] Received Bet: ${addr} → ${amt} USDT on ${ch}`);
  };

  const simulateConsensus = () => {
    if (!market || market.status !== "AWAITING_CONSENSUS" || !marketId) return;
    closeMarketById(marketId);
    logMsg("[PEARS] Consensus reached. Escrow released.");
  };

  const simulateDispute = () => {
    if (!market || market.status !== "AWAITING_CONSENSUS" || !marketId) return;
    disputeMarketById(marketId);
    logMsg("[PEARS] CRITICAL: 3+ Punters submitted DISPUTE!");
  };

  const simulateOracle = (truth: "YES" | "NO") => {
    if (!market || market.status !== "DISPUTED_FROZEN" || !marketId) return;
    logMsg("[ORACLE] Fetching sports API...");
    setTimeout(() => {
      const lied = market.resolution_outcome !== truth;
      logMsg(`[ORACLE] Official: "${truth}". Bandar said: "${market.resolution_outcome}".`);
      logMsg(lied ? `[SLASHING] Bandar lied! ${market.bandar_stake} USDT confiscated.` : "[SLASHING] Bandar honest. Punters penalized 10%.");
      closeMarketById(marketId);
      logMsg("[SYSTEM] Market CLOSED.");
    }, 1_500);
  };

  // ── Pool calculations ──
  const yesBetsSum = bets.filter((b) => b.choice === "YES").reduce((a, b) => a + b.amount_usdt, 0);
  const noBetsSum = bets.filter((b) => b.choice === "NO").reduce((a, b) => a + b.amount_usdt, 0);
  const totalPunterBets = yesBetsSum + noBetsSum;
  const yesPercent = totalPunterBets > 0 ? (yesBetsSum / totalPunterBets) * 100 : 50;
  const noPercent = totalPunterBets > 0 ? (noBetsSum / totalPunterBets) * 100 : 50;

  if (!marketId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-zinc-400 text-sm">No market ID in URL.</Text>
          <Link href="/bandar" asChild>
            <Pressable style={styles.btnYellow} className="px-6 py-3 rounded-xl">
              <Text style={styles.btnYellowText} className="text-sm font-black uppercase">Back to Dashboard</Text>
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

            {/* Header */}
            <View className="py-3.5 flex-row justify-between items-center z-10 mb-6 w-full">
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => router.push("/bandar")}
                  style={styles.backBtn}
                  className="items-center justify-center p-2.5 rounded-full"
                >
                  <ArrowLeft size={16} color="#d4d4d8" />
                </Pressable>
                <View>
                  <Text className="text-sm font-black tracking-tight text-yellow-400 uppercase">
                    Bandar Console
                  </Text>
                  <Pressable
                    onPress={async () => {
                      await Clipboard.setStringAsync(hostAddress);
                      showToast("Address copied.", "success");
                    }}
                    className="flex-row items-center gap-1.5 mt-0.5"
                  >
                    <Text className="text-[10px] font-mono text-zinc-500">
                      {hostAddress.slice(0, 4)}...{hostAddress.slice(-4)}
                    </Text>
                    <Copy size={14} color="#71717a" />
                  </Pressable>
                </View>
              </View>
              {marketId && (
                <View style={styles.marketIdBadge} className="rounded-md px-2 py-1">
                  <Text className="text-[9px] font-mono text-zinc-600">{marketId}</Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View className="gap-5 pb-8">
              {market ? (
                /* ═══ ACTIVE MARKET VIEW ═══ */
                <View className="gap-4">
                  {/* Resolution Panel */}
                  {market.status === "FROZEN_BETTING" && (
                    <View style={styles.resolutionPanel} className="rounded-3xl p-4 gap-3.5">
                      <View className="flex-row items-center gap-2">
                        <Gavel size={16} color="#eab308" />
                        <Text className="text-xs font-bold text-white uppercase tracking-wider">Official Result Input</Text>
                      </View>
                      <Text className="text-xs text-zinc-400 tracking-normal leading-relaxed mt-1">
                        Enter the official referee decision after VAR analysis.
                      </Text>
                      <View className="flex-row gap-3 pt-1">
                        <Pressable
                          onPress={() => handleResolveMarket("YES")}
                          style={styles.btnYellow}
                          className="flex-1 py-3 rounded-xl items-center"
                        >
                          <Text style={styles.btnYellowText} className="text-xs font-bold uppercase tracking-wider">Set Result: YES</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleResolveMarket("NO")}
                          style={styles.btnDark}
                          className="flex-1 py-3 rounded-xl items-center"
                        >
                          <Text className="text-xs font-bold uppercase tracking-wider text-zinc-300">Set Result: NO</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* Consensus Indicator */}
                  {market.status === "AWAITING_CONSENSUS" && (
                    <View style={styles.consensusPanel} className="rounded-3xl p-4 items-center gap-2">
                      <Users size={24} color="#facc15" />
                      <Text className="text-xs font-bold text-white uppercase tracking-wider">
                        Awaiting Punter Consensus
                      </Text>
                      <Text className="text-[10px] text-zinc-400">
                        Bookmaker submitted result{" "}
                        <Text className="text-yellow-400 font-bold">{market.resolution_outcome}</Text>
                        {". Punters have "}{consensusTimeLeft}{" seconds."}
                      </Text>
                    </View>
                  )}

                  {/* Disputed State */}
                  {market.status === "DISPUTED_FROZEN" && (
                    <LockedMarketCard
                      status={market.status}
                      resolutionOutcome={market.resolution_outcome ?? undefined}
                    />
                  )}

                  {/* Closed State & Profit Card */}
                  {market.status === "CLOSED" && (() => {
                    const parts = market.match_info.match.split(" vs ");
                    const tA = parts[0] || "";
                    const tB = parts[1] || "";
                    const profit = totalPunterBets * 0.1;
                    return (
                      <View className="gap-3">
                        <MarketResultCard
                          tournament={market.match_info.tournament}
                          teamA={tA}
                          teamB={tB}
                          incident={market.incident_description}
                          finalResult={market.resolution_outcome as "YES" | "NO"}
                          pnlAmount={profit}
                          statusText="PROFIT (FEE)"
                          estimatedBalance={Number(bandarStake) + profit}
                          descriptionText="Estimated based on 10% Spread Fee collected."
                          showPnL={true}
                        />
                      </View>
                    );
                  })()}

                  {/* Status Card */}
                  <MarketStatusCard
                    title="Market Status"
                    tournament={market.match_info.tournament}
                    match={market.match_info.match}
                    incidentDescription={market.incident_description}
                    marketId={market.market_id}
                    oddsYes={market.qvac_odds.YES}
                    oddsNo={market.qvac_odds.NO}
                    totalPool={market.total_pool}
                    bandarStake={market.bandar_stake}
                    timeLeftSeconds={
                      market.status === "OPEN"
                        ? Math.ceil(Math.max(0, 60_000 - (Date.now() - market.created_timestamp)) / 1_000)
                        : market.status === "AWAITING_CONSENSUS" && market.resolved_at
                        ? consensusTimeLeft
                        : market.status === "FROZEN_BETTING"
                        ? varResolutionTime
                        : null
                    }
                    status={market.status as any}
                    statusText={market.status === "DISPUTED_FROZEN" ? "DISPUTED" : undefined}
                    statusColor={market.status === "DISPUTED_FROZEN" ? "#eab308" : undefined}
                  />

                  {/* STOP & FREEZE MARKET */}
                  {market.status === "OPEN" && (
                    <Pressable
                      onPress={() => handleFreezeMarket(false)}
                      style={styles.btnFreeze}
                      className="w-full rounded-xl py-3 flex-row items-center justify-center gap-2 mb-4"
                    >
                      <Flame size={16} color="#ffffff" />
                      <Text className="text-white font-bold uppercase tracking-wider text-xs">
                        STOP & FREEZE MARKET (VAR ISSUED)
                      </Text>
                    </Pressable>
                  )}

                  {/* Pool Visualizer */}
                  <BetDistributionCard
                    totalPunters={bets.length}
                    totalPool={market.total_pool}
                    yesPercentage={yesPercent}
                    noPercentage={noPercent}
                    yesPool={yesBetsSum}
                    noPool={noBetsSum}
                  />

                  {/* Bet Transactions */}
                  <View style={styles.betListCard} className="rounded-2xl p-5 gap-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Bet List</Text>
                      <Text className="text-[10px] font-mono text-zinc-600">{bets.length} Bets</Text>
                    </View>
                    {bets.length === 0 ? (
                      <View style={styles.emptyBetBox} className="py-6 items-center rounded-2xl">
                        <Text className="text-zinc-600 text-[11px]">No bets placed yet.</Text>
                      </View>
                    ) : (
                      <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={false}>
                        {bets.slice().reverse().map((bet) => (
                          <View
                            key={bet.bet_id}
                            style={styles.betRow}
                            className="flex-row items-center justify-between p-2.5 rounded-2xl border border-zinc-800 mb-2"
                          >
                            <View className="flex-row items-center gap-2.5">
                              <View style={bet.choice === "YES" ? styles.badgeYes : styles.badgeNo} className="rounded-md px-2 py-0.5">
                                <Text style={bet.choice === "YES" ? styles.badgeYesText : styles.badgeNoText}
                                  className="text-[10px] uppercase tracking-wider font-bold">
                                  {bet.choice}
                                </Text>
                              </View>
                              <View>
                                <Text className="text-[10px] font-bold text-zinc-300 font-mono" numberOfLines={1}>
                                  {bet.punter_pubkey}
                                </Text>
                                <Text className="text-[10px] text-zinc-500">
                                  {new Date(bet.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                </Text>
                              </View>
                            </View>
                            <Text className="text-xs font-bold text-white font-mono">{bet.amount_usdt} USDT</Text>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </View>
              ) : (
                /* ═══ CREATION FORM ═══ */
                <View className="gap-5">
                  <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    Create New Betting Market
                  </Text>

                  {/* Market ID preview */}
                  <View style={styles.idPreview} className="rounded-xl px-4 py-2">
                    <Text className="text-[10px] text-zinc-600 font-mono">ID: {marketId}</Text>
                  </View>

                  {/* Tournament Select */}
                  <View className="gap-2">
                    <Text className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Select Tournament</Text>
                    <Pressable
                      onPress={() => { setIsTournamentOpen(!isTournamentOpen); setIsTeamAOpen(false); setIsTeamBOpen(false); }}
                      style={styles.dropdown}
                      className="w-full px-4 py-3 rounded-xl flex-row items-center justify-between"
                    >
                      <Text className="text-sm text-white font-semibold">{tournament || "Select tournament..."}</Text>
                      <ChevronDown size={16} color="#71717a" style={{ transform: [{ rotate: isTournamentOpen ? "180deg" : "0deg" }] }} />
                    </Pressable>
                    {isTournamentOpen && (
                      <View style={styles.dropdownMenu} className="rounded-xl overflow-hidden">
                        {Object.keys(TOURNAMENT_DATA).map((t) => (
                          <Pressable key={t} onPress={() => { setTournament(t); setIsTournamentOpen(false); }}
                            style={styles.dropdownItem} className="px-4 py-3">
                            <Text className="text-sm text-white">{t}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Team A */}
                  <View className="gap-2">
                    <Text className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Select Team A</Text>
                    <Pressable
                      onPress={() => { if (tournament) { setIsTeamAOpen(!isTeamAOpen); setIsTournamentOpen(false); setIsTeamBOpen(false); } }}
                      style={[styles.dropdown, !tournament && styles.disabled]}
                      className="w-full px-4 py-3 rounded-xl flex-row items-center justify-between"
                    >
                      <Text className="text-sm text-white font-semibold">
                        {teamA || (tournament ? "Select Team A..." : "Select tournament first...")}
                      </Text>
                      <ChevronDown size={16} color="#71717a" style={{ transform: [{ rotate: isTeamAOpen ? "180deg" : "0deg" }] }} />
                    </Pressable>
                    {isTeamAOpen && tournament && (
                      <View style={styles.dropdownMenu} className="rounded-xl overflow-hidden">
                        {availableTeams.map((team) => (
                          <Pressable key={team} onPress={() => { setTeamA(team); setIsTeamAOpen(false); }}
                            style={styles.dropdownItem} className="px-4 py-3">
                            <Text className="text-sm text-white">{team}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Team B */}
                  <View className="gap-2">
                    <Text className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Select Team B</Text>
                    <Pressable
                      onPress={() => { if (tournament && teamA) { setIsTeamBOpen(!isTeamBOpen); setIsTournamentOpen(false); setIsTeamAOpen(false); } }}
                      style={[styles.dropdown, (!tournament || !teamA) && styles.disabled]}
                      className="w-full px-4 py-3 rounded-xl flex-row items-center justify-between"
                    >
                      <Text className="text-sm text-white font-semibold">
                        {teamB || (!tournament ? "Select tournament first..." : !teamA ? "Select Team A first..." : "Select Team B...")}
                      </Text>
                      <ChevronDown size={16} color="#71717a" style={{ transform: [{ rotate: isTeamBOpen ? "180deg" : "0deg" }] }} />
                    </Pressable>
                    {isTeamBOpen && tournament && teamA && (
                      <View style={styles.dropdownMenu} className="rounded-xl overflow-hidden">
                        {availableTeams.filter((t) => t !== teamA).map((team) => (
                          <Pressable key={team} onPress={() => { setTeamB(team); setIsTeamBOpen(false); }}
                            style={styles.dropdownItem} className="px-4 py-3">
                            <Text className="text-sm text-white">{team}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>

                   {/* Incident Template Pills */}
                   <View className="gap-2">
                     <Text className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Quick Incident Templates</Text>
                     <View className="flex-row flex-wrap gap-1.5 mt-4">
                       {INCIDENT_PILLS.map(({ label, text, incidentType }) => (
                         <Pressable
                           key={label}
                           onPress={() => { setIncidentDesc(text); setIncidentLabel(incidentType); }}
                           style={styles.tagChip}
                           className="rounded-lg px-3 py-2"
                         >
                           <Text style={styles.tagChipText} className="text-[11px]">{label}</Text>
                         </Pressable>
                       ))}
                     </View>
                   </View>

                   {/* Fixture ID & Match Minute (Hakim API) */}
                   <View className="flex-row gap-3">
                     <View className="flex-1 gap-1.5">
                       <Text className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Fixture ID</Text>
                       <TextInput
                         keyboardType="numeric"
                         value={fixtureId}
                         onChangeText={setFixtureId}
                         placeholder="e.g. 710892"
                         placeholderTextColor="#52525b"
                         style={styles.input}
                         className="w-full px-4 py-3 rounded-xl text-xs text-white font-bold font-mono"
                       />
                     </View>
                     <View className="flex-1 gap-1.5">
                       <Text className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Match Minute</Text>
                       <TextInput
                         keyboardType="numeric"
                         value={matchMinute}
                         onChangeText={setMatchMinute}
                         placeholder="e.g. 75"
                         placeholderTextColor="#52525b"
                         style={styles.input}
                         className="w-full px-4 py-3 rounded-xl text-xs text-white font-bold font-mono"
                       />
                     </View>
                   </View>

                  {/* Incident Textarea */}
                  <View className="gap-2">
                    <Text className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Incident Detail Description</Text>
                    <TextInput
                      multiline
                      numberOfLines={4}
                      value={incidentDesc}
                      onChangeText={setIncidentDesc}
                      placeholder="Describe clearly for accurate AI resolution..."
                      placeholderTextColor="#52525b"
                      style={styles.textarea}
                      className="w-full px-4 py-3 rounded-xl text-xs text-white"
                      textAlignVertical="top"
                    />
                  </View>

                  {/* QVAC Odds Calculator */}
                  <View style={styles.oddsCard} className="rounded-2xl p-5 gap-3">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-1.5">
                        <Cpu size={14} color="#facc15" />
                        <Text className="text-xs font-bold text-white uppercase tracking-wider">VAR AI ANALYTICS</Text>
                      </View>
                      <Pressable
                        onPress={generateOracleOddsHandler}
                        disabled={isGeneratingOdds}
                        style={[styles.inferBtn, isGeneratingOdds && styles.inferBtnDisabled]}
                        className="px-3 py-1.5 rounded-lg flex-row items-center gap-1.5"
                      >
                        {isGeneratingOdds
                          ? <><Activity size={12} color="#000" /><Text style={styles.inferBtnText} className="text-[10px] font-black">Analyzing...</Text></>
                          : <Text style={styles.inferBtnText} className="text-[10px] font-black">Inference Rules</Text>
                        }
                      </Pressable>
                    </View>

                    <View className="gap-2">
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-zinc-500 font-semibold">YES Probability:</Text>
                        <Text className="text-xs text-yellow-400 font-bold">{probYes}%</Text>
                      </View>
                      {/* Probability bar (read-only) */}
                      <View style={styles.probTrack} className="rounded-lg overflow-hidden">
                        <View style={[styles.probFill, { width: `${probYes}%` as any }]} />
                      </View>

                      <View className="flex-row gap-2 pt-2 border-t border-zinc-800">
                        <View style={styles.oddsYes} className="flex-1 items-center p-3 rounded-2xl">
                          <View className="flex-row items-center justify-center gap-1 mb-1">
                            <TrendingUp size={12} color="#facc15" />
                            <Text className="text-[9px] text-yellow-500 font-extrabold uppercase tracking-wide">Odds YES</Text>
                          </View>
                          <Text className="text-xl font-black text-yellow-400 font-mono">{qvacOddsYes.toFixed(2)}x</Text>
                        </View>
                        <View style={styles.oddsNo} className="flex-1 items-center p-3 rounded-2xl">
                          <View className="flex-row items-center justify-center gap-1 mb-1">
                            <TrendingUp size={12} color="#71717a" />
                            <Text className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide">Odds NO</Text>
                          </View>
                          <Text className="text-xl font-black text-zinc-300 font-mono">{qvacOddsNo.toFixed(2)}x</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Stake & Wallet */}
                  <View className="flex-row gap-3">
                    <View className="flex-1 gap-1.5">
                      <Text className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Bookmaker Stake</Text>
                      <View className="relative">
                        <TextInput
                          keyboardType="numeric"
                          value={bandarStake}
                          onChangeText={setBandarStake}
                          onBlur={() => { if (Number(bandarStake) < 50 || bandarStake === "") setBandarStake("50"); }}
                          style={styles.input}
                          className="w-full px-4 py-3 rounded-xl text-xs text-white font-bold font-mono"
                        />
                        <Text className="text-[9px] font-bold text-zinc-500 absolute right-3.5 top-3.5">USDT</Text>
                      </View>
                    </View>
                    <View className="flex-1 gap-1.5">
                      <Text className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Bookmaker Wallet</Text>
                      <View style={styles.walletBox} className="relative w-full px-4 py-3 rounded-xl flex-row items-center">
                        <Text className="text-[10px] text-zinc-400 font-mono flex-1" numberOfLines={1}>{hostAddress}</Text>
                        <Wallet size={14} color="#52525b" />
                      </View>
                    </View>
                  </View>

                  {/* Submit */}
                   <Pressable
                     onPress={handleOpenMarket}
                     disabled={!tournament || !teamA || !teamB || teamA === teamB || !incidentDesc.trim() || Number(bandarStake) < 50 || bandarStake === "" || !fixtureId.trim() || isNaN(Number(fixtureId)) || !matchMinute.trim() || isNaN(Number(matchMinute))}
                    style={({ pressed }) => [
                      styles.btnYellow,
                      styles.submitBtn,
                      (!tournament || !teamA || !teamB || teamA === teamB || !incidentDesc.trim()) && styles.btnDisabled,
                    ]}
                    className="w-full py-4 rounded-2xl items-center mt-2"
                  >
                    <Text style={styles.btnYellowText} className="text-sm font-black uppercase tracking-wider">
                      STAKE & BROADCAST MARKET
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* ═══ SIMULATION PANEL ═══ */}
            <View style={styles.simPanel} className="rounded-2xl px-4 py-3 mt-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1">
                  <Users size={14} color="#facc15" />
                  <Text className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest ml-1">Simulation Console</Text>
                </View>
                <Text className="text-[8px] text-zinc-500 font-mono">P2P Network Mock</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                <Pressable onPress={simulatePunterBet}
                  disabled={!market || market.status !== "OPEN"}
                  style={[styles.simBtn, (!market || market.status !== "OPEN") && styles.simBtnDisabled]}
                  className="flex-1 py-1.5 px-2 rounded-xl flex-row items-center justify-center gap-1.5">
                  <DollarSign size={12} color="#facc15" />
                  <Text className="text-white font-semibold text-[10px]">Punter Bet</Text>
                </Pressable>
                <Pressable onPress={simulateDispute}
                  disabled={!market || market.status !== "AWAITING_CONSENSUS"}
                  style={[styles.simBtn, (!market || market.status !== "AWAITING_CONSENSUS") && styles.simBtnDisabled]}
                  className="flex-1 py-1.5 px-2 rounded-xl flex-row items-center justify-center gap-1.5">
                  <AlertTriangle size={12} color="#ef4444" />
                  <Text className="text-white font-semibold text-[10px]">Dispute</Text>
                </Pressable>
                <Pressable onPress={simulateConsensus}
                  disabled={!market || market.status !== "AWAITING_CONSENSUS"}
                  style={[styles.simBtn, (!market || market.status !== "AWAITING_CONSENSUS") && styles.simBtnDisabled]}
                  className="flex-1 py-1.5 px-2 rounded-xl flex-row items-center justify-center gap-1.5">
                  <CheckCircle2 size={12} color="#34d399" />
                  <Text className="text-white font-semibold text-[10px]">Consensus OK</Text>
                </Pressable>

                {market?.status === "DISPUTED_FROZEN" ? (
                  <View className="w-full flex-row gap-2 pt-1 border-t border-zinc-800 mt-1">
                    <Pressable onPress={() => simulateOracle("YES")}
                      style={styles.oracleBtn} className="flex-1 py-1.5 px-2 rounded-xl flex-row items-center justify-center gap-1">
                      <Globe size={12} color="#facc15" />
                      <Text className="text-yellow-400 font-bold text-[10px]">Oracle: YES</Text>
                    </Pressable>
                    <Pressable onPress={() => simulateOracle("NO")}
                      style={styles.oracleBtn} className="flex-1 py-1.5 px-2 rounded-xl flex-row items-center justify-center gap-1">
                      <Globe size={12} color="#facc15" />
                      <Text className="text-yellow-400 font-bold text-[10px]">Oracle: NO</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.simBtnDisabled} className="flex-1 py-1.5 px-2 rounded-xl flex-row items-center justify-center gap-1.5">
                    <Globe size={12} color="#3f3f46" />
                    <Text className="text-zinc-700 font-semibold text-[10px]">Oracle Inactive</Text>
                  </View>
                )}

                <Pressable
                  onPress={() => { if (market?.status === "FROZEN_BETTING" && marketId) { disputeMarketById(marketId); logMsg("[DEV] Force Timeout → DISPUTE."); } }}
                  disabled={!market || market.status !== "FROZEN_BETTING"}
                  style={[styles.oracleBtn, (!market || market.status !== "FROZEN_BETTING") && styles.simBtnDisabled, { width: "100%" }]}
                  className="py-1.5 px-2 rounded-xl flex-row items-center justify-center gap-1.5">
                  <AlertTriangle size={12} color={market?.status === "FROZEN_BETTING" ? "#facc15" : "#3f3f46"} />
                  <Text style={{ color: market?.status === "FROZEN_BETTING" ? "#facc15" : "#3f3f46" }} className="font-bold text-[10px]">
                    Dev: Force 10m Timeout (DISPUTE)
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ───── RAG Download Progress Overlay (Non-Dismissible) ───── */}
      <Modal
        visible={showProgressModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {}}>
        <View style={styles.progressOverlay}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 300 }}
            style={styles.progressCard}>
            <ActivityIndicator size="large" color="#eab308" />
            <Text style={styles.progressTitle}>VAR AI Oracle</Text>
            <Text style={styles.progressStatus}>{downloadStatus}</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(downloadProgress, 2)}%` as any }]} />
            </View>
            <Text style={styles.progressPct}>{downloadProgress}%</Text>

            <Text style={styles.progressHint}>
              Download model AI hanya dilakukan SATU KALI.{"\n"}
              Inference selanjutnya akan instan.
            </Text>
          </MotiView>
        </View>
      </Modal>
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
  marketIdBadge: {
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#27272a",
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
  btnDark: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  btnDisabled: { opacity: 0.5 },
  submitBtn: {},
  resolutionPanel: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "rgba(127,29,29,0.3)",
  },
  consensusPanel: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "rgba(120,53,15,0.3)",
  },
  btnFreeze: {
    backgroundColor: "#b91c1c",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  betListCard: {
    backgroundColor: "rgba(24,24,27,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 6,
  },
  emptyBetBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#27272a",
  },
  betRow: { backgroundColor: "rgba(0,0,0,0.5)" },
  badgeYes: { backgroundColor: "#eab308" },
  badgeYesText: { color: "#09090b" },
  badgeNo: { backgroundColor: "#3f3f46" },
  badgeNoText: { color: "#d4d4d8" },
  idPreview: {
    backgroundColor: "rgba(24,24,27,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  dropdown: {
    backgroundColor: "rgba(24,24,27,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  disabled: { opacity: 0.4 },
  dropdownMenu: {
    backgroundColor: "#27272a",
    borderWidth: 1,
    borderColor: "#3f3f46",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 50,
  },
  dropdownItem: { borderBottomWidth: 1, borderColor: "#3f3f46" },
  tagChip: {
    backgroundColor: "#eab308",
    borderBottomWidth: 4,
    borderColor: "#a16207",
  },
  tagChipText: { color: "#09090b", fontWeight: "700" },
  textarea: {
    backgroundColor: "rgba(24,24,27,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    minHeight: 100,
  },
  oddsCard: {
    backgroundColor: "rgba(24,24,27,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 6,
  },
  inferBtn: {
    backgroundColor: "#facc15",
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  inferBtnDisabled: { opacity: 0.3 },
  inferBtnText: { color: "#000000" },
  probTrack: {
    height: 6,
    backgroundColor: "#27272a",
  },
  probFill: {
    height: "100%",
    backgroundColor: "#eab308",
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
  input: {
    backgroundColor: "rgba(24,24,27,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  walletBox: {
    backgroundColor: "rgba(24,24,27,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  simPanel: {
    backgroundColor: "rgba(9,9,11,0.95)",
    borderTopWidth: 1,
    borderColor: "rgba(39,39,42,0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 10,
  },
  simBtn: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  simBtnDisabled: {
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "rgba(39,39,42,0.4)",
    opacity: 0.3,
  },
  oracleBtn: {
    backgroundColor: "rgba(234,179,8,0.1)",
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.3)",
  },
  // ───── Progress Modal ─────
  progressOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  progressCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#18181b",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.2)",
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 14,
    shadowColor: "rgba(234,179,8,0.15)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 15,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#facc15",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 4,
  },
  progressStatus: {
    fontSize: 12,
    color: "#a1a1aa",
    textAlign: "center",
    fontWeight: "500",
  },
  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#27272a",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#eab308",
    borderRadius: 4,
  },
  progressPct: {
    fontSize: 24,
    fontWeight: "900",
    color: "#facc15",
    fontFamily: "monospace",
  },
  progressHint: {
    fontSize: 10,
    color: "#52525b",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
  },
});
