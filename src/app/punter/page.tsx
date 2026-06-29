"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useMarketStore } from "@/store/marketStore";
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
} from "lucide-react";

export default function PunterConsolePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { market, bets, addBet, emergencyFreeze } = useMarketStore();

  // Form state
  const [betAmount, setBetAmount] = useState(5);
  const [punterAddress] = useState(
    `0xWDK_Punter_${Math.floor(Math.random() * 900) + 100}`
  );

  const handleBet = (choice: "YES" | "NO") => {
    if (!market || market.status !== "OPEN" || betAmount < 1) return;
    addBet(choice, betAmount, punterAddress);
  };

  const handleEmergencyFreeze = () => {
    if (!market || market.status !== "OPEN") return;
    emergencyFreeze();
  };

  // My bets
  const myBets = bets.filter((b) => b.punter_pubkey === punterAddress);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
        <Activity className="animate-spin mr-2 h-5 w-5" /> Inisialisasi Punter Console...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center p-3 sm:p-6">
      {/* Phone Container */}
      <div className="w-full max-w-[420px] bg-zinc-950 border border-zinc-800/80 rounded-[40px] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] relative flex flex-col h-[880px] max-h-[95vh]">
        {/* Status Bar */}
        <div className="bg-black text-[11px] px-6 py-2.5 flex justify-between items-center text-zinc-500 font-semibold border-b border-zinc-900 select-none">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="h-4 w-24 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1.5 border border-zinc-800/30 flex items-center justify-center">
            <span className="h-1.5 w-6 bg-zinc-800 rounded-full" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 text-rose-500 bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-900/30">
              <WifiOff className="w-3 h-3 animate-pulse" />
              <span>Mesh</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="px-5 py-3.5 bg-black/60 backdrop-blur-md border-b border-zinc-800/40 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 hover:bg-zinc-800/80 rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.25)]">
                <Users className="w-4 h-4 text-black" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-yellow-400 uppercase">
                  Punter Console
                </h1>
                <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[160px]">
                  {punterAddress}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 scrollbar-none">
          {!market || market.status === "CLOSED" ? (
            /* ═══ SCANNING STATE ═══ */
            <div className="flex flex-col items-center justify-center h-full space-y-8 -mt-6">
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
                <p className="text-xs text-zinc-500 max-w-[240px] leading-relaxed">
                  Mencari siaran pasar taruhan dari Bandar di area sekitarmu via mesh P2P.
                </p>
                <div className="flex items-center justify-center gap-1 pt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>

              {/* Info card */}
              <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-yellow-500">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Cara Kerja</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Seorang <span className="text-white font-semibold">Bandar</span> di sekitarmu akan membuka pasar taruhan saat terjadi insiden VAR. Kamu akan otomatis menerima siaran pasar tersebut tanpa internet.
                </p>
              </div>
            </div>
          ) : market.status === "FROZEN_BETTING" || market.status === "AWAITING_CONSENSUS" ? (
            /* ═══ FROZEN STATE ═══ */
            <div className="space-y-5">
              {/* Frozen Banner */}
              <div className="bg-red-950/20 border border-red-500/20 rounded-3xl p-5 text-center space-y-3">
                <Lock className="w-10 h-10 text-red-400 mx-auto" />
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  ⛔ Pasar Dikunci
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {market.status === "FROZEN_BETTING"
                    ? "Taruhan tidak lagi diterima. Menunggu keputusan wasit dan input hasil dari Bandar..."
                    : `Bandar telah menginput hasil: "${market.resolution_outcome}". Menunggu konsensus petaruh...`}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                    {market.status === "FROZEN_BETTING"
                      ? "Menunggu Keputusan Wasit"
                      : "Menunggu Konsensus"}
                  </span>
                </div>
              </div>

              {/* Market Info (read-only) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  {market.match_info.tournament} • {market.match_info.match}
                </p>
                <h3 className="text-sm font-bold text-white leading-snug">
                  {market.incident_description}
                </h3>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                  <div className="text-center p-2 rounded-2xl bg-black/50">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">Odds YES</p>
                    <p className="text-sm font-black text-yellow-400 font-mono">
                      {market.qvac_odds.YES.toFixed(2)}x
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-2xl bg-black/50">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">Odds NO</p>
                    <p className="text-sm font-black text-zinc-300 font-mono">
                      {market.qvac_odds.NO.toFixed(2)}x
                    </p>
                  </div>
                </div>
              </div>

              {/* My Bets */}
              {myBets.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3">
                  <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Taruhan Kamu
                  </h4>
                  <div className="space-y-2">
                    {myBets.map((bet) => (
                      <div
                        key={bet.bet_id}
                        className="flex items-center justify-between p-2.5 bg-black/50 rounded-2xl border border-zinc-800"
                      >
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            bet.choice === "YES"
                              ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {bet.choice}
                        </span>
                        <span className="text-sm font-bold text-white font-mono">
                          {bet.amount_usdt} USDT
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ═══ OPEN STATE — BET FORM ═══ */
            <div className="space-y-5">
              {/* Market Detail Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Pasar Aktif
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Open</span>
                  </div>
                </div>

                <div className="space-y-1 border-b border-zinc-800 pb-3">
                  <p className="text-[10px] text-yellow-500 font-bold uppercase">
                    {market.match_info.tournament} • {market.match_info.match}
                  </p>
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {market.incident_description}
                  </h3>
                  <p className="text-[9px] text-zinc-600 font-mono">ID: {market.market_id}</p>
                </div>

                {/* Odds Display */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-3 rounded-2xl bg-yellow-500/5 border border-yellow-500/15">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-yellow-400" />
                      <p className="text-[9px] text-yellow-500 font-extrabold uppercase tracking-wide">
                        Odds YES
                      </p>
                    </div>
                    <p className="text-xl font-black text-yellow-400 font-mono">
                      {market.qvac_odds.YES.toFixed(2)}x
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
                      {market.qvac_odds.NO.toFixed(2)}x
                    </p>
                  </div>
                </div>

                {/* Pool info */}
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-800">
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

              {/* Bet Form */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Pasang Taruhan
                  </h4>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    Jumlah USDt
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
                    className="btn-3d-dark py-4 rounded-2xl text-sm uppercase tracking-wider flex flex-col items-center gap-0.5 cursor-pointer"
                  >
                    <span className="font-black">BET NO</span>
                    <span className="text-[9px] font-semibold opacity-70 text-zinc-500">
                      Win {(betAmount * market.qvac_odds.NO).toFixed(1)} USDT
                    </span>
                  </button>
                </div>
              </div>

              {/* My Bets */}
              {myBets.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3">
                  <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Taruhan Kamu</span>
                    <span className="text-zinc-600 font-mono">{myBets.length} bets</span>
                  </h4>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto">
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
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                bet.choice === "YES"
                                  ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              }`}
                            >
                              {bet.choice}
                            </span>
                            <span className="text-[9px] text-zinc-600">
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
                </div>
              )}

              {/* Emergency Freeze */}
              <div className="bg-zinc-900/50 border border-red-900/20 rounded-3xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    Rem Darurat (Circuit Breaker)
                  </h4>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Jika Bandar telat menekan FREEZE dan wasit sudah memutuskan, tekan tombol di bawah. Jika 3+ petaruh menekan, pasar otomatis dikunci.
                </p>
                <div className="flex items-center justify-between text-[10px] text-zinc-600 font-mono">
                  <span>Emergency Votes</span>
                  <span className="text-red-400 font-bold">
                    {market.emergency_freeze_count}/3
                  </span>
                </div>
                <button
                  onClick={handleEmergencyFreeze}
                  className="btn-3d-danger w-full py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  EMERGENCY FREEZE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
