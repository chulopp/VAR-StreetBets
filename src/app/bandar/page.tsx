"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useMarketStore } from "@/store/marketStore";
import {
  ArrowLeft,
  Crown,
  Flame,
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  WifiOff,
  Users,
  DollarSign,
  Cpu,
  Wallet,
  Clock,
  Terminal,
  Globe,
  ChevronDown,
  Hash,
  Sparkles,
} from "lucide-react";

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

const INSPIRATION_TAGS = [
  { tag: "#LastMan", text: "Tackle pemain bertahan terakhir " },
  { tag: "#Handball", text: "Handball di dalam kotak penalti " },
  { tag: "#ShirtPull", text: "Tarikan baju striker di dalam kotak " },
  { tag: "#Offside", text: "Posisi offside yang sangat tipis " },
  { tag: "#DivePenalty", text: "Diving di dalam kotak penalti " },
  { tag: "#Elbow", text: "Sikutan pada lawan " },
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

  // Form state
  const [tournament, setTournament] = useState("");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [probYes, setProbYes] = useState(60);
  const [bandarStake, setBandarStake] = useState(10);
  const [hostAddress] = useState("0xWDK_Host_0xcHu1o");

  // Timer states
  const [timeLeft, setTimeLeft] = useState("02:00");
  const [isLowTime, setIsLowTime] = useState(false);

  // Internet Sync UI
  const [showOracleBanner, setShowOracleBanner] = useState(false);

  // Simulation
  const [isSimulatingOdds, setIsSimulatingOdds] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "[SYSTEM] Node started offline mesh mode.",
    "[PEARS] Offline mesh network initialized via Wi-Fi Local.",
    '[WDK] Host wallet initialized: 0xWDK_Host_0xcHu1o (Balance: 120.00 USDT)',
  ]);

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
      const remaining = Math.max(0, 120000 - elapsed); // 2 minutes (120000 ms)
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      setTimeLeft(formattedTime);
      setIsLowTime(remaining < 30000); // Under 30s turns red and blinks
    }, 500);
    return () => clearInterval(interval);
  }, [market]);

  const logMessage = (msg: string) => {
    setConsoleLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
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
      bandarStake,
      hostAddress
    );
    logMessage(`[WDK] Staking escrow: Locked ${bandarStake} USDT as Bandar Guarantee.`);
    logMessage(`[PEARS] Broadcasted New Market: ${marketId} - "${matchName}"`);
  };

  const handleFreezeMarket = () => {
    freezeMarket();
    logMessage("[PEARS] Broadcasted STOP TARUHAN. Betting locked for all Punters!");
    logMessage("[SYSTEM] Anti-frontrunning protection active.");
  };

  const handleResolveMarket = (outcome: "YES" | "NO") => {
    resolveMarket(outcome);
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
    setShowOracleBanner(true);
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
      setTimeout(() => setShowOracleBanner(false), 5000);
    }, 1500);
  };

  const handleTagClick = (text: string) => {
    setIncidentDesc((prev) => prev + text);
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
    <div className="max-w-md mx-auto w-full min-h-screen px-4 py-6 flex flex-col relative pb-48">
      {/* Header */}
      <header className="py-3.5 bg-black/60 backdrop-blur-md border-b border-zinc-800/40 flex justify-between items-center z-10 mb-6 rounded-2xl px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 hover:bg-zinc-800/80 rounded-xl text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.25)]">
              <Crown className="w-4 h-4 text-black" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-yellow-400 uppercase">
                Bandar Console
              </h1>
              <p className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
                Host Mode Active
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={resetStore}
          className="p-1.5 hover:bg-zinc-800/80 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Reset Store"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </header>

      {/* Oracle Sync Banner */}
      {showOracleBanner && (
        <div className="bg-emerald-500 text-black px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 animate-bounce z-30 shadow-md mb-4 rounded-xl">
          <Globe className="w-4 h-4 animate-spin" />
          <span>Internet Restored: Oracle API Confirmed Result</span>
        </div>
      )}

      {/* Content Container */}
      <div className="flex-1 space-y-5 pb-8">
          {market ? (
            /* ═══ ACTIVE MARKET VIEW ═══ */
            <div className="space-y-4">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-3xl border backdrop-blur-sm transition-all duration-300 ${
                  market.status === "OPEN"
                    ? "bg-emerald-950/15 border-emerald-500/25 text-emerald-300"
                    : market.status === "FROZEN_BETTING"
                      ? "bg-red-950/15 border-red-500/25 text-red-300"
                      : market.status === "AWAITING_CONSENSUS"
                        ? "bg-yellow-950/15 border-yellow-500/25 text-yellow-300"
                        : market.status === "DISPUTED_FROZEN"
                          ? "bg-red-950/20 border-red-500/30 text-red-300"
                          : "bg-zinc-900/40 border-zinc-800 text-zinc-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider">Status Pasar</span>
                  <div className="flex items-center gap-3">
                    {market.status === "OPEN" && (
                      <div className={`flex items-center gap-1 text-xs font-mono font-bold ${isLowTime ? "text-red-500 animate-pulse font-black" : "text-yellow-400"}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{timeLeft}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          market.status === "OPEN"
                            ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"
                            : market.status === "FROZEN_BETTING"
                              ? "bg-red-500 shadow-[0_0_8px_#ef4444]"
                              : market.status === "AWAITING_CONSENSUS"
                                ? "bg-yellow-400 animate-bounce"
                                : market.status === "DISPUTED_FROZEN"
                                  ? "bg-red-500 animate-ping"
                                  : "bg-zinc-500"
                        }`}
                      />
                      <span className="text-xs font-black uppercase">
                        {market.status === "OPEN"
                          ? "Terbuka"
                          : market.status === "FROZEN_BETTING"
                            ? "Kunci Taruhan"
                            : market.status === "AWAITING_CONSENSUS"
                              ? "Konsensus"
                              : market.status === "DISPUTED_FROZEN"
                                ? "Sengketa"
                                : "Selesai"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">
                    {market.match_info.tournament} • {market.match_info.match}
                  </p>
                  <h3 className="text-sm font-extrabold text-white leading-snug">
                    {market.incident_description}
                  </h3>
                  <p className="text-[10px] text-zinc-600 font-mono">ID: {market.market_id}</p>
                </div>
              </div>

              {/* STOP TARUHAN (KUNCI PASAR) BUTTON */}
              {market.status === "OPEN" && (
                <button
                  onClick={handleFreezeMarket}
                  className="btn-3d-danger w-full py-5 rounded-2xl text-base tracking-wider uppercase flex items-center justify-center gap-2 animate-pulse cursor-pointer font-black"
                >
                  <Flame className="w-5 h-5 fill-white animate-bounce" />
                  STOP TARUHAN (KUNCI PASAR)
                </button>
              )}

              {/* Pool Visualizer */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-zinc-400">
                    Distribusi Taruhan ({bets.length} Petaruh)
                  </h4>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    Pool:{" "}
                    <span className="text-yellow-400 font-bold">{market.total_pool} USDT</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="h-3 w-full rounded-full overflow-hidden bg-zinc-800 flex">
                    <div
                      style={{ width: `${yesPercent}%` }}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full transition-all duration-500"
                    />
                    <div
                      style={{ width: `${noPercent}%` }}
                      className="bg-gradient-to-l from-zinc-500 to-zinc-600 h-full transition-all duration-500"
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-yellow-400">
                      YES: {yesPercent.toFixed(0)}%{" "}
                      <span className="text-[10px] text-zinc-500 font-normal">
                        ({yesBetsSum} USDT)
                      </span>
                    </span>
                    <span className="text-zinc-400">
                      <span className="text-[10px] text-zinc-500 font-normal">
                        ({noBetsSum} USDT)
                      </span>{" "}
                      NO: {noPercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Odds & Stake Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-3">
                  <span className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">
                    QVAC Odds AI
                  </span>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-yellow-400 font-bold">YES</span>
                      <span className="text-white font-mono">
                        {market.qvac_odds.YES.toFixed(2)}x
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400 font-bold">NO</span>
                      <span className="text-white font-mono">
                        {market.qvac_odds.NO.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-3">
                  <span className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">
                    Host Stake
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl font-black text-yellow-400 font-mono">
                      {market.bandar_stake}
                    </span>
                    <span className="text-[10px] text-zinc-500">USDT</span>
                  </div>
                  <span className="text-[8px] text-zinc-600 truncate block">
                    {market.creator_pubkey}
                  </span>
                </div>
              </div>

              {/* Resolution Panel */}
              {market.status === "FROZEN_BETTING" && (
                <div className="bg-zinc-900 border border-red-900/30 rounded-3xl p-4 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Input Hasil Resmi
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Masukkan keputusan wasit TV untuk memulai konsensus lokal.
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
                      className="btn-3d-dark py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Set Hasil: NO
                    </button>
                  </div>
                </div>
              )}

              {/* Consensus Indicator */}
              {market.status === "AWAITING_CONSENSUS" && (
                <div className="bg-zinc-900 border border-yellow-900/30 rounded-3xl p-4 text-center space-y-2">
                  <Users className="w-6 h-6 text-yellow-400 animate-bounce mx-auto" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Menunggu Konsensus Petaruh
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    Bandar input hasil{" "}
                    <span className="text-yellow-400 font-bold">
                      &quot;{market.resolution_outcome}&quot;
                    </span>
                    . Petaruh memiliki 60 detik.
                  </p>
                </div>
              )}

              {/* Closed State & Profit Card */}
              {market.status === "CLOSED" && (
                <div className="space-y-3">
                  <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-4 text-center space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Pasar Ditutup
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      Hasil:{" "}
                      <span className="text-emerald-400 font-bold">{market.resolution_outcome}</span>.
                      Dana telah didistribusikan.
                    </p>
                  </div>

                  {/* Profit Card */}
                  <div className="bg-gradient-to-br from-yellow-500/10 to-emerald-500/10 border border-yellow-500/30 rounded-3xl p-4 flex flex-col items-center justify-center text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Profit Bandar (Spread/Fee)
                    </span>
                    <span className="text-lg font-black text-yellow-400">
                      +{(totalPunterBets * 0.1).toFixed(1)} USDT
                    </span>
                    <span className="text-[9px] text-zinc-500 font-semibold">
                      (10% Spread Fee Terkumpul P2P)
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ═══ CREATION FORM ═══ */
            <form onSubmit={handleOpenMarket} className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Buka Pasar Taruhan Baru
                </h2>
              </div>

              {/* Tournament Select */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Pilih Turnamen
                </label>
                <div className="relative">
                  <select
                    required
                    value={tournament}
                    onChange={(e) => setTournament(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm text-white font-semibold focus:outline-none focus:border-yellow-500/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Pilih turnamen...
                    </option>
                    {Object.keys(TOURNAMENT_DATA).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Chained Dropdown Tim A */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Pilih Tim A
                </label>
                <div className="relative">
                  <select
                    required
                    value={teamA}
                    onChange={(e) => setTeamA(e.target.value)}
                    disabled={!tournament}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm text-white font-semibold focus:outline-none focus:border-yellow-500/50 transition-colors appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>
                      {tournament ? "Pilih Tim A..." : "Pilih turnamen dahulu..."}
                    </option>
                    {availableTeams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Chained Dropdown Tim B */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Pilih Tim B
                </label>
                <div className="relative">
                  <select
                    required
                    value={teamB}
                    onChange={(e) => setTeamB(e.target.value)}
                    disabled={!tournament || !teamA}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm text-white font-semibold focus:outline-none focus:border-yellow-500/50 transition-colors appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>
                      {!tournament ? "Pilih turnamen dahulu..." : !teamA ? "Pilih Tim A dahulu..." : "Pilih Tim B..."}
                    </option>
                    {availableTeams
                      .filter((t) => t !== teamA)
                      .map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Inspiration Tags */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Inspiration Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {INSPIRATION_TAGS.map(({ tag, text }) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(text)}
                      className="tag-chip"
                    >
                      <Hash className="w-3 h-3" />
                      {tag.replace("#", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Incident Description Textarea */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Deskripsi Detail Insiden (Prompt QVAC) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Jelaskan sejelas mungkin agar AI akurat. Contoh: Pemain bertahan terakhir menarik baju striker di dalam kotak penalti saat posisi 1v1 dengan kiper..."
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* QVAC Odds Calculator */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Otak AI Lokal (QVAC SDK)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={runMockQVAC}
                    disabled={isSimulatingOdds}
                    className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 text-[10px] font-black rounded-lg text-black disabled:text-zinc-500 transition-colors active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
                    onChange={(e) => setProbYes(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                    <div className="text-center p-2.5 rounded-2xl bg-black/50 border border-zinc-900">
                      <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wide mb-0.5">
                        Odds YES
                      </p>
                      <p className="text-sm font-black text-yellow-400 font-mono">
                        {qvacOddsYes.toFixed(2)}x
                      </p>
                    </div>
                    <div className="text-center p-2.5 rounded-2xl bg-black/50 border border-zinc-900">
                      <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wide mb-0.5">
                        Odds NO
                      </p>
                      <p className="text-sm font-black text-zinc-300 font-mono">
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
                      onChange={(e) => setBandarStake(Math.max(5, Number(e.target.value)))}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white font-bold font-mono focus:outline-none focus:border-yellow-500/50 transition-colors"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-500">
                      USDT
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    Wallet Host
                  </label>
                  <div className="relative">
                    <div className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono truncate pr-10">
                      {hostAddress}
                    </div>
                    <Wallet className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!tournament || !teamA || !teamB || teamA === teamB || !incidentDesc.trim()}
                className="btn-3d-yellow w-full py-4 rounded-2xl text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                STAKE & SIARKAN PASAR
              </button>
            </form>
          )}

          {/* Bet Transactions */}
          <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-3xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Daftar Taruhan (P2P Mesh)</span>
              <span className="text-[10px] font-mono text-zinc-600">{bets.length} Bets</span>
            </h4>
            {bets.length === 0 ? (
              <div className="py-6 text-center text-zinc-600 text-[11px] border border-dashed border-zinc-800 rounded-2xl">
                Belum ada taruhan masuk dari Punter sekitar.
              </div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {bets
                  .slice()
                  .reverse()
                  .map((bet) => (
                    <div
                      key={bet.bet_id}
                      className="p-2.5 bg-black/50 border border-zinc-800 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-zinc-300 font-mono truncate max-w-[120px]">
                          {bet.punter_pubkey}
                        </p>
                        <p className="text-[9px] text-zinc-600">
                          {new Date(bet.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide ${
                            bet.choice === "YES"
                              ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {bet.choice}
                        </span>
                        <span className="text-xs font-bold text-white font-mono">
                          {bet.amount_usdt} USDT
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Terminal Log */}
          <div className="bg-black border border-zinc-900 rounded-2xl p-3.5 font-mono text-[9px] text-zinc-400 space-y-2">
            <div className="flex items-center justify-between text-zinc-600 border-b border-zinc-900 pb-1.5 mb-1">
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3" /> NODE LOGS
              </span>
              <button
                onClick={() => setConsoleLogs([])}
                className="hover:text-zinc-400 hover:underline transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1 max-h-[80px] overflow-y-auto scrollbar-none">
              {consoleLogs.slice(-10).map((log, i) => (
                <div key={i} className="leading-relaxed truncate hover:text-white transition-colors">
                  {log}
                </div>
              ))}
            </div>
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
          </div>
        </div>
      </div>
  );
}
