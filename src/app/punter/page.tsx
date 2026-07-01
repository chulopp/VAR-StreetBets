"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMarketStore } from "@/store/marketStore";
import { useToastStore } from "@/store/useToastStore";
import {
  ArrowLeft,
  Users,
  Radio,
  Lock,
  AlertTriangle,
  Activity,
  Clock,
  WifiOff,
  Zap,
  DollarSign,
  TrendingUp,
  Shield,
  CheckCircle2,
  Info,
  Copy,
  Gavel,
} from "lucide-react";
import MarketStatusCard from "@/components/MarketStatusCard";
import BetDistributionCard from "@/components/BetDistributionCard";
import UserBetsCard from "@/components/UserBetsCard";
import MarketResultCard from "@/components/MarketResultCard";
import LockedMarketCard from "@/components/LockedMarketCard";

function PunterConsoleInner() {
  const searchParams = useSearchParams();
  const marketIdFromUrl = searchParams.get("id");
  const [mounted, setMounted] = useState(false);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    setMounted(true);
    showToast("Berhasil bergabung ke pasar taruhan.", "success");
  }, [showToast]);

  const { markets, bets: allBets, addBet, emergencyFreeze, addMarket,
          freezeMarketById, disputeMarketById, resolveMarketById, closeMarketById } = useMarketStore();

  // Find market: prefer URL id, then first OPEN market
  const market = marketIdFromUrl
    ? (markets.find((m) => m.market_id === marketIdFromUrl) ?? null)
    : (markets.find((m) => m.status === "OPEN") ?? null);

  // Bets for this market
  const bets = market ? allBets.filter((b) => b.market_id === market.market_id) : [];

  // Form state
  const [betAmount, setBetAmount] = useState(5);
  const [punterAddress] = useState(
    () => `2Brs${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}qTgE`
  );
  const [isMeshHardwareReady, setIsMeshHardwareReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [disputeTimer, setDisputeTimer] = useState(15);
  const [disputePercent, setDisputePercent] = useState(12);



  // Grace period countdown timer & auto-close logic
  useEffect(() => {
    if (!market || market.status !== "GRACE_PERIOD") {
      setDisputeTimer(15);
      return;
    }

    const interval = setInterval(() => {
      let isZero = false;
      setDisputeTimer((prev) => {
        if (prev <= 1) {
          isZero = true;
          return 0;
        }
        return prev - 1;
      });

      if (isZero) {
        clearInterval(interval);
        if (disputePercent < 51) {
          useMarketStore.getState().closeMarket();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [market?.status, disputePercent]);

  // Reset dispute states when market status transitions into GRACE_PERIOD
  useEffect(() => {
    if (market?.status === "GRACE_PERIOD") {
      setDisputeTimer(15);
      setDisputePercent(12);
      showToast("Bandar memasukkan hasil keputusan.", "info");
    }
  }, [market?.status, showToast]);

  // Handle previous status and transitions to CLOSED state
  const prevStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!market) {
      prevStatusRef.current = null;
      return;
    }

    if (market.status === "CLOSED" && prevStatusRef.current && prevStatusRef.current !== "CLOSED") {
      const myBetsCount = bets.filter((b) => b.punter_pubkey === punterAddress).length;
      if (myBetsCount === 0) {
        showToast("Pasar selesai.", "info");
      } else {
        if (prevStatusRef.current === "DISPUTED" || prevStatusRef.current === "DISPUTED_FROZEN") {
          showToast("Oracle API berhasil memverifikasi hasil akhir.", "success");
        } else {
          showToast("Pasar selesai: Hasil diverifikasi Bandar.", "success");
        }
      }
    }

    prevStatusRef.current = market.status;
  }, [market?.status, bets, punterAddress, showToast]);

  const handleDisputeClick = () => {
    setDisputePercent((prev) => {
      const nextPercent = prev + 20;
      if (nextPercent > 51 && market) {
        showToast("Sengketa aktif! Memanggil Oracle API.", "warning");
        setTimeout(() => {
          useMarketStore.getState().disputeMarketById(market.market_id);
        }, 50);
      }
      return nextPercent;
    });
  };

  useEffect(() => {
    if (!market || market.status !== "OPEN") {
      setTimeLeft(60);
      return;
    }

    const interval = setInterval(() => {
      let isZero = false;
      setTimeLeft((prev) => {
        if (prev <= 1) { isZero = true; return 0; }
        return prev - 1;
      });
      if (isZero) {
        clearInterval(interval);
        useMarketStore.getState().freezeMarketById(market.market_id);
        showToast("Waktu taruhan habis. Pasar ditutup sementara.", "warning");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [market?.status, market?.market_id, showToast]);

  // VAR Resolution countdown (10 menit = 600 detik) saat pasar FROZEN
  const [varResolutionTime, setVarResolutionTime] = useState(600);
  const [stopVotePercent, setStopVotePercent] = useState(0);

  useEffect(() => {
    if (!market || market.status !== "FROZEN_BETTING") {
      setVarResolutionTime(600);
      setStopVotePercent(0);
      return;
    }

    const interval = setInterval(() => {
      let isZero = false;
      setVarResolutionTime((prev) => {
        if (prev <= 1) { isZero = true; return 0; }
        return prev - 1;
      });
      if (isZero) {
        clearInterval(interval);
        useMarketStore.getState().disputeMarketById(market.market_id);
        showToast("Waktu input habis! Mengajukan sengketa otomatis.", "warning");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [market?.status, market?.market_id, showToast]);

  const handleStopVoteClick = () => {
    setStopVotePercent((prev) => {
      const next = prev + 22;
      if (next > 51 && market) {
        showToast("Voting >51% terpenuhi! Pasar dikunci oleh jaringan.", "warning");
        setTimeout(() => {
          useMarketStore.getState().disputeMarketById(market.market_id);
        }, 500);
      }
      return Math.min(next, 100);
    });
    console.log("[PEARS] Vote to stop market submitted");
  };

  const handleBet = (choice: "YES" | "NO") => {
    if (!market || market.status !== "OPEN" || betAmount < 1) return;
    addBet(choice, betAmount, punterAddress);
  };

  const handleEmergencyFreeze = () => {
    if (!market || market.status !== "OPEN") return;
    emergencyFreeze();
  };

  // My bets (filtered by punter address AND market id)
  const myBets = bets.filter((b) => b.punter_pubkey === punterAddress);

  // Calculate P&L Scenarios
  const totalYesAmount = myBets.filter((b) => b.choice === "YES").reduce((sum, b) => sum + b.amount_usdt, 0);
  const totalNoAmount = myBets.filter((b) => b.choice === "NO").reduce((sum, b) => sum + b.amount_usdt, 0);
  const oddsYes = market?.qvac_odds?.YES || 1;
  const oddsNo = market?.qvac_odds?.NO || 1;
  const totalCost = totalYesAmount + totalNoAmount;
  const plIfYes = totalYesAmount * oddsYes - totalCost;
  const plIfNo = totalNoAmount * oddsNo - totalCost;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
        <Activity className="animate-spin mr-2 h-5 w-5" /> Inisialisasi Punter Console...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full px-6 pb-6 flex flex-col flex-1">

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
              Punter Console
            </h1>
            <div 
              onClick={() => {
                navigator.clipboard.writeText(punterAddress);
                showToast("Address disalin ke clipboard!", "success");
              }}
              className="flex items-center gap-1.5 mt-0.5 cursor-pointer hover:text-white active:scale-95 transition-all text-zinc-500"
              title="Salin Alamat Wallet"
            >
              <span className="text-[10px] font-mono">
                {punterAddress.slice(0, 4)}...{punterAddress.slice(-4)}
              </span>
              <Copy className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 space-y-5">
        {!market ? (
          /* ═══ SCANNING STATE ═══ */
          <div className="flex flex-col items-center justify-center space-y-8 py-8">
            {/* Radar Animation */}
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* Outer rings */}
              <div className="absolute w-52 h-52 rounded-full border border-yellow-500/10" />
              <div className="absolute w-40 h-40 rounded-full border border-yellow-500/15" />
              <div className="absolute w-28 h-28 rounded-full border border-yellow-500/20" />

              {/* Ping rings */}
              <div className="absolute w-40 h-40 rounded-full border-2 border-yellow-500/20 animate-radar-ping" />
              <div className="absolute w-40 h-40 rounded-full border-2 border-yellow-500/15 animate-radar-ping-delayed" />
              <div className="absolute w-40 h-40 rounded-full border-2 border-yellow-500/10 animate-radar-ping-delayed-2" />

              {/* Sweep line */}
              <div className="absolute w-full h-full animate-radar-sweep">
                <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left bg-gradient-to-r from-yellow-500/60 to-transparent" />
              </div>

              {/* Center dot */}
              <div className="relative z-10 w-5 h-5 rounded-full bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-pulse" />

              {/* Fake scan dots */}
              <div className="absolute top-8 right-12 w-1.5 h-1.5 rounded-full bg-yellow-500/40 animate-dot-blink" />
              <div className="absolute bottom-14 left-10 w-1 h-1 rounded-full bg-yellow-500/30 animate-dot-blink" style={{ animationDelay: "0.7s" }} />
              <div className="absolute top-16 left-14 w-1.5 h-1.5 rounded-full bg-yellow-500/25 animate-dot-blink" style={{ animationDelay: "1.2s" }} />
            </div>

            {/* Scanning Text */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Radio className="w-4 h-4 text-yellow-500 animate-pulse" />
                <span className="text-sm font-bold text-white">Scanning Pears Network...</span>
              </div>
            </div>

            {/* Connection Banner */}
            {!isMeshHardwareReady && (
              <button
                onClick={() => console.log('Triggering Capacitor Native Hardware Access...')}
                className="flex items-center justify-center gap-3 w-full p-4 rounded-2xl bg-gradient-to-b from-yellow-400 to-yellow-600 text-zinc-950 font-bold border border-yellow-300/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_10px_20px_-10px_rgba(234,179,8,0.5)] active:scale-95 hover:brightness-110 cursor-pointer transition-all"
              >
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-sm">Nyalakan Bluetooth & WiFi perangkat</span>
              </button>
            )}

            {/* Info card */}
            <div className="w-full bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-6 space-y-2">
              <div className="flex items-center gap-2 text-yellow-500">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Cara Kerja</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Seorang <span className="text-white font-semibold">Bandar</span> di sekitarmu akan membuka pasar taruhan saat terjadi insiden VAR. Kamu akan otomatis menerima siaran pasar tersebut tanpa internet
              </p>
            </div>

            {/* Dev Testing Controls */}
            <div className="w-full flex gap-2">
              <button
                onClick={() => {
                  addMarket(
                    "DEV_MARKET_DUMMY",
                    { tournament: "🌍 World Cup 2026", match: "ENG vs ESP" },
                    "PENALTY_CHECK",
                    "Handsball di kotak penalti",
                    { YES: 3.0, NO: 1.5 },
                    10,
                    "0xWDK_Pub_Key_Bandar_Dummy"
                  );
                }}
                className="flex-1 py-3 rounded-2xl border border-dashed border-yellow-500/30 hover:border-yellow-500/60 bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-500 text-xs font-black tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🛠️ Force Open Market</span>
              </button>
              <button
                onClick={() => setIsMeshHardwareReady((prev) => !prev)}
                className="flex-1 py-3 rounded-2xl border border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-900/40 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 text-xs font-black tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🛜 Toggle Hardware (Mock)</span>
              </button>
            </div>
          </div>
        ) : market.status === "OPEN" ? (
          /* ═══ OPEN STATE — BET FORM ═══ */
          <div className="space-y-5">
            {/* Market Status Card — Reusable Component */}
            <MarketStatusCard
              title="STATUS PASAR"
              tournament={market.match_info.tournament}
              match={market.match_info.match}
              incidentDescription={market.incident_description}
              marketId={market.market_id}
              oddsYes={market.qvac_odds.YES}
              oddsNo={market.qvac_odds.NO}
              totalPool={market.total_pool}
              bandarStake={market.bandar_stake}
              timeLeftSeconds={timeLeft}
              status="OPEN"
            />

            {/* Bet Distribution Card */}
            {(() => {
              const yesSum = bets.filter(b => b.choice === "YES").reduce((a, b) => a + b.amount_usdt, 0);
              const noSum = bets.filter(b => b.choice === "NO").reduce((a, b) => a + b.amount_usdt, 0);
              const total = yesSum + noSum;
              return (
                <BetDistributionCard
                  totalPunters={bets.length}
                  totalPool={market.total_pool}
                  yesPercentage={total > 0 ? (yesSum / total) * 100 : 50}
                  noPercentage={total > 0 ? (noSum / total) * 100 : 50}
                  yesPool={yesSum}
                  noPool={noSum}
                />
              );
            })()}

            {/* Bet Form */}
            <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Pasang Taruhan
                </h4>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Nominal Taruhan (USDT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-4 rounded-2xl bg-black border border-zinc-800 text-2xl text-white font-black font-mono focus:outline-none focus:border-yellow-500/50 transition-colors text-center"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                    USDT
                  </span>
                </div>
                {/* Quick amounts */}
                <div className="flex gap-2">
                  {[5, 10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBetAmount(amt)}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        betAmount === amt
                          ? "bg-yellow-500/15 border border-yellow-500/30 text-yellow-400"
                          : "bg-zinc-800/50 border border-zinc-800 text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bet Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => handleBet("YES")}
                  className="btn-3d-yellow py-4 rounded-2xl text-sm uppercase tracking-wider flex flex-col items-center gap-0.5 cursor-pointer"
                >
                  <span className="font-black">BET YES</span>
                  <span className="text-[9px] font-semibold opacity-70">
                    Win {(betAmount * market.qvac_odds.YES).toFixed(1)} USDT
                  </span>
                </button>
                <button
                  onClick={() => handleBet("NO")}
                  className="py-4 rounded-2xl text-sm font-black uppercase tracking-wider flex flex-col items-center justify-center gap-0.5 cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-950 hover:from-zinc-700 hover:to-zinc-900 text-zinc-350 hover:text-white border border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all active:scale-95 active:translate-y-[1px]"
                >
                  <span>BET NO</span>
                  <span className="text-[9px] font-semibold opacity-70 text-zinc-400">
                    Win {(betAmount * market.qvac_odds.NO).toFixed(1)} USDT
                  </span>
                </button>
              </div>
            </div>

            {/* My Bets */}
            <UserBetsCard
              bets={myBets.map((b) => ({
                id: b.bet_id,
                type: b.choice,
                amount: b.amount_usdt,
                timestamp: b.timestamp.toString(),
              }))}
              potentialWinYes={plIfYes}
              potentialLossNo={plIfNo}
            />

          </div>
        ) : market.status === "GRACE_PERIOD" ? (
          /* ═══ GRACE PERIOD — MASA SANGGAH ═══ */
          <div className="space-y-5">
            <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-6 space-y-5 text-center">
              {/* Header Kotak */}
              <div className="flex items-center justify-center gap-2 text-yellow-500">
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-500">
                  MASA SANGGAH ({disputeTimer}S)
                </h4>
              </div>

              {/* Konten Kotak */}
              <div className="bg-black/40 border border-zinc-800/60 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">
                  Keputusan Bandar
                </span>
                <h2 className="text-3xl font-extrabold text-yellow-500 font-mono tracking-wide">
                  {market.resolution_outcome || "YES"}
                </h2>
              </div>

              {/* Deskripsi */}
              <p className="text-xs text-zinc-400 leading-relaxed max-w-[280px] mx-auto">
                Jika keputusan ini salah atau tidak sesuai dengan hasil resmi VAR, tekan tombol sengketa di bawah sebelum waktu habis.
              </p>

              {myBets.length > 0 ? (
                /* PARTISIPAN: tampilkan progress bar & tombol sengketa */
                <>
                  {/* Live Estimator Sengketa */}
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Sengketa Aktif</span>
                      <span className="text-red-400 font-bold">
                        {disputePercent}% <span className="text-zinc-500 font-normal">(Butuh &gt;51%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: `${disputePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Tombol Sengketa - 3D solid merah */}
                  <button
                    onClick={handleDisputeClick}
                    className="w-full bg-gradient-to-b from-red-600 to-red-800 border border-red-500/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_15px_rgba(220,38,38,0.5)] text-white font-bold rounded-xl py-3 active:scale-95 transition-all uppercase tracking-wider text-xs cursor-pointer"
                  >
                    SENGKETAKAN HASIL
                  </button>
                </>
              ) : (
                /* NON-PARTISIPAN: tampilkan teks pengganti */
                <p className="text-[11px] text-zinc-500 italic text-center mt-2">
                  Menunggu validasi hasil oleh para petaruh aktif...
                </p>
              )}
            </div>

            {/* Market Status Card - GRACE_PERIOD */}
            <MarketStatusCard
              title="STATUS PASAR"
              tournament={market.match_info.tournament}
              match={market.match_info.match}
              incidentDescription={market.incident_description}
              marketId={market.market_id}
              oddsYes={market.qvac_odds.YES}
              oddsNo={market.qvac_odds.NO}
              totalPool={market.total_pool}
              bandarStake={market.bandar_stake}
              timeLeftSeconds={null}
              status={market.status as any}
              statusText="MASA SANGGAH"
              statusColor="text-yellow-500"
            />

            {/* Bet Distribution Card */}
            {(() => {
              const yesSum = bets.filter(b => b.choice === "YES").reduce((a, b) => a + b.amount_usdt, 0);
              const noSum = bets.filter(b => b.choice === "NO").reduce((a, b) => a + b.amount_usdt, 0);
              const total = yesSum + noSum;
              return (
                <BetDistributionCard
                  totalPunters={bets.length}
                  totalPool={market.total_pool}
                  yesPercentage={total > 0 ? (yesSum / total) * 100 : 50}
                  noPercentage={total > 0 ? (noSum / total) * 100 : 50}
                  yesPool={yesSum}
                  noPool={noSum}
                />
              );
            })()}

            {/* User Bets */}
            <UserBetsCard
              bets={myBets.map((b) => ({
                id: b.bet_id,
                type: b.choice,
                amount: b.amount_usdt,
                timestamp: b.timestamp.toString(),
              }))}
              potentialWinYes={plIfYes}
              potentialLossNo={plIfNo}
            />

          </div>
        ) : market.status === "CLOSED" ? (
          /* ═══ CLOSED STATE — RESULT & P&L ═══ */
          <div className="space-y-6">
            {(() => {
              const winAmount = myBets
                .filter(b => b.choice === market.resolution_outcome)
                .reduce((sum, b) => sum + (b.amount_usdt * (b.choice === "YES" ? market.qvac_odds.YES : market.qvac_odds.NO) - b.amount_usdt), 0);
              const loseAmount = myBets
                .filter(b => b.choice !== market.resolution_outcome)
                .reduce((sum, b) => sum + b.amount_usdt, 0);
              const netPL = winAmount - loseAmount;
              const isWin = netPL >= 0;
              
              const matchParts = market.match_info.match.split(" vs ");
              const teamA = matchParts[0] || "";
              const teamB = matchParts[1] || "";
              
              return (
                <MarketResultCard
                  tournament={market.match_info.tournament}
                  teamA={teamA}
                  teamB={teamB}
                  incident={market.incident_description}
                  finalResult={market.resolution_outcome as 'YES' | 'NO'}
                  pnlAmount={netPL}
                  statusText={isWin ? "BERHASIL (WIN)" : "GAGAL (LOSS)"}
                  estimatedBalance={100 + netPL}
                  descriptionText={`Berdasarkan ${myBets.length} taruhan yang Anda pasang.`}
                  showPnL={myBets.length > 0}
                />
              );
            })()}

            {/* Market Status Card - CLOSED */}
            <MarketStatusCard
              title="STATUS PASAR"
              tournament={market.match_info.tournament}
              match={market.match_info.match}
              incidentDescription={market.incident_description}
              marketId={market.market_id}
              oddsYes={market.qvac_odds.YES}
              oddsNo={market.qvac_odds.NO}
              totalPool={market.total_pool}
              bandarStake={market.bandar_stake}
              timeLeftSeconds={null}
              status={market.status as any}
              statusText="SELESAI"
              statusColor="text-zinc-500"
            />

            {/* Reset / Back to lobby */}
            <button
              onClick={() => {
                useMarketStore.getState().resetStore();
              }}
              className="w-full bg-zinc-900/50 backdrop-blur-2xl border border-white/5 text-white font-bold rounded-xl py-3 text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.4)] transition-all active:scale-95 active:translate-y-[1px]"
            >
              Kembali ke Pemindaian (Scan)
            </button>
          </div>
        ) : (
          /* ═══ FROZEN STATE / CONSENSUS ═══ */
          <div className="space-y-5">
            {/* Frozen Banner */}
            <LockedMarketCard status={market.status as any} resolutionOutcome={market.resolution_outcome ?? undefined} />

            {/* VAR Voting Stop (hanya saat FROZEN_BETTING) */}
            {market.status === "FROZEN_BETTING" && (
              <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-5 space-y-4">
                {/* Progress Bar Voting */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Voting Stop Pasar</span>
                    <span className="text-red-400 font-bold">
                      {stopVotePercent}% <span className="text-zinc-500 font-normal">(Butuh &gt;51%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        stopVotePercent > 51 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${stopVotePercent}%` }}
                    />
                  </div>
                </div>

                {/* Tombol STOP & KUNCI PASAR */}
                <button
                  onClick={handleStopVoteClick}
                  disabled={stopVotePercent >= 100}
                  className="w-full bg-gradient-to-b from-red-600 to-red-800 border border-red-500/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_10px_rgba(0,0,0,0.5)] text-white font-bold rounded-xl py-3 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <AlertTriangle className="w-4 h-4" />
                  STOP &amp; KUNCI PASAR (VAR KELUAR)
                </button>
              </div>
            )}

            {/* Market Status Card — Reusable Component (Frozen/Locked) */}
            <MarketStatusCard
              title="STATUS PASAR"
              tournament={market.match_info.tournament}
              match={market.match_info.match}
              incidentDescription={market.incident_description}
              marketId={market.market_id}
              oddsYes={market.qvac_odds.YES}
              oddsNo={market.qvac_odds.NO}
              totalPool={market.total_pool}
              bandarStake={market.bandar_stake}
              timeLeftSeconds={market.status === "FROZEN_BETTING" ? varResolutionTime : null}
              status={market.status as any}
              statusText={market.status === "DISPUTED_FROZEN" ? "SENGKETA" : undefined}
              statusColor={market.status === "DISPUTED_FROZEN" ? "text-yellow-500" : undefined}
            />

            {/* Bet Distribution Card */}
            {(() => {
              const yesSum = bets.filter(b => b.choice === "YES").reduce((a, b) => a + b.amount_usdt, 0);
              const noSum = bets.filter(b => b.choice === "NO").reduce((a, b) => a + b.amount_usdt, 0);
              const total = yesSum + noSum;
              return (
                <BetDistributionCard
                  totalPunters={bets.length}
                  totalPool={market.total_pool}
                  yesPercentage={total > 0 ? (yesSum / total) * 100 : 50}
                  noPercentage={total > 0 ? (noSum / total) * 100 : 50}
                  yesPool={yesSum}
                  noPool={noSum}
                />
              );
            })()}

            {/* My Bets */}
            {myBets.length > 0 && (
              <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-6 space-y-3.5">
                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Taruhan Kamu</span>
                  <span className="text-zinc-650 font-mono">{myBets.length} bets</span>
                </h4>
                <div className="space-y-2 max-h-[120px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {myBets
                    .slice()
                    .reverse()
                    .map((bet) => (
                      <div
                        key={bet.bet_id}
                        className="flex items-center justify-between p-2.5 bg-black/50 rounded-2xl border border-zinc-800"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              bet.choice === "YES"
                                ? "bg-yellow-500 text-zinc-950 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md"
                                : "bg-zinc-700 text-zinc-300 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md"
                            }
                          >
                            {bet.choice}
                          </span>
                          <span className="text-[9px] text-zinc-605">
                            {new Date(bet.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-white font-mono">
                          {bet.amount_usdt} USDT
                        </span>
                      </div>
                    ))}
                </div>

                {/* Estimasi P&L (Total) */}
                <div className="flex items-center justify-between p-3 mt-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                  {/* Elemen Kiri (YES) */}
                  <div className="flex items-center gap-2">
                    <span className="bg-yellow-500 text-zinc-950 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md">
                      YES
                    </span>
                    <span className={`text-sm font-bold font-mono ${plIfYes >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {plIfYes >= 0 ? '+' : ''}{plIfYes.toFixed(2)} USDT
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-5 bg-zinc-700/50"></div>

                  {/* Elemen Kanan (NO) */}
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-700 text-zinc-300 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md">
                      NO
                    </span>
                    <span className={`text-sm font-bold font-mono ${plIfNo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {plIfNo >= 0 ? '+' : ''}{plIfNo.toFixed(2)} USDT
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dev Tools Footer for testing */}
      {market && (
        <div className="mt-8 pt-4 border-t border-dashed border-zinc-850 space-y-2 z-20">
          <p className="text-[9px] text-zinc-650 font-mono tracking-wider uppercase text-center">
            Dev Testing Controls
          </p>
          <div className="grid grid-cols-2 gap-2">
            {market.status !== "CLOSED" && (
              <>
                <button
                  onClick={() => {
                    if (market) {
                      useMarketStore.getState().resolveMarketById(market.market_id, "YES");
                      useMarketStore.getState().closeMarketById(market.market_id);
                    }
                  }}
                  className="py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-[10px] text-yellow-500 font-bold tracking-wider cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  🛠️ Dev: Force Close
                </button>
                <button
                  onClick={() => {
                    useMarketStore.getState().freezeMarketById(market.market_id);
                  }}
                  className="py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-[10px] text-blue-400 font-bold tracking-wider cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  🛠️ Dev: Force Lock (FROZEN)
                </button>
                <button
                  onClick={() => {
                    useMarketStore.getState().updateMarketStatus(market.market_id, 'GRACE_PERIOD');
                    useMarketStore.getState().resolveMarketById(market.market_id, 'YES');
                  }}
                  className="py-2.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl text-[10px] text-orange-400 font-bold tracking-wider cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  🛠️ Dev: Input Bandar (GRACE_PERIOD)
                </button>
                <button
                  onClick={() => {
                    if (market) {
                      useMarketStore.getState().resolveMarketById(market.market_id, "YES");
                      useMarketStore.getState().closeMarketById(market.market_id);
                    }
                  }}
                  className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-[10px] text-emerald-400 font-bold tracking-wider cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  🛠️ Dev: Oracle Resolve (WIN)
                </button>
              </>
            )}
            <button
              onClick={() => {
                useMarketStore.getState().resetStore();
              }}
              className="py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-[10px] text-red-500 font-bold tracking-wider cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
            >
              Reset Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap in Suspense required for useSearchParams
export default function PunterConsolePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 items-center justify-center text-zinc-400">
        <Activity className="animate-spin mr-2 h-5 w-5" /> Inisialisasi Punter Console...
      </div>
    }>
      <PunterConsoleInner />
    </Suspense>
  );
}
