"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useMarketStore } from "@/store/marketStore";
import { useToastStore } from "@/store/useToastStore";
import {
  ArrowLeft,
  Flame,
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  WifiOff,
  Users,
  DollarSign,
  Cpu,
  Wallet,
  Clock,
  Globe,
  ChevronDown,
  Sparkles,
  Copy,
  Target,
  TrendingUp,
  Gavel,
} from "lucide-react";
import MarketStatusCard from "@/components/MarketStatusCard";
import BetDistributionCard from "@/components/BetDistributionCard";
import MarketResultCard from "@/components/MarketResultCard";
import LockedMarketCard from "@/components/LockedMarketCard";

// ─── Tournament & Team Data ───
const TOURNAMENT_DATA: Record<string, string[]> = {
  "🌍 World Cup 2026": [
    "Argentina",
    "France",
    "Brazil",
    "England",
    "Germany",
    "Japan",
    "Morocco",
    "Portugal",
    "Spain",
    "Netherlands",
    "Mexico",
    "USA",
  ],
  "🦁 Premier League 2025/26": [
    "Arsenal",
    "Manchester City",
    "Liverpool",
    "Manchester United",
    "Chelsea",
    "Tottenham",
    "Newcastle",
    "Aston Villa",
  ],
};

const INCIDENT_TEMPLATES = [
  { tag: "# LastMan", text: "Pemain terakhir melakukan pelanggaran keras (tackle dari belakang) pada striker." },
  { tag: "# Handball", text: "Pemain bertahan melakukan handball di dalam kotak penalti saat memblok tendangan." },
  { tag: "# ShirtPull", text: "Pemain bertahan menarik baju striker di dalam kotak penalti saat posisi 1v1 dengan kiper." },
  { tag: "# Offside", text: "Gol dianulir karena dugaan posisi offside sangat tipis dari pemain sayap." },
  { tag: "# DivePenalty", text: "Striker melakukan diving di dalam kotak penalti untuk memicu penalti." },
  { tag: "# Elbow", text: "Pemain melakukan sikutan sengaja ke arah wajah lawan saat perebutan bola." },
];

