"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMarketStore } from "@/store/marketStore";
import { useToastStore } from "@/store/useToastStore";
import {
  ArrowLeft,
  Users,
  AlertTriangle,
  Activity,
  DollarSign,
  Shield,
  CheckCircle2,
  Copy,
} from "lucide-react";
import MarketStatusCard from "@/components/MarketStatusCard";
import BetDistributionCard from "@/components/BetDistributionCard";
import UserBetsCard from "@/components/UserBetsCard";
import MarketResultCard from "@/components/MarketResultCard";
import LockedMarketCard from "@/components/LockedMarketCard";

// ─── Inner (needs searchParams) ────────────────────────────────────────────
function PunterConsoleInner() {
  const searchParams = useSearchParams();
  const marketIdFromUrl = searchParams.get("id");

  const [mounted, setMounted] = useState(false);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    setMounted(true);
    showToast("Joined market.", "success");
  }, [showToast]);

  const {
    markets,
    bets: allBets,
    addBet,
    emergencyFreeze,
    freezeMarketById,
    disputeMarketById,
    resolveMarketById,
    closeMarketById,
    punterAddress,
  } = useMarketStore();

  // Find market by URL id
  const market = marketIdFromUrl
    ? (markets.find((m) => m.market_id === marketIdFromUrl) ?? null)
    : (markets.find((m) => m.status === "OPEN") ?? null);

  // Bets for this market
  const bets = market ? allBets.filter((b) => b.market_id === market.market_id) : [];

  const [betAmount, setBetAmount] = useState(5);
  const hasBet = market ? bets.some((b) => b.market_id === market.market_id && b.punter_pubkey === punterAddress) : false;
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [disputeTimer, setDisputeTimer] = useState<number>(0);
  const [disputePercent, setDisputePercent] = useState(0);
  const [stopVotePercent, setStopVotePercent] = useState(0);
  const [varResolutionTime, setVarResolutionTime] = useState<number>(0);
  const [consensusTimeLeft, setConsensusTimeLeft] = useState<number>(0);

  // Grace period countdown & auto-close
  useEffect(() => {
    if (!market || market.status !== "GRACE_PERIOD") {
      setDisputeTimer(0);
      return;
    }
    if (!market.grace_period_at) return;
    const tick = () => {
      const remainingGrace = Math.max(0, Math.ceil((15_000 - (Date.now() - market.grace_period_at!)) / 1000));
      setDisputeTimer(remainingGrace);
      if (remainingGrace <= 0) {
        clearInterval(interval);
        if (disputePercent < 51) {
          useMarketStore.getState().closeMarket();
        }
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [market?.status, market?.grace_period_at, disputePercent]);

  // Reset dispute states when entering GRACE_PERIOD
  useEffect(() => {
    if (market?.status === "GRACE_PERIOD") {
      setDisputePercent(0);
    }
  }, [market?.status]);

  // ─── STATE TRANSITION MONITOR (TOAST LOGIC) ───
  const prevStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!market) {
      prevStatusRef.current = null;
      return;
    }

    const prev = prevStatusRef.current;
    const curr = market.status;

    // Trigger dari OPEN ke FROZEN_BETTING (Waktu taruhan habis / stop manual)
    if (prev === 'OPEN' && curr === 'FROZEN_BETTING') {
      showToast("Time's up. Market frozen.", "warning");
    }
    
    // Trigger dari FROZEN_BETTING ke AWAITING_CONSENSUS / GRACE_PERIOD
    if (prev === 'FROZEN_BETTING' && (curr === 'AWAITING_CONSENSUS' || curr === 'GRACE_PERIOD')) {
      showToast("Input received. Consensus started.", "info");
    }

    // Trigger saat SENGKETA diajukan
    if (prev !== 'DISPUTED' && prev !== 'DISPUTED_FROZEN' && (curr === 'DISPUTED' || curr === 'DISPUTED_FROZEN')) {
      showToast("Dispute raised! Market frozen.", "warning");
    }

    // Trigger saat pasar ditutup dengan sukses
    if (prev !== 'CLOSED' && curr === 'CLOSED') {
      const myBetsCount = bets.filter((b) => b.punter_pubkey === punterAddress).length;
      if (myBetsCount === 0) {
        showToast("Market closed.", "info");
      } else {
        if (prev === "DISPUTED" || prev === "DISPUTED_FROZEN") {
          showToast("Market closed.", "success");
        } else {
          showToast("Market closed.", "success");
        }
      }
    }

    // Update reference untuk render berikutnya
    prevStatusRef.current = curr;
  }, [market?.status, bets, punterAddress, showToast]);

  // OPEN countdown → FROZEN
  useEffect(() => {
    if (!market || market.status !== "OPEN") {
      setTimeLeft(0);
      return;
    }
    const tick = () => {
      const remainingOpen = Math.max(0, Math.ceil((60_000 - (Date.now() - market.created_timestamp)) / 1000));
      setTimeLeft(remainingOpen);
      if (remainingOpen <= 0) {
        clearInterval(interval);
        useMarketStore.getState().freezeMarketById(market.market_id);
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [market?.status, market?.created_timestamp, market?.market_id, showToast]);

  // FROZEN countdown → DISPUTE
  useEffect(() => {
    if (!market || market.status !== "FROZEN_BETTING") {
      setVarResolutionTime(0);
      setStopVotePercent(0);
      return;
    }
    if (!market.frozen_at) return;
    const tick = () => {
      const remainingFrozen = Math.max(0, Math.ceil((600_000 - (Date.now() - market.frozen_at!)) / 1000));
      setVarResolutionTime(remainingFrozen);
      if (remainingFrozen <= 0) {
        clearInterval(interval);
        useMarketStore.getState().disputeMarketById(market.market_id);
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [market?.status, market?.frozen_at, market?.market_id, showToast]);

  // AWAITING_CONSENSUS countdown
  useEffect(() => {
    if (!market || market.status !== "AWAITING_CONSENSUS") {
      setConsensusTimeLeft(0);
      return;
    }
    if (!market.resolved_at) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((15_000 - (Date.now() - market.resolved_at!)) / 1000));
      setConsensusTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        useMarketStore.getState().closeMarketById(market.market_id);
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [market?.status, market?.resolved_at, market?.market_id]);

  // Handlers
  const handleDisputeClick = () => {
    if (!hasBet) {
      showToast("Access denied: No active bet.", "warning");
      return;
    }
    setDisputePercent((prev) => {
      const nextPercent = prev + 20;
      if (nextPercent > 51 && market) {
        showToast("Dispute active! Calling Oracle.", "warning");
        setTimeout(() => {
          useMarketStore.getState().disputeMarketById(market.market_id);
        }, 50);
      }
      return nextPercent;
    });
  };

  const handleStopVoteClick = () => {
    if (!hasBet) {
      showToast("Access denied: No active bet.", "warning");
      return;
    }
    setStopVotePercent((prev) => {
      const next = prev + 22;
      if (next > 51 && market) {
        showToast("Vote threshold met! Market frozen.", "warning");
        setTimeout(() => {
          useMarketStore.getState().disputeMarketById(market.market_id);
        }, 500);
      }
      return Math.min(next, 100);
    });
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
  const totalNoAmount  = myBets.filter((b) => b.choice === "NO").reduce((sum, b) => sum + b.amount_usdt, 0);
  const oddsYes  = market?.qvac_odds?.YES || 1;
  const oddsNo   = market?.qvac_odds?.NO || 1;
  const totalCost = totalYesAmount + totalNoAmount;
  const plIfYes  = totalYesAmount * oddsYes - totalCost;
  const plIfNo   = totalNoAmount * oddsNo - totalCost;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
        <Activity className="animate-spin mr-2 h-5 w-5" /> Initializing Punter Console...
      </div>
    );
  }

  // No market found — redirect notice
  if (!market) {
    return (
      <div className="max-w-md mx-auto w-full px-6 pb-6 flex flex-col flex-1">
        <header className="py-3.5 flex items-center gap-3 z-10 mb-6">
          <Link
            href="/punter"
            className="flex items-center justify-center p-2.5 bg-zinc-800 rounded-full border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.5)] transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-300 hover:text-white" />
          </Link>
          <div>
            <h1 className="text-sm font-black tracking-tight text-yellow-400 uppercase">Punter Console</h1>
            <p className="text-[10px] text-zinc-500 mt-0.5">Market not found.</p>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertTriangle className="w-12 h-12 text-zinc-700" />
          <p className="text-zinc-500 text-sm text-center">
            {marketIdFromUrl
              ? `Market with ID "${marketIdFromUrl}" not found.`
              : "No market ID in URL."}
          </p>
          <Link
            href="/punter"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600 shadow-[0_4px_0_#18181b] active:shadow-none active:translate-y-1 transition-all text-white font-bold text-sm cursor-pointer"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full px-6 pb-6 flex flex-col flex-1">

      {/* Header */}
      <header className="py-3.5 flex justify-between items-center z-10 mb-6 bg-transparent w-full">
        <div className="flex items-center gap-3">
          <Link
            href="/punter"
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
                showToast("Address copied.", "success");
              }}
              className="flex items-center gap-1.5 mt-0.5 cursor-pointer hover:text-white active:scale-95 transition-all text-zinc-500"
              title="Copy Wallet Address"
            >
              <span className="text-[10px] font-mono">
                {punterAddress.slice(0, 4)}...{punterAddress.slice(-4)}
              </span>
              <Copy className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
        {/* Market ID chip */}
        <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1">
          {market.market_id}
        </span>
      </header>

      {/* Main Content */}
      <div className="flex-1 space-y-5">
        {market.status === "OPEN" ? (
          /* ═══ OPEN STATE — BET FORM ═══ */
          <div className="space-y-5">
            <MarketStatusCard
              title="MARKET STATUS"
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

            {/* Bet Distribution */}
            {(() => {
              const yesSum = bets.filter(b => b.choice === "YES").reduce((a, b) => a + b.amount_usdt, 0);
              const noSum  = bets.filter(b => b.choice === "NO").reduce((a, b) => a + b.amount_usdt, 0);
              const total  = yesSum + noSum;
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
                Place Bet
              </h4>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Bet Amount (USDT)
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
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">USDT</span>
                </div>
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
          /* ═══ GRACE PERIOD ═══ */
          <div className="space-y-5">
            <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-6 space-y-5 text-center">
              <div className="flex items-center justify-center gap-2 text-yellow-500">
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-500">
                  GRACE PERIOD ({disputeTimer}S)
                </h4>
              </div>
              <div className="bg-black/40 border border-zinc-800/60 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">Bookmaker's Decision</span>
                <h2 className="text-3xl font-extrabold text-yellow-500 font-mono tracking-wide">
                  {market.resolution_outcome || "YES"}
                </h2>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-[280px] mx-auto">
                If this decision contradicts the official VAR result, raise a dispute before the timer runs out.
              </p>
              {myBets.length > 0 ? (
                <>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Dispute Active</span>
                      <span className="text-red-400 font-bold">
                        {disputePercent}% <span className="text-zinc-500 font-normal">(Need &gt;51%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${disputePercent}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={handleDisputeClick}
                    className="w-full bg-gradient-to-b from-red-600 to-red-800 border border-red-500/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_15px_rgba(220,38,38,0.5)] text-white font-bold rounded-xl py-3 active:scale-95 transition-all uppercase tracking-wider text-xs cursor-pointer"
                  >
                    RAISE DISPUTE
                  </button>
                </>
              ) : (
                <p className="text-[11px] text-zinc-500 italic text-center mt-2">
                  Waiting for active punters to validate the result...
                </p>
              )}
            </div>

            <MarketStatusCard
              title="MARKET STATUS"
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
              statusText="GRACE PERIOD"
              statusColor="text-yellow-500"
            />

            {(() => {
              const yesSum = bets.filter(b => b.choice === "YES").reduce((a, b) => a + b.amount_usdt, 0);
              const noSum  = bets.filter(b => b.choice === "NO").reduce((a, b) => a + b.amount_usdt, 0);
              const total  = yesSum + noSum;
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
          /* ═══ CLOSED STATE ═══ */
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
              return (
                <MarketResultCard
                  tournament={market.match_info.tournament}
                  teamA={matchParts[0] || ""}
                  teamB={matchParts[1] || ""}
                  incident={market.incident_description}
                  finalResult={market.resolution_outcome as "YES" | "NO"}
                  pnlAmount={netPL}
                  statusText={isWin ? "SUCCESS (WIN)" : "FAILED (LOSS)"}
                  estimatedBalance={100 + netPL}
                  descriptionText={`Based on ${myBets.length} bet(s) you placed.`}
                  showPnL={myBets.length > 0}
                />
              );
            })()}

            <MarketStatusCard
              title="MARKET STATUS"
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
              statusText="MARKET CLOSED"
              statusColor="text-zinc-500"
            />

            <Link
              href="/punter"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900/50 backdrop-blur-2xl border border-white/5 text-white font-bold text-sm cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.4)] transition-all active:scale-95 active:translate-y-[1px]"
            >
              Back to Dashboard
            </Link>
          </div>

        ) : (
          /* ═══ FROZEN / CONSENSUS / DISPUTE ═══ */
          <div className="space-y-5">
            <LockedMarketCard status={market.status as any} resolutionOutcome={market.resolution_outcome ?? undefined} />

            {market.status === "AWAITING_CONSENSUS" && (
              <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Dispute Voting</span>
                    <span className="text-red-400 font-bold">
                      {disputePercent}% <span className="text-zinc-500 font-normal">(Need &gt;51%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${disputePercent > 51 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${disputePercent}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleDisputeClick}
                  disabled={disputePercent >= 100}
                  className="w-full bg-gradient-to-b from-red-600 to-red-800 border border-red-500/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_10px_rgba(0,0,0,0.5)] text-white font-bold rounded-xl py-3 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <AlertTriangle className="w-4 h-4" />
                  RAISE DISPUTE
                </button>
              </div>
            )}

            {market.status === "FROZEN_BETTING" && (
              <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Freeze Market Voting</span>
                    <span className="text-red-400 font-bold">
                      {stopVotePercent}% <span className="text-zinc-500 font-normal">(Need &gt;51%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${stopVotePercent > 51 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${stopVotePercent}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleStopVoteClick}
                  disabled={stopVotePercent >= 100}
                  className="w-full bg-gradient-to-b from-red-600 to-red-800 border border-red-500/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_10px_rgba(0,0,0,0.5)] text-white font-bold rounded-xl py-3 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <AlertTriangle className="w-4 h-4" />
                  STOP & FREEZE MARKET (VAR ISSUED)
                </button>
              </div>
            )}

            <MarketStatusCard
              title="MARKET STATUS"
              tournament={market.match_info.tournament}
              match={market.match_info.match}
              incidentDescription={market.incident_description}
              marketId={market.market_id}
              oddsYes={market.qvac_odds.YES}
              oddsNo={market.qvac_odds.NO}
              totalPool={market.total_pool}
              bandarStake={market.bandar_stake}
              timeLeftSeconds={market.status === "FROZEN_BETTING" ? varResolutionTime : market.status === "AWAITING_CONSENSUS" ? consensusTimeLeft : null}
              status={market.status as any}
              statusText={market.status === "DISPUTED_FROZEN" ? "DISPUTED" : undefined}
              statusColor={market.status === "DISPUTED_FROZEN" ? "text-yellow-500" : undefined}
            />

            {(() => {
              const yesSum = bets.filter(b => b.choice === "YES").reduce((a, b) => a + b.amount_usdt, 0);
              const noSum  = bets.filter(b => b.choice === "NO").reduce((a, b) => a + b.amount_usdt, 0);
              const total  = yesSum + noSum;
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

            {myBets.length > 0 && (
              <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.5)] p-6 space-y-3.5">
                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Your Bets</span>
                  <span className="text-zinc-650 font-mono">{myBets.length} bets</span>
                </h4>
                <div className="space-y-2 max-h-[120px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {myBets.slice().reverse().map((bet) => (
                    <div key={bet.bet_id} className="flex items-center justify-between p-2.5 bg-black/50 rounded-2xl border border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className={bet.choice === "YES"
                          ? "bg-yellow-500 text-zinc-950 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md"
                          : "bg-zinc-700 text-zinc-300 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md"
                        }>
                          {bet.choice}
                        </span>
                        <span className="text-[9px] text-zinc-500">
                          {new Date(bet.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white font-mono">{bet.amount_usdt} USDT</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between p-3 mt-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <span className="bg-yellow-500 text-zinc-950 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md">YES</span>
                    <span className={`text-sm font-bold font-mono ${plIfYes >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {plIfYes >= 0 ? '+' : ''}{plIfYes.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="w-px h-5 bg-zinc-700/50" />
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-700 text-zinc-300 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md">NO</span>
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

      {/* Dev Tools Footer */}
      <div className="mt-8 pt-4 border-t border-dashed border-zinc-850 space-y-2 z-20">
        <p className="text-[9px] text-zinc-650 font-mono tracking-wider uppercase text-center">Dev Testing Controls</p>
        <div className="grid grid-cols-2 gap-2">
          {market.status !== "CLOSED" && (
            <>
              <button
                onClick={() => {
                  useMarketStore.getState().resolveMarketById(market.market_id, "YES");
                  useMarketStore.getState().closeMarketById(market.market_id);
                }}
                className="py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-[10px] text-yellow-500 font-bold tracking-wider cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                🛠️ Dev: Force Close
              </button>
              <button
                onClick={() => useMarketStore.getState().freezeMarketById(market.market_id)}
                className="py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-[10px] text-blue-400 font-bold tracking-wider cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                🛠️ Dev: Force Lock
              </button>
              <button
                onClick={() => {
                  useMarketStore.getState().updateMarketStatus(market.market_id, "GRACE_PERIOD");
                  useMarketStore.getState().resolveMarketById(market.market_id, "YES");
                }}
                className="py-2.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl text-[10px] text-orange-400 font-bold tracking-wider cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                🛠️ Dev: Grace Period
              </button>
              <button
                onClick={() => {
                  useMarketStore.getState().resolveMarketById(market.market_id, "YES");
                  useMarketStore.getState().closeMarketById(market.market_id);
                }}
                className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-[10px] text-emerald-400 font-bold tracking-wider cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                🛠️ Dev: Oracle Resolve
              </button>
            </>
          )}
          <button
            onClick={() => useMarketStore.getState().resetStore()}
            className="col-span-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-[10px] text-red-500 font-bold tracking-wider cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
          >
            Reset All Markets
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Outer wrapper with Suspense ───────────────────────────────────────────
export default function PunterConsolePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 items-center justify-center text-zinc-400">
        <Activity className="animate-spin mr-2 h-5 w-5" /> Initializing Punter Console...
      </div>
    }>
      <PunterConsoleInner />
    </Suspense>
  );
}
