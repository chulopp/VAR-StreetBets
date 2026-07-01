"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";
import MarketStatusCard from "@/components/MarketStatusCard";
import BetDistributionCard from "@/components/BetDistributionCard";
import MarketResultCard from "@/components/MarketResultCard";
import LockedMarketCard from "@/components/LockedMarketCard";
import { motion } from "framer-motion";

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

const INCIDENT_TEMPLATES = [
  { tag: "# LastMan",    text: "Pemain terakhir melakukan pelanggaran keras (tackle dari belakang) pada striker." },
  { tag: "# Handball",  text: "Pemain bertahan melakukan handball di dalam kotak penalti saat memblok tendangan." },
  { tag: "# ShirtPull", text: "Pemain bertahan menarik baju striker di dalam kotak penalti saat posisi 1v1 dengan kiper." },
  { tag: "# Offside",   text: "Gol dianulir karena dugaan posisi offside sangat tipis dari pemain sayap." },
  { tag: "# DivePenalty",text: "Striker melakukan diving di dalam kotak penalti untuk memicu penalti." },
  { tag: "# Elbow",     text: "Pemain melakukan sikutan sengaja ke arah wajah lawan saat perebutan bola." },
];

// ─── Inner component (needs searchParams) ─────────────────────────────────
function BandarConsoleInner() {
  const searchParams = useSearchParams();
  const marketId = searchParams.get("id");

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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

  // Active market by URL id
  const market = markets.find((m) => m.market_id === marketId) ?? null;
  // Bets for this market only
  const bets = allBets.filter((b) => b.market_id === marketId);

  // ── Form state (creation mode) ──
  const [tournament, setTournament] = useState("");
  const [teamA, setTeamA]           = useState("");
  const [teamB, setTeamB]           = useState("");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [probYes, setProbYes]       = useState(60);
  const [bandarStake, setBandarStake] = useState<number | string>(50);
  const [hostAddress]               = useState("0xWDK_Host_99A");

  const [isTournamentOpen, setIsTournamentOpen] = useState(false);
  const [isTeamAOpen, setIsTeamAOpen]           = useState(false);
  const [isTeamBOpen, setIsTeamBOpen]           = useState(false);
  const [isSimulatingOdds, setIsSimulatingOdds] = useState(false);

  useEffect(() => { setTeamA(""); setTeamB(""); }, [tournament]);

  const probNo      = 100 - probYes;
  const qvacOddsYes = Number((1 / (probYes / 100)).toFixed(2));
  const qvacOddsNo  = Number((1 / (probNo / 100)).toFixed(2));
  const availableTeams = tournament ? TOURNAMENT_DATA[tournament] || [] : [];

  // ── Timer state (active market) ──
  const [timeLeft, setTimeLeft]               = useState("01:00");
  const [isLowTime, setIsLowTime]             = useState(false);
  const [consensusTimeLeft, setConsensusTimeLeft] = useState(15);
  const [varResolutionTime, setVarResolutionTime] = useState(600);

  const logMsg = (msg: string) =>
    console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

  // Countdown: OPEN → FROZEN auto
  useEffect(() => {
    if (!market || market.status !== "OPEN") return;
    const interval = setInterval(() => {
      const elapsed    = Date.now() - market.created_timestamp;
      const remaining  = Math.max(0, 60_000 - elapsed);
      const minutes    = Math.floor(remaining / 60_000);
      const seconds    = Math.floor((remaining % 60_000) / 1_000);
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
      setVarResolutionTime(600);
      return;
    }
    const interval = setInterval(() => {
      let hit = false;
      setVarResolutionTime((prev) => {
        if (prev <= 1) { hit = true; return 0; }
        return prev - 1;
      });
      if (hit) {
        clearInterval(interval);
        disputeMarketById(market.market_id);
        showToast("Waktu input habis! Mengajukan sengketa otomatis.", "warning");
        logMsg("[SYSTEM] Timer VAR habis → SENGKETA.");
      }
    }, 1_000);
    return () => clearInterval(interval);
  }, [market?.status]); // eslint-disable-line

  // Countdown: AWAITING_CONSENSUS (15s)
  useEffect(() => {
    if (!market || (market.status !== "AWAITING_CONSENSUS" && market.status !== "GRACE_PERIOD")) {
      setConsensusTimeLeft(15);
      return;
    }
    const interval = setInterval(() => {
      let hit = false;
      setConsensusTimeLeft((prev) => {
        if (prev <= 1) { hit = true; return 0; }
        return prev - 1;
      });
      if (hit) {
        clearInterval(interval);
        closeMarketById(market.market_id);
        showToast("Pasar selesai. Keputusan akhir ditetapkan.", "success");
        logMsg("[SYSTEM] Waktu konsensus habis → CLOSED.");
      }
    }, 1_000);
    return () => clearInterval(interval);
  }, [market?.status]); // eslint-disable-line

  // ── Handlers ──
  const runMockQVAC = () => {
    setIsSimulatingOdds(true);
    logMsg("[QVAC] Analyzing FIFA rule documents locally...");
    setTimeout(() => {
      const rnd = Math.floor(Math.random() * 60) + 20;
      setProbYes(rnd);
      setIsSimulatingOdds(false);
      logMsg(`[QVAC] Odds: YES: ${(1/(rnd/100)).toFixed(2)}x, NO: ${(1/((100-rnd)/100)).toFixed(2)}x`);
    }, 1_200);
  };

  const handleOpenMarket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketId || !incidentDesc.trim() || !tournament || !teamA || !teamB || teamA === teamB) return;
    const matchName = `${teamA} vs ${teamB}`;
    const odds = { YES: qvacOddsYes, NO: qvacOddsNo };
    const matchInfo = { tournament, match: matchName };
    addMarket(marketId, matchInfo, "VAR_CHECK", incidentDesc.trim(), odds, Number(bandarStake), hostAddress);
    showToast("Pasar taruhan berhasil dibuka.", "success");
    logMsg(`[WDK] Locked ${bandarStake} USDT as Bandar Guarantee.`);
    logMsg(`[PEARS] Broadcasted Market: ${marketId} - "${matchName}"`);
  };

  const handleFreezeMarket = (isAuto = false) => {
    if (!marketId) return;
    freezeMarketById(marketId);
    showToast(isAuto ? "Waktu taruhan habis. Pasar dikunci." : "Pasar dikunci paksa.", "warning");
    logMsg("[PEARS] Broadcasted STOP TARUHAN.");
  };

  const handleResolveMarket = (outcome: "YES" | "NO") => {
    if (!marketId) return;
    resolveMarketById(marketId, outcome);
    showToast("Keputusan wasit diinput. Menunggu konsensus.", "success");
    logMsg(`[SYSTEM] Bandar input: "${outcome}". Awaiting punter consensus (15s)...`);
  };

  const simulatePunterBet = () => {
    if (!market || market.status !== "OPEN" || !marketId) return;
    const n    = Math.floor(Math.random() * 100) + 10;
    const addr = `0xWDK_Punter_${n}`;
    const ch   = Math.random() > 0.4 ? "YES" : "NO";
    const amt  = Math.floor(Math.random() * 15) + 5;
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
  const yesBetsSum     = bets.filter((b) => b.choice === "YES").reduce((a, b) => a + b.amount_usdt, 0);
  const noBetsSum      = bets.filter((b) => b.choice === "NO").reduce((a, b) => a + b.amount_usdt, 0);
  const totalPunterBets= yesBetsSum + noBetsSum;
  const yesPercent     = totalPunterBets > 0 ? (yesBetsSum / totalPunterBets) * 100 : 50;
  const noPercent      = totalPunterBets > 0 ? (noBetsSum / totalPunterBets) * 100 : 50;

  // ── Loading ──
  if (!mounted) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center text-zinc-400">
        <Activity className="animate-spin mr-2 h-5 w-5" /> Inisialisasi Bandar Console...
      </div>
    );
  }

  // ── No ID in URL ──
  if (!marketId) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 px-6">
        <p className="text-zinc-400 text-sm">Tidak ada ID pasar di URL.</p>
        <Link href="/bandar" className="btn-3d-yellow px-6 py-3 rounded-xl text-sm font-black uppercase">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="max-w-md mx-auto w-full px-6 pb-6 flex flex-col relative pb-48 flex-1"
    >
      {/* Header */}
      <header className="py-3.5 flex justify-between items-center z-10 mb-6 bg-transparent w-full">
        <div className="flex items-center gap-3">
          <Link
            href="/bandar"
            className="flex items-center justify-center p-2.5 bg-zinc-800 rounded-full border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.5)] transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-300 hover:text-white" />
          </Link>
          <div>
            <h1 className="text-sm font-black tracking-tight text-yellow-400 uppercase">
              Bandar Console
            </h1>
            <div 
              onClick={() => {
                navigator.clipboard.writeText(hostAddress);
                showToast("Address disalin ke clipboard!", "success");
              }}
              className="flex items-center gap-1.5 mt-0.5 cursor-pointer hover:text-white active:scale-95 transition-all text-zinc-500"
              title="Salin Alamat Wallet"
            >
              <span className="text-[10px] font-mono">
                {hostAddress.slice(0, 4)}...{hostAddress.slice(-4)}
              </span>
              <Copy className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 space-y-5 pb-8">
        {market ? (
          /* ═══ ACTIVE MARKET VIEW ═══ */
          <div className="space-y-4">
            {/* Resolution Panel */}
            {market.status === "FROZEN_BETTING" && (
              <div className="bg-zinc-900 border border-red-900/30 rounded-3xl p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-yellow-500" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Input Hasil Resmi
                  </h4>
                </div>
                <p className="text-xs text-zinc-400 tracking-normal leading-relaxed mt-1">
                  Masukkan keputusan wasit setelah melakukan analisa VAR resmi.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handleResolveMarket("YES")}
                    className="btn-3d-yellow py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Set Hasil: YES
                  </button>
                  <button
                    onClick={() => handleResolveMarket("NO")}
                    className="py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-950 hover:from-zinc-700 hover:to-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all active:scale-95 active:translate-y-[1px]"
                  >
                    Set Hasil: NO
                  </button>
                </div>
              </div>
            )}

            {/* Consensus Indicator */}
            {market.status === "AWAITING_CONSENSUS" && (
              <div className="bg-zinc-900 border border-yellow-900/30 rounded-3xl p-4 text-center space-y-2">
                <Users className="w-6 h-6 text-yellow-400 mx-auto" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Menunggu Persetujuan Petaruh
                </h4>
                <p className="text-[10px] text-zinc-400">
                  Bandar input hasil{" "}
                  <span className="text-yellow-400 font-bold">
                    {market.resolution_outcome}
                  </span>
                  . Petaruh memiliki {consensusTimeLeft} detik.
                </p>
              </div>
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
              const parts  = market.match_info.match.split(" vs ");
              const tA     = parts[0] || "";
              const tB     = parts[1] || "";
              const profit = totalPunterBets * 0.1;
              return (
                <div className="space-y-3">
                  <MarketResultCard
                    tournament={market.match_info.tournament}
                    teamA={tA}
                    teamB={tB}
                    incident={market.incident_description}
                    finalResult={market.resolution_outcome as "YES" | "NO"}
                    pnlAmount={profit}
                    statusText="PROFIT (FEE)"
                    estimatedBalance={Number(bandarStake) + profit}
                    descriptionText="Berdasarkan 10% Spread Fee Terkumpul."
                    showPnL={true}
                  />
                </div>
              );
            })()}

            {/* Status Card */}
            <MarketStatusCard
              title="Status Pasar"
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
                  : market.status === "AWAITING_CONSENSUS"
                  ? consensusTimeLeft
                  : market.status === "FROZEN_BETTING"
                  ? varResolutionTime
                  : null
              }
              status={market.status as any}
              statusText={market.status === "DISPUTED_FROZEN" ? "SENGKETA" : undefined}
              statusColor={market.status === "DISPUTED_FROZEN" ? "text-yellow-500" : undefined}
            />

            {/* STOP & KUNCI PASAR */}
            {market.status === "OPEN" && (
              <button
                onClick={() => handleFreezeMarket(false)}
                className="w-full bg-gradient-to-b from-red-600 to-red-800 border border-red-500/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_10px_rgba(0,0,0,0.5)] text-white font-bold rounded-xl py-3 active:scale-95 transition-all mb-4 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs"
              >
                <Flame className="w-4 h-4 fill-white" />
                STOP & KUNCI PASAR (VAR KELUAR)
              </button>
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
            <div className="bg-zinc-900/80 rounded-2xl border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-5 space-y-3">
              <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Daftar Taruhan</span>
                <span className="text-[10px] font-mono text-zinc-600">{bets.length} Bets</span>
              </h4>
              {bets.length === 0 ? (
                <div className="py-6 text-center text-zinc-600 text-[11px] border border-dashed border-zinc-800 rounded-2xl">
                  Belum ada taruhan masuk dari Punter sekitar.
                </div>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-1">
                  {bets.slice().reverse().map((bet) => (
                    <div
                      key={bet.bet_id}
                      className="flex items-center justify-between p-2.5 bg-black/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={
                            bet.choice === "YES"
                              ? "bg-yellow-500 text-zinc-950 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md"
                              : "bg-zinc-700 text-zinc-300 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md"
                          }
                        >
                          {bet.choice}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-zinc-300 font-mono truncate max-w-[120px]">
                            {bet.punter_pubkey}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(bet.timestamp).toLocaleTimeString([], {
                              hour: "2-digit", minute: "2-digit", second: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white font-mono">
                        {bet.amount_usdt} USDT
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ═══ CREATION FORM ═══ */
          <form onSubmit={handleOpenMarket} className="space-y-5">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
              Buka Pasar Taruhan Baru
            </div>

            {/* Market ID preview */}
            <div className="text-[10px] text-zinc-600 font-mono bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-2">
              ID: {marketId}
            </div>

            {/* Tournament Select */}
            <div className="space-y-2 relative">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                Pilih Turnamen
              </label>
              <div className="relative">
                <div
                  onClick={() => { setIsTournamentOpen(!isTournamentOpen); setIsTeamAOpen(false); setIsTeamBOpen(false); }}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 shadow-inner text-sm text-white font-semibold flex items-center justify-between cursor-pointer select-none"
                >
                  <span>{tournament || "Pilih turnamen..."}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isTournamentOpen ? "rotate-180" : ""}`} />
                </div>
                {isTournamentOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                    {Object.keys(TOURNAMENT_DATA).map((t) => (
                      <div key={t} onClick={() => { setTournament(t); setIsTournamentOpen(false); }}
                        className="px-4 py-3 text-sm text-white hover:bg-zinc-700 cursor-pointer transition-colors">
                        {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tim A */}
            <div className="space-y-2 relative">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Pilih Tim A</label>
              <div className="relative">
                <div
                  onClick={() => { if (tournament) { setIsTeamAOpen(!isTeamAOpen); setIsTournamentOpen(false); setIsTeamBOpen(false); } }}
                  className={`w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 shadow-inner text-sm text-white font-semibold flex items-center justify-between cursor-pointer select-none ${!tournament ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <span>{teamA || (tournament ? "Pilih Tim A..." : "Pilih turnamen dahulu...")}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isTeamAOpen ? "rotate-180" : ""}`} />
                </div>
                {isTeamAOpen && tournament && (
                  <div className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                    {availableTeams.map((team) => (
                      <div key={team} onClick={() => { setTeamA(team); setIsTeamAOpen(false); }}
                        className="px-4 py-3 text-sm text-white hover:bg-zinc-700 cursor-pointer transition-colors">
                        {team}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tim B */}
            <div className="space-y-2 relative">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Pilih Tim B</label>
              <div className="relative">
                <div
                  onClick={() => { if (tournament && teamA) { setIsTeamBOpen(!isTeamBOpen); setIsTournamentOpen(false); setIsTeamAOpen(false); } }}
                  className={`w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 shadow-inner text-sm text-white font-semibold flex items-center justify-between cursor-pointer select-none ${!tournament || !teamA ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <span>{teamB || (!tournament ? "Pilih turnamen dahulu..." : !teamA ? "Pilih Tim A dahulu..." : "Pilih Tim B...")}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isTeamBOpen ? "rotate-180" : ""}`} />
                </div>
                {isTeamBOpen && tournament && teamA && (
                  <div className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                    {availableTeams.filter((t) => t !== teamA).map((team) => (
                      <div key={team} onClick={() => { setTeamB(team); setIsTeamBOpen(false); }}
                        className="px-4 py-3 text-sm text-white hover:bg-zinc-700 cursor-pointer transition-colors">
                        {team}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Template Insiden */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Template Insiden Cepat</label>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {INCIDENT_TEMPLATES.map(({ tag, text }) => (
                  <button key={tag} type="button" onClick={() => setIncidentDesc(text)}
                    className="bg-yellow-500 text-zinc-950 font-bold px-3 py-2 rounded-lg border-b-4 border-yellow-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all cursor-pointer select-none text-[11px]">
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Incident Textarea */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Deskripsi Detail Insiden</label>
              <textarea required rows={4} value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)}
                placeholder="Jelaskan sejelas mungkin agar AI akurat..."
                className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 shadow-inner text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-0 resize-none leading-relaxed"
              />
            </div>

            {/* QVAC Odds Calculator */}
            <div className="bg-zinc-900/80 rounded-2xl border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-yellow-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">VAR AI ANALYTICS</h4>
                </div>
                <button type="button" onClick={runMockQVAC} disabled={isSimulatingOdds}
                  className="px-3 py-1.5 text-[10px] font-black rounded-lg text-black bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 border border-yellow-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.2),inset 0 -2px 0 rgba(0,0,0,0.15)" }}
                >
                  {isSimulatingOdds ? <><Activity className="w-3 h-3 animate-spin" /> Analyzing...</> : "Inference Rules"}
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 font-semibold">Probabilitas YES:</span>
                  <span className="text-yellow-400 font-bold">{probYes}%</span>
                </div>
                <input type="range" min="10" max="90" value={probYes} disabled
                  onChange={(e) => setProbYes(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none pointer-events-none opacity-80 accent-yellow-500"
                />
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                  <div className="text-center p-3 rounded-2xl bg-yellow-500/5 border border-yellow-500/15">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-yellow-400" />
                      <p className="text-[9px] text-yellow-500 font-extrabold uppercase tracking-wide">Odds YES</p>
                    </div>
                    <p className="text-xl font-black text-yellow-400 font-mono">{qvacOddsYes.toFixed(2)}x</p>
                  </div>
                  <div className="text-center p-3 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-zinc-400" />
                      <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide">Odds NO</p>
                    </div>
                    <p className="text-xl font-black text-zinc-300 font-mono">{qvacOddsNo.toFixed(2)}x</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stake & Wallet */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Jaminan Bandar</label>
                <div className="relative">
                  <input type="number" required min="50" value={bandarStake}
                    onChange={(e) => setBandarStake(e.target.value)}
                    onBlur={() => { if (Number(bandarStake) < 50 || bandarStake === "") setBandarStake(50); }}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 shadow-inner text-xs text-white font-bold font-mono focus:outline-none focus:ring-0"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-500">USDT</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Wallet Bandar</label>
                <div className="relative">
                  <div className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 shadow-inner text-[10px] text-zinc-400 font-mono truncate pr-10">
                    {hostAddress}
                  </div>
                  <Wallet className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button type="submit"
              disabled={!tournament || !teamA || !teamB || teamA === teamB || !incidentDesc.trim() || Number(bandarStake) < 50 || bandarStake === ""}
              className="btn-3d-yellow w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              STAKE & SIARKAN PASAR
            </button>
          </form>
        )}
      </div>

      {/* ═══ SIMULATION PANEL ═══ */}
      <div className="absolute bottom-0 left-0 right-0 bg-zinc-950/95 border-t border-zinc-800/80 px-4 py-3 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Simulation Console
          </span>
          <span className="text-[8px] text-zinc-500 font-mono">P2P Network Mock</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <button type="button" onClick={simulatePunterBet}
            disabled={!market || market.status !== "OPEN"}
            className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
            <DollarSign className="w-3 h-3 text-yellow-400" /> Punter Bet
          </button>
          <button type="button" onClick={simulateDispute}
            disabled={!market || market.status !== "AWAITING_CONSENSUS"}
            className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
            <AlertTriangle className="w-3 h-3 text-red-500" /> Dispute
          </button>
          <button type="button" onClick={simulateConsensus}
            disabled={!market || market.status !== "AWAITING_CONSENSUS"}
            className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Consensus OK
          </button>
          {market?.status === "DISPUTED_FROZEN" ? (
            <div className="col-span-2 grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800 mt-1">
              <button type="button" onClick={() => simulateOracle("YES")}
                className="py-1.5 px-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer">
                <Globe className="w-3 h-3 animate-spin" /> Oracle: YES
              </button>
              <button type="button" onClick={() => simulateOracle("NO")}
                className="py-1.5 px-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer">
                <Globe className="w-3 h-3 animate-spin" /> Oracle: NO
              </button>
            </div>
          ) : (
            <button type="button" disabled
              className="py-1.5 px-2 bg-zinc-950 border border-zinc-900/40 rounded-xl text-zinc-700 font-semibold cursor-not-allowed flex items-center justify-center gap-1.5">
              <Globe className="w-3 h-3" /> Oracle Inactive
            </button>
          )}
          {/* DEV: Force Timeout */}
          <button type="button"
            onClick={() => { if (market?.status === "FROZEN_BETTING" && marketId) { disputeMarketById(marketId); logMsg("[DEV] Force Timeout → DISPUTE."); } }}
            disabled={!market || market.status !== "FROZEN_BETTING"}
            className="col-span-2 py-1.5 px-2 bg-yellow-500/10 hover:bg-yellow-500/20 disabled:opacity-30 border border-yellow-500/30 rounded-xl text-yellow-400 font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
            <AlertTriangle className="w-3 h-3" /> Dev: Force 10m Timeout (DISPUTE)
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Outer wrapper with Suspense (required for useSearchParams) ───────────
export default function BandarConsoleDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 items-center justify-center text-zinc-400">
        <Activity className="animate-spin mr-2 h-5 w-5" /> Memuat Console...
      </div>
    }>
      <BandarConsoleInner />
    </Suspense>
  );
}
