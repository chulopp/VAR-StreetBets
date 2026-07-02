"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMarketStore, MarketState } from "@/store/marketStore";
import { useToastStore } from "@/store/useToastStore";
import {
  ArrowLeft,
  Radio,
  AlertTriangle,
  Activity,
  Zap,
  Copy,
  TrendingUp,
  DollarSign,
  DoorOpen,
} from "lucide-react";
import GlobalPnlCard from "@/components/GlobalPnlCard";

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─── MarketItem (Punter View) ──────────────────────────────────────────────
interface PunterMarketItemProps {
  market: MarketState;
  isDisputed: boolean;
  onEnter: (id: string) => void;
}

function PunterMarketItem({ market, isDisputed, onEnter }: PunterMarketItemProps) {
  const { freezeMarketById, disputeMarketById, closeMarketById } = useMarketStore();

  // ── Phase OPEN: 60s countdown ──
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
      if (remaining <= 0) {
        freezeMarketById(market.market_id);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [market.market_id, market.status, market.created_timestamp, freezeMarketById]);

  // ── Phase FROZEN: 600s countdown ──
  const [frozenSecsLeft, setFrozenSecsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (market.status !== "FROZEN_BETTING" || !market.frozen_at) {
      setFrozenSecsLeft(null);
      return;
    }
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((600_000 - (Date.now() - market.frozen_at!)) / 1000)
      );
      setFrozenSecsLeft(remaining);
      if (remaining <= 0) {
        disputeMarketById(market.market_id);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [market.market_id, market.status, market.frozen_at, disputeMarketById]);

  // ── Phase CONSENSUS: 15s countdown ──
  // Uses `resolved_at` timestamp from the store so the countdown is accurate
  // across all tabs, even if they mount at slightly different times.
  const [consensusSecsLeft, setConsensusSecsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (market.status !== "AWAITING_CONSENSUS" || !market.resolved_at) {
      setConsensusSecsLeft(null);
      return;
    }
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((15_000 - (Date.now() - market.resolved_at!)) / 1000)
      );
      setConsensusSecsLeft(remaining);
      if (remaining <= 0) {
        closeMarketById(market.market_id); // Auto-close → CLOSED + PnL accrual
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [market.market_id, market.status, market.resolved_at, closeMarketById]);

  // ── Derived display values ──
  const isOpenLowTime = openSecsLeft !== null && openSecsLeft <= 15;
  // Consensus is always 15s max, so the entire duration is "low time" — always pulse.
  const isConsensusLowTime = consensusSecsLeft !== null && consensusSecsLeft > 0;

  const dotClass = isDisputed
    ? "bg-yellow-500 animate-pulse"
    : market.status === "FROZEN_BETTING"
    ? "bg-red-500"
    : market.status === "AWAITING_CONSENSUS"
    ? "bg-yellow-400 animate-pulse"
    : isOpenLowTime
    ? "bg-red-500 animate-pulse"
    : "bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]";

  const textClass = isDisputed
    ? "text-yellow-500"
    : market.status === "FROZEN_BETTING"
    ? "text-red-400"
    : market.status === "AWAITING_CONSENSUS"
    ? "text-yellow-400"
    : isOpenLowTime
    ? "text-red-500"
    : "text-emerald-400";

  const statusLabel = isDisputed
    ? "DISPUTED"
    : market.status === "OPEN"
    ? "OPEN"
    : market.status === "FROZEN_BETTING"
    ? "FROZEN"
    : market.status === "AWAITING_CONSENSUS"
    ? "CONSENSUS"
    : market.status;

  // Countdown display: OPEN → MM:SS, FROZEN → MM:SS, CONSENSUS → MM:SS (cyan), DISPUTED → none
  const countdownDisplay = isDisputed
    ? null
    : market.status === "OPEN" && openSecsLeft !== null && openSecsLeft > 0
    ? formatTime(openSecsLeft)
    : market.status === "FROZEN_BETTING" && frozenSecsLeft !== null && frozenSecsLeft > 0
    ? formatTime(frozenSecsLeft)
    : market.status === "AWAITING_CONSENSUS" && consensusSecsLeft !== null && consensusSecsLeft > 0
    ? formatTime(consensusSecsLeft)
    : null;

  const countdownClass = isDisputed
    ? ""
    : market.status === "AWAITING_CONSENSUS" && isConsensusLowTime
    ? "text-red-500 animate-pulse font-black"
    : isOpenLowTime || market.status === "FROZEN_BETTING"
    ? "text-red-500"
    : "text-yellow-400";

  return (
    <div className="space-y-3">
      {/* Liga row */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] text-yellow-500 font-bold uppercase tracking-wide">
          {market.match_info.tournament}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {countdownDisplay && (
            <span className={`font-mono font-bold text-xs ${countdownClass}`}>
              {countdownDisplay}
            </span>
          )}
          <div className={`w-2 h-2 rounded-full ${dotClass}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${textClass}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Match title */}
      <h3 className="text-base font-black text-white tracking-tight leading-tight">
        {market.match_info.match}
      </h3>

      {/* Incident Description */}
      <div className="bg-black/40 border border-zinc-800/60 rounded-xl p-2.5">
        <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">
          Incident Description
        </span>
        <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
          {market.incident_description}
        </p>
      </div>

      {/* Market ID + divider */}
      <div className="mt-1 text-[10px] font-medium text-zinc-600 tracking-wider font-mono">
        ID: {market.market_id}
      </div>
      <hr className="border-white/10" />

      {/* Odds */}
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-2.5 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingUp className="w-3 h-3 text-yellow-400" />
            <p className="text-[9px] text-yellow-500 font-extrabold uppercase tracking-wide">
              Odds YES
            </p>
          </div>
          <p className="text-lg font-black text-yellow-400 font-mono">
            {market.qvac_odds.YES.toFixed(2)}x
          </p>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingUp className="w-3 h-3 text-zinc-400" />
            <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wide">
              Odds NO
            </p>
          </div>
          <p className="text-lg font-black text-zinc-300 font-mono">
            {market.qvac_odds.NO.toFixed(2)}x
          </p>
        </div>
      </div>

      {/* Pool Info */}
      <div className="border-t border-zinc-800 pt-2 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Total Pool</span>
          <span className="text-yellow-400 font-bold font-mono">
            {market.total_pool} USDT
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Bandar Stake</span>
          <span className="text-zinc-300 font-bold font-mono">
            {market.bandar_stake} USDT
          </span>
        </div>
      </div>

      {/* GABUNG / MASUK KE PASAR button */}
      <button
        id={`btn-masuk-pasar-punter-${market.market_id}`}
        onClick={() => onEnter(market.market_id)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600 shadow-[0_4px_0_#18181b] active:shadow-none active:translate-y-1 transition-all text-white font-bold text-xs cursor-pointer"
      >
        <DoorOpen className="w-3.5 h-3.5 text-zinc-400" />
        ENTER MARKET
      </button>
    </div>
  );
}

// ─── Inner (needs Suspense) ────────────────────────────────────────────────
function PunterDashboardInner() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);
  const { markets, bets: allBets, addMarket, cumulativePnl, walletBalance, punterAddress } = useMarketStore();

  const [isMeshHardwareReady, setIsMeshHardwareReady] = useState(false);
  const [isHardwareReady, setIsHardwareReady] = useState(true);

  useEffect(() => {
    setIsHardwareReady(navigator.onLine);
    const handleOnline = () => setIsHardwareReady(true);
    const handleOffline = () => setIsHardwareReady(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  const openMarkets = markets.filter((m) =>
    ["OPEN", "FROZEN_BETTING", "AWAITING_CONSENSUS"].includes(m.status)
  );
  const disputedMarkets = markets.filter((m) =>
    ["DISPUTED_FROZEN", "DISPUTED"].includes(m.status)
  );
  // Show dashboard (markets list + PnL) if there are active markets OR if there's
  // a non-zero cumulative PnL — so the PnL card persists after markets close.
  const shouldShowDashboard = openMarkets.length > 0 || disputedMarkets.length > 0 || cumulativePnl !== 0;
  const closedMarkets = markets.filter((m) => m.status === "CLOSED");

  // Cumulative PnL for punter (my bets across all closed markets)
  const myPnl = closedMarkets.reduce((total, m) => {
    const myBets = allBets.filter(
      (b) => b.market_id === m.market_id && b.punter_pubkey === punterAddress
    );
    if (myBets.length === 0) return total;
    const winAmount = myBets
      .filter((b) => b.choice === m.resolution_outcome)
      .reduce(
        (sum, b) =>
          sum +
          b.amount_usdt *
            (b.choice === "YES" ? m.qvac_odds.YES : m.qvac_odds.NO) -
          b.amount_usdt,
        0
      );
    const loseAmount = myBets
      .filter((b) => b.choice !== m.resolution_outcome)
      .reduce((sum, b) => sum + b.amount_usdt, 0);
    return total + winAmount - loseAmount;
  }, 0);

  const estimatedBalance = walletBalance + myPnl;

  const handleEnterMarket = useCallback(
    (id: string) => router.push(`/punter/console?id=${id}`),
    [router]
  );

  if (!mounted) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center text-zinc-400">
        <Activity className="animate-spin mr-2 h-5 w-5" /> Loading Punter Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full px-6 pb-16 flex flex-col flex-1">

      {/* ─── Header ─── */}
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
      </header>

      <div className="flex-1 space-y-5">
        {shouldShowDashboard ? (
          /* ═══ ACTIVE MARKETS PRESENT ═══ */
          <>
            {/* Scanning Text (Proporsional di paling atas) */}
            <div className="flex items-center justify-center gap-2 text-sm text-yellow-500 animate-pulse duration-1000 py-1">
              <Radio className="w-4 h-4 text-yellow-500 animate-pulse" />
              <span className="font-bold">Scanning Pears Network...</span>
            </div>

            {/* Connection Banner */}
            {!isHardwareReady && (
              <button
                onClick={() => console.log("Triggering Native Hardware Access...")}
                className="flex items-center justify-center gap-3 w-full p-4 rounded-2xl bg-gradient-to-b from-yellow-400 to-yellow-600 text-zinc-950 font-bold border border-yellow-300/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_10px_20px_-10px_rgba(234,179,8,0.5)] active:scale-95 hover:brightness-110 cursor-pointer transition-all"
              >
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-sm">Turn on device Bluetooth & WiFi</span>
              </button>
            )}

            {/* ─── SECTION: PASAR TERBUKA ─── */}
            <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  OPEN MARKETS
                </h2>
                <span className="ml-auto text-[9px] font-mono text-zinc-600 bg-zinc-800/60 border border-zinc-700/50 rounded-full px-2 py-0.5">
                  {openMarkets.length} Active
                </span>
              </div>

              {openMarkets.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-zinc-800 rounded-xl">
                  <Activity className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                  <p className="text-[11px] text-zinc-600">No open markets.</p>
                  <p className="text-[10px] text-zinc-700 mt-0.5">
                    Waiting for a Bookmaker to open a market.
                  </p>
                </div>
              ) : (
                openMarkets.slice().reverse().map((m, idx) => (
                  <React.Fragment key={m.market_id}>
                    {idx > 0 && <hr className="my-4 border-white/10" />}
                    <PunterMarketItem
                      market={m}
                      isDisputed={false}
                      onEnter={handleEnterMarket}
                    />
                  </React.Fragment>
                ))
              )}
            </div>

            {/* ─── SECTION: PASAR SENGKETA ─── */}
            <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-yellow-400 animate-pulse" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  DISPUTED MARKETS
                </h2>
                <span className="ml-auto text-[9px] font-mono text-zinc-600 bg-zinc-800/60 border border-zinc-700/50 rounded-full px-2 py-0.5">
                  {disputedMarkets.length} Disputed
                </span>
              </div>

              {disputedMarkets.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-zinc-800 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                  <p className="text-[11px] text-zinc-600">
                    No disputed markets.
                  </p>
                </div>
              ) : (
                disputedMarkets.slice().reverse().map((m, idx) => (
                  <React.Fragment key={m.market_id}>
                    {idx > 0 && <hr className="my-4 border-white/10" />}
                    <PunterMarketItem
                      market={m}
                      isDisputed={true}
                      onEnter={handleEnterMarket}
                    />
                  </React.Fragment>
                ))
              )}
            </div>

            {/* ─── SECTION: PNL ALL-TIME PUNTER ─── */}
            <GlobalPnlCard
              title="PUNTER ALL-TIME P&L"
              pnlAmount={myPnl}
              statusText={myPnl >= 0 ? "PROFIT (WIN)" : "LOSS"}
              estimatedBalance={estimatedBalance}
              totalMarketsPlayed={closedMarkets.length}
              descriptionText="Cumulative net profit/loss from all resolved bets."
            />

            {/* Dev Testing Controls */}
            <div className="w-full flex gap-2 pt-2">
              <button
                onClick={() => {
                  addMarket(
                    `DEV_${Date.now().toString().slice(-5)}`,
                    { tournament: "🌍 World Cup 2026", match: "ENG vs ESP" },
                    "PENALTY_CHECK",
                    "Handsball di kotak penalti saat posisi 1v1",
                    { YES: 3.0, NO: 1.5 },
                    50,
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
          </>
        ) : (
          /* ═══ NO ACTIVE MARKETS STATE (Big Radar Scanning) ═══ */
          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            {/* Radar Animation */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <div className="absolute w-44 h-44 rounded-full border border-yellow-500/10" />
              <div className="absolute w-32 h-32 rounded-full border border-yellow-500/15" />
              <div className="absolute w-24 h-24 rounded-full border border-yellow-500/20" />
              <div className="absolute w-32 h-32 rounded-full border-2 border-yellow-500/20 animate-radar-ping" />
              <div className="absolute w-32 h-32 rounded-full border-2 border-yellow-500/15 animate-radar-ping-delayed" />
              <div className="absolute w-32 h-32 rounded-full border-2 border-yellow-500/10 animate-radar-ping-delayed-2" />
              <div className="absolute w-full h-full animate-radar-sweep">
                <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left bg-gradient-to-r from-yellow-500/60 to-transparent" />
              </div>
              <div className="relative z-10 w-5 h-5 rounded-full bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-pulse" />
              <div className="absolute top-6 right-10 w-1.5 h-1.5 rounded-full bg-yellow-500/40 animate-dot-blink" />
              <div className="absolute bottom-10 left-8 w-1 h-1 rounded-full bg-yellow-500/30 animate-dot-blink" style={{ animationDelay: "0.7s" }} />
              <div className="absolute top-12 left-10 w-1.5 h-1.5 rounded-full bg-yellow-500/25 animate-dot-blink" style={{ animationDelay: "1.2s" }} />
            </div>

            {/* Scanning Text */}
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-yellow-500 animate-pulse" />
              <span className="text-sm font-bold text-white">Scanning Pears Network...</span>
            </div>

            {/* Connection Banner */}
            {!isHardwareReady && (
              <button
                onClick={() => console.log("Triggering Native Hardware Access...")}
                className="flex items-center justify-center gap-3 w-full p-4 rounded-2xl bg-gradient-to-b from-yellow-400 to-yellow-600 text-zinc-950 font-bold border border-yellow-300/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_10px_20px_-10px_rgba(234,179,8,0.5)] active:scale-95 hover:brightness-110 cursor-pointer transition-all"
              >
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-sm">Turn on device Bluetooth & WiFi</span>
              </button>
            )}

            {/* Dev Testing Controls */}
            <div className="w-full flex gap-2">
              <button
                onClick={() => {
                  addMarket(
                    `DEV_${Date.now().toString().slice(-5)}`,
                    { tournament: "🌍 World Cup 2026", match: "ENG vs ESP" },
                    "PENALTY_CHECK",
                    "Handsball di kotak penalti saat posisi 1v1",
                    { YES: 3.0, NO: 1.5 },
                    50,
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
        )}
      </div>
    </div>
  );
}

// ─── Outer wrapper with Suspense ───────────────────────────────────────────
export default function PunterDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 items-center justify-center text-zinc-400">
        <Activity className="animate-spin mr-2 h-5 w-5" /> Loading Punter Console...
      </div>
    }>
      <PunterDashboardInner />
    </Suspense>
  );
}