export default function BandarConsolePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Zustand
  const {
    market,
    bets,
    openMarket,
    freezeMarket,
    addBet,
    resolveMarket,
    disputeMarket,
    closeMarket,
    resetStore,
  } = useMarketStore();

  const showToast = useToastStore((state) => state.showToast);

  // Form state
  const [tournament, setTournament] = useState("");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [probYes, setProbYes] = useState(60);
  const [bandarStake, setBandarStake] = useState<number | string>(10);
  const [hostAddress] = useState("0xWDK_Host_99A");

  // Custom dropdown states
  const [isTournamentOpen, setIsTournamentOpen] = useState(false);
  const [isTeamAOpen, setIsTeamAOpen] = useState(false);
  const [isTeamBOpen, setIsTeamBOpen] = useState(false);

  const handleSelectTournament = (value: string) => {
    setTournament(value);
    setIsTournamentOpen(false);
  };
  const handleSelectTeamA = (value: string) => {
    setTeamA(value);
    setIsTeamAOpen(false);
  };
  const handleSelectTeamB = (value: string) => {
    setTeamB(value);
    setIsTeamBOpen(false);
  };

  // Timer states
  const [timeLeft, setTimeLeft] = useState("01:00");
  const [isLowTime, setIsLowTime] = useState(false);
  const [consensusTimeLeft, setConsensusTimeLeft] = useState(15);

  // Consensus countdown logic
  useEffect(() => {
    if (!market || (market.status !== "AWAITING_CONSENSUS" && market.status !== "GRACE_PERIOD")) {
      setConsensusTimeLeft(15);
      return;
    }

    const interval = setInterval(() => {
      let isZero = false;
      setConsensusTimeLeft((prev) => {
        if (prev <= 1) {
          isZero = true;
          return 0;
        }
        return prev - 1;
      });

      if (isZero) {
        clearInterval(interval);
        closeMarket();
        showToast("Pasar selesai. Keputusan akhir telah ditetapkan.", "success");
        console.log(`[${new Date().toLocaleTimeString()}] [SYSTEM] Waktu konsensus habis. Pasar otomatis ditutup.`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [market?.status, closeMarket]);

  // VAR Resolution countdown (10 menit = 600 detik) saat pasar FROZEN
  const [varResolutionTime, setVarResolutionTime] = useState(600);
  useEffect(() => {
    if (!market || market.status !== "FROZEN_BETTING") {
      setVarResolutionTime(600);
      return;
    }

    const interval = setInterval(() => {
      let isZero = false;
      setVarResolutionTime((prev) => {
        if (prev <= 1) {
          isZero = true;
          return 0;
        }
        return prev - 1;
      });

      if (isZero) {
        clearInterval(interval);
        // Waktu habis → otomatis DISPUTE
        disputeMarket();
        showToast("Waktu input habis! Mengajukan sengketa otomatis.", "warning");
        console.log(`[${new Date().toLocaleTimeString()}] [SYSTEM] Timer VAR habis. Pasar otomatis masuk SENGKETA.`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [market?.status, disputeMarket]);

  // Status change listener for global toasts
  const prevStatusRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!market) {
      prevStatusRef.current = null;
      return;
    }
    const prev = prevStatusRef.current;
    if (market.status !== prev) {
      if (market.status === "DISPUTED_FROZEN" || market.status === "DISPUTED") {
        if (varResolutionTime > 1) {
          showToast("Voting >51% terpenuhi! Pasar dikunci oleh jaringan.", "warning");
        }
      } else if (market.status === "CLOSED" && (prev === "DISPUTED_FROZEN" || prev === "DISPUTED")) {
        showToast("Oracle API berhasil memverifikasi hasil akhir.", "success");
      }
    }
    prevStatusRef.current = market.status;
  }, [market?.status, varResolutionTime, showToast]);

  // Simulation
  const [isSimulatingOdds, setIsSimulatingOdds] = useState(false);

  // Derived
  const probNo = 100 - probYes;
  const qvacOddsYes = Number((1 / (probYes / 100)).toFixed(2));
  const qvacOddsNo = Number((1 / (probNo / 100)).toFixed(2));
  const availableTeams = tournament ? TOURNAMENT_DATA[tournament] || [] : [];

  // Reset teams when tournament changes
  useEffect(() => {
    setTeamA("");
    setTeamB("");
  }, [tournament]);

  // Countdown logic relative to market created_timestamp
  useEffect(() => {
    if (!market || market.status !== "OPEN") return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - market.created_timestamp;
      const remaining = Math.max(0, 60000 - elapsed); // 1 minute (60000 ms)
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      setTimeLeft(formattedTime);
      setIsLowTime(remaining < 15000); // Under 15s turns red and blinks
    }, 500);
    return () => clearInterval(interval);
  }, [market]);

  const logMessage = (msg: string) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
  };

  const runMockQVAC = () => {
    setIsSimulatingOdds(true);
    logMessage("[QVAC] Analyzing FIFA rule documents locally...");
    setTimeout(() => {
      const randomYesProb = Math.floor(Math.random() * 60) + 20;
      setProbYes(randomYesProb);
      setIsSimulatingOdds(false);
      logMessage(
        `[QVAC] Inference finished: YES Prob: ${randomYesProb}%, NO Prob: ${100 - randomYesProb}%`
      );
      logMessage(
        `[QVAC] Odds: YES: ${(1 / (randomYesProb / 100)).toFixed(2)}x, NO: ${(1 / ((100 - randomYesProb) / 100)).toFixed(2)}x`
      );
    }, 1200);
  };

  const handleOpenMarket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDesc.trim() || !tournament || !teamA || !teamB || teamA === teamB) return;

    const matchName = `${teamA} vs ${teamB}`;
    const marketId = `MKT_${Date.now().toString().slice(-6)}`;
    const odds = { YES: qvacOddsYes, NO: qvacOddsNo };
    const matchInfo = { tournament, match: matchName };

    openMarket(
      marketId,
      matchInfo,
      "VAR_CHECK",
      incidentDesc.trim(),
      odds,
      Number(bandarStake),
      hostAddress
    );
    showToast("Pasar taruhan berhasil dibuka.", "success");
    logMessage(`[WDK] Staking escrow: Locked ${bandarStake} USDT as Bandar Guarantee.`);
    logMessage(`[PEARS] Broadcasted New Market: ${marketId} - "${matchName}"`);
  };

  const handleFreezeMarket = (isAuto = false) => {
    freezeMarket();
    if (isAuto) {
      showToast("Waktu taruhan habis. Pasar ditutup sementara.", "warning");
    } else {
      showToast("Pasar dikunci paksa oleh Bandar.", "warning");
    }
    logMessage("[PEARS] Broadcasted STOP TARUHAN. Betting locked for all Punters!");
    logMessage("[SYSTEM] Anti-frontrunning protection active.");
  };

  // Auto-freeze when countdown reaches 00:00
  useEffect(() => {
    if (market && market.status === "OPEN" && timeLeft === "00:00") {
      handleFreezeMarket(true);
    }
  }, [timeLeft, market]);

  const handleResolveMarket = (outcome: "YES" | "NO") => {
    resolveMarket(outcome);
    showToast("Keputusan wasit berhasil diinput. Menunggu konsensus.", "success");
    logMessage(
      `[SYSTEM] Bandar input resolution: "${outcome}". Awaiting punter consensus (60s)...`
    );
  };

  const simulatePunterBet = () => {
    if (!market || market.status !== "OPEN") {
      logMessage("[WARNING] Cannot simulate bet. Market is not OPEN.");
      return;
    }
    const n = Math.floor(Math.random() * 100) + 10;
    const addr = `0xWDK_Punter_${n}`;
    const choice = Math.random() > 0.4 ? "YES" : "NO";
    const amt = Math.floor(Math.random() * 15) + 5;
    addBet(choice as "YES" | "NO", amt, addr);
    logMessage(`[PEARS] Received Bet: ${addr} placed ${amt} USDT on ${choice}`);
  };

  const simulateConsensus = () => {
    if (!market || market.status !== "AWAITING_CONSENSUS") return;
    closeMarket();
    logMessage("[PEARS] Consensus reached: Punters accepted Bandar decision.");
    logMessage(
      `[WDK] Escrow Unlocked. Distributed ${market.total_pool} USDT to winners of "${market.resolution_outcome}".`
    );
  };

  const simulateDispute = () => {
    if (!market || market.status !== "AWAITING_CONSENSUS") return;
    disputeMarket();
    logMessage("[PEARS] CRITICAL: 3+ Punters submitted DISPUTE!");
    logMessage("[WDK] Escrow Frozen. Awaiting Oracle Resolution.");
  };

  const simulateOracle = (truth: "YES" | "NO") => {
    if (!market || market.status !== "DISPUTED_FROZEN") return;
    logMessage("[ORACLE] Internet re-established. Fetching sports API...");
    setTimeout(() => {
      const bandarLied = market.resolution_outcome !== truth;
      logMessage(
        `[ORACLE] Official: "${truth}". Bandar said: "${market.resolution_outcome}".`
      );
      if (bandarLied) {
        logMessage(`[SLASHING] Bandar lied! ${market.bandar_stake} USDT confiscated.`);
      } else {
        logMessage("[SLASHING] Bandar honest. Disputing punters penalized 10%.");
      }
      closeMarket();
      logMessage("[SYSTEM] Market CLOSED.");
    }, 1500);
  };



  // ─── Pool calculations ───
  const yesBetsSum = bets.filter((b) => b.choice === "YES").reduce((a, b) => a + b.amount_usdt, 0);
  const noBetsSum = bets.filter((b) => b.choice === "NO").reduce((a, b) => a + b.amount_usdt, 0);
  const totalPunterBets = yesBetsSum + noBetsSum;
  const yesPercent = totalPunterBets > 0 ? (yesBetsSum / totalPunterBets) * 100 : 50;
  const noPercent = totalPunterBets > 0 ? (noBetsSum / totalPunterBets) * 100 : 50;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
        <Activity className="animate-spin mr-2 h-5 w-5" /> Inisialisasi Bandar Console...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full px-6 pb-6 flex flex-col relative pb-48 flex-1">
      {/* Header */}
      <header className="py-3.5 flex justify-between items-center z-10 mb-6 bg-transparent w-full">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center p-2.5 bg-zinc-800 rounded-full border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.5)] transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-300 hover:text-white" />
          </Link>
          <div>
            <h1 className="text-sm font-black tracking-tight text-yellow-400 uppercase">
              Bandar Console
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-zinc-500 font-mono">
                {hostAddress.slice(0, 4)}...{hostAddress.slice(-4)}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(hostAddress)}
                className="text-zinc-400 hover:text-white transition-colors"
                title="Salin Alamat Wallet"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>



      {/* Content Container */}
      <div className="flex-1 space-y-5 pb-8">
          {market ? (
            /* ═══ ACTIVE MARKET VIEW ═══ */
            <div className="space-y-4">
              {/* ─── ACTION CARDS (MOVED TO TOP) ─── */}
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
                      className="py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-950 hover:from-zinc-700 hover:to-zinc-900 text-zinc-350 hover:text-white border border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all active:scale-95 active:translate-y-[1px]"
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
                    . Petaruh memiliki 15 detik.
                  </p>
                </div>
              )}

              {/* Disputed State */}
              {market.status === "DISPUTED_FROZEN" && (
                <LockedMarketCard status={market.status} resolutionOutcome={market.resolution_outcome ?? undefined} />
              )}

              {/* Closed State & Profit Card */}
              {market.status === "CLOSED" && (
                <div className="space-y-3">
                  {(() => {
                    const matchParts = market.match_info.match.split(" vs ");
                    const teamA = matchParts[0] || "";
                    const teamB = matchParts[1] || "";
                    const profit = totalPunterBets * 0.1;

                    return (
                      <MarketResultCard
                        tournament={market.match_info.tournament}
                        teamA={teamA}
                        teamB={teamB}
                        incident={market.incident_description}
                        finalResult={market.resolution_outcome as 'YES' | 'NO'}
                        pnlAmount={profit}
                        statusText="PROFIT (FEE)"
                        estimatedBalance={Number(bandarStake) + profit}
                        descriptionText="Berdasarkan 10% Spread Fee Terkumpul."
                        showPnL={true}
                      />
                    );
                  })()}
                </div>
              )}

              {/* Status Banner — Reusable Component */}
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
                    ? (() => {
                        const remaining = Math.max(0, 60000 - (Date.now() - market.created_timestamp));
                        return Math.ceil(remaining / 1000);
                      })() 
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

              {/* STOP & KUNCI PASAR (VAR KELUAR) BUTTON */}
              {market.status === "OPEN" && (
                <button
                  onClick={() => handleFreezeMarket(false)}
                  className="w-full bg-gradient-to-b from-red-600 to-red-800 border border-red-500/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_10px_rgba(0,0,0,0.5)] text-white font-bold rounded-xl py-3 active:scale-95 transition-all mb-4 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs"
                >
                  <Flame className="w-4 h-4 fill-white" />
                  STOP & KUNCI PASAR (VAR KELUAR)
                </button>
              )}

              {/* Pool Visualizer — Reusable Component */}
              <BetDistributionCard
                totalPunters={bets.length}
                totalPool={market.total_pool}
                yesPercentage={yesPercent}
                noPercentage={noPercent}
                yesPool={yesBetsSum}
                noPool={noBetsSum}
              />
            </div>
          ) : (
            /* ═══ CREATION FORM ═══ */
            <form onSubmit={handleOpenMarket} className="space-y-5">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Buka Pasar Taruhan Baru
              </div>

              {/* Tournament Select (Custom Dropdown) */}
              <div className="space-y-2 relative">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Pilih Turnamen
                </label>
                <div className="relative">
                  <div
                    onClick={() => {
                      setIsTournamentOpen(!isTournamentOpen);
                      setIsTeamAOpen(false);
                      setIsTeamBOpen(false);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 shadow-inner text-sm text-white font-semibold flex items-center justify-between cursor-pointer select-none"
                  >
                    <span>{tournament || "Pilih turnamen..."}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isTournamentOpen ? "rotate-180" : ""}`} />
                  </div>
                  {isTournamentOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                      {Object.keys(TOURNAMENT_DATA).map((t) => (
                        <div
                          key={t}
                          onClick={() => handleSelectTournament(t)}
                          className="px-4 py-3 text-sm text-white hover:bg-zinc-700 cursor-pointer transition-colors"
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chained Dropdown Tim A (Custom Dropdown) */}
              <div className="space-y-2 relative">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Pilih Tim A
                </label>
                <div className="relative">
                  <div
                    onClick={() => {
                      if (tournament) {
                        setIsTeamAOpen(!isTeamAOpen);
                        setIsTournamentOpen(false);
                        setIsTeamBOpen(false);
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 shadow-inner text-sm text-white font-semibold flex items-center justify-between cursor-pointer select-none ${
                      !tournament ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  >
                    <span>{teamA || (tournament ? "Pilih Tim A..." : "Pilih turnamen dahulu...")}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isTeamAOpen ? "rotate-180" : ""}`} />
                  </div>
                  {isTeamAOpen && tournament && (
                    <div className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                      {availableTeams.map((team) => (
                        <div
                          key={team}
                          onClick={() => handleSelectTeamA(team)}
                          className="px-4 py-3 text-sm text-white hover:bg-zinc-700 cursor-pointer transition-colors"
                        >
                          {team}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chained Dropdown Tim B (Custom Dropdown) */}
              <div className="space-y-2 relative">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Pilih Tim B
                </label>
                <div className="relative">
                  <div
                    onClick={() => {
                      if (tournament && teamA) {
                        setIsTeamBOpen(!isTeamBOpen);
                        setIsTournamentOpen(false);
                        setIsTeamAOpen(false);
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 shadow-inner text-sm text-white font-semibold flex items-center justify-between cursor-pointer select-none ${
                      !tournament || !teamA ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  >
                    <span>
                      {teamB ||
                        (!tournament
                          ? "Pilih turnamen dahulu..."
                          : !teamA
                          ? "Pilih Tim A dahulu..."
                          : "Pilih Tim B...")}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isTeamBOpen ? "rotate-180" : ""}`} />
                  </div>
                  {isTeamBOpen && tournament && teamA && (
                    <div className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                      {availableTeams
                        .filter((t) => t !== teamA)
                        .map((team) => (
                          <div
                            key={team}
                            onClick={() => handleSelectTeamB(team)}
                            className="px-4 py-3 text-sm text-white hover:bg-zinc-700 cursor-pointer transition-colors"
                          >
                            {team}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Template Insiden Cepat */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Template Insiden Cepat
                </label>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {INCIDENT_TEMPLATES.map(({ tag, text }) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setIncidentDesc(text)}
                      className="bg-yellow-500 text-zinc-950 font-bold px-3 py-2 rounded-lg border-b-4 border-yellow-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all cursor-pointer select-none text-[11px]"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Incident Description Textarea */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Deskripsi Detail Insiden
                </label>
                <textarea
                  required
                  rows={4}
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Jelaskan sejelas mungkin agar AI akurat. Contoh: Pemain bertahan terakhir menarik baju striker di dalam kotak penalti saat posisi 1v1 dengan kiper..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 shadow-inner text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-0 resize-none leading-relaxed"
                />
              </div>

              {/* QVAC Odds Calculator */}
              <div className="bg-zinc-900/80 rounded-2xl border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-yellow-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      VAR AI ANALYTICS
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={runMockQVAC}
                    disabled={isSimulatingOdds}
                    className="px-3 py-1.5 text-[10px] font-black rounded-lg text-black bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 border border-yellow-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    style={{
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 0 rgba(0, 0, 0, 0.15)"
                    }}
                  >
                    {isSimulatingOdds ? (
                      <>
                        <Activity className="w-3 h-3 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      "Inference Rules"
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Probabilitas YES:</span>
                    <span className="text-yellow-400 font-bold">{probYes}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={probYes}
                    disabled
                    onChange={(e) => setProbYes(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none pointer-events-none opacity-80 accent-yellow-500"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                    <div className="text-center p-3 rounded-2xl bg-yellow-500/5 border border-yellow-500/15">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-yellow-400" />
                        <p className="text-[9px] text-yellow-500 font-extrabold uppercase tracking-wide">
                          Odds YES
                        </p>
                      </div>
                      <p className="text-xl font-black text-yellow-400 font-mono">
                        {qvacOddsYes.toFixed(2)}x
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-zinc-400" />
                        <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide">
                          Odds NO
                        </p>
                      </div>
                      <p className="text-xl font-black text-zinc-300 font-mono">
                        {qvacOddsNo.toFixed(2)}x
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stake & Wallet */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    Jaminan Bandar
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="5"
                      value={bandarStake}
                      onChange={(e) => setBandarStake(e.target.value)}
                      onBlur={() => {
                        if (Number(bandarStake) < 5 || bandarStake === "") {
                          setBandarStake(5);
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 shadow-inner text-xs text-white font-bold font-mono focus:outline-none focus:ring-0"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-500">
                      USDT
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    Wallet Bandar
                  </label>
                  <div className="relative">
                    <div className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 shadow-inner text-[10px] text-zinc-400 font-mono truncate pr-10">
                      {hostAddress}
                    </div>
                    <Wallet className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!tournament || !teamA || !teamB || teamA === teamB || !incidentDesc.trim() || Number(bandarStake) < 5 || bandarStake === ""}
                className="btn-3d-yellow w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                STAKE & SIARKAN PASAR
              </button>
            </form>
          )}

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
                {bets
                  .slice()
                  .reverse()
                  .map((bet) => (
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
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
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

        {/* ═══ SIMULATION PANEL ═══ */}
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-950/95 border-t border-zinc-800/80 px-4 py-3 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Simulation Console
            </span>
            <span className="text-[8px] text-zinc-500 font-mono">P2P Network Mock</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <button
              type="button"
              onClick={simulatePunterBet}
              disabled={!market || market.status !== "OPEN"}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <DollarSign className="w-3 h-3 text-yellow-400" />
              Punter Bet
            </button>
            <button
              type="button"
              onClick={simulateDispute}
              disabled={!market || market.status !== "AWAITING_CONSENSUS"}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3 text-red-500" />
              Dispute
            </button>
            <button
              type="button"
              onClick={simulateConsensus}
              disabled={!market || market.status !== "AWAITING_CONSENSUS"}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Consensus OK
            </button>
            {market?.status === "DISPUTED_FROZEN" ? (
              <div className="col-span-2 grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800 mt-1">
                <button
                  type="button"
                  onClick={() => simulateOracle("YES")}
                  className="py-1.5 px-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Globe className="w-3 h-3 animate-spin" /> Oracle: YES
                </button>
                <button
                  type="button"
                  onClick={() => simulateOracle("NO")}
                  className="py-1.5 px-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Globe className="w-3 h-3 animate-spin" /> Oracle: NO
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled
                className="py-1.5 px-2 bg-zinc-950 border border-zinc-900/40 rounded-xl text-zinc-700 font-semibold cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Globe className="w-3 h-3" />
                Oracle Inactive
              </button>
            )}

            {/* DEV: Force Timeout */}
            <button
              type="button"
              onClick={() => {
                if (market?.status === "FROZEN_BETTING") {
                  disputeMarket();
                  logMessage("[DEV] Force 10m Timeout triggered → DISPUTED_FROZEN.");
                }
              }}
              disabled={!market || market.status !== "FROZEN_BETTING"}
              className="col-span-2 py-1.5 px-2 bg-yellow-500/10 hover:bg-yellow-500/20 disabled:opacity-30 border border-yellow-500/30 rounded-xl text-yellow-400 font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3" />
              Dev: Force 10m Timeout (DISPUTE)
            </button>
          </div>
        </div>
      </div>
  );
}
