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
  CheckCircle2,
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
    <div className="max-w-md mx-auto w-full min-h-screen px-4 py-6 flex flex-col">
      {/* Header */}
      <header className="py-3.5 bg-black/60 backdrop-blur-md border-b border-zinc-800/40 flex justify-between items-center z-10 mb-6 rounded-2xl px-4">
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
              <p className="text-xs text-zinc-500 max-w-[240px] leading-relaxed mx-auto">
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

            {/* Dev Force Open Market Cheat Button */}
            <button
              onClick={() => {
                useMarketStore.getState().openMarket(
                  "DEV_MARKET_DUMMY",
                  { tournament: "EURO 2026", match: "ENG vs ESP" },
                  "PENALTY_CHECK",
                  "Handsball di kotak penalti",
                  { YES: 3.0, NO: 1.5 },
                  10,
                  "0xWDK_Pub_Key_Bandar_Dummy"
                );
              }}
              className="w-full py-3 rounded-2xl border border-dashed border-yellow-500/30 hover:border-yellow-500/60 bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-500 text-xs font-black tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🛠️ DEV: FORCE OPEN MARKET</span>
            </button>
          </div>
        ) : market.status === "OPEN" ? (
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

              <div className="space-y-1.5 border-b border-zinc-800 pb-3">
                <p className="text-[10px] text-yellow-500 font-bold uppercase">
                  {market.match_info.tournament}
                </p>
                <h2 className="text-lg font-black text-white tracking-tight">
                  {market.match_info.match}
                </h2>
                <div className="bg-black/40 border border-zinc-800/60 rounded-2xl p-3 mt-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">
                    Deskripsi Insiden
                  </span>
                  <h3 className="text-xs text-zinc-200 leading-relaxed font-semibold">
                    {market.incident_description}
                  </h3>
                </div>
                <p className="text-[9px] text-zinc-650 font-mono mt-1">ID: {market.market_id}</p>
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
                  className="py-4 rounded-2xl text-sm font-black uppercase tracking-wider flex flex-col items-center justify-center gap-0.5 cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-950 hover:from-zinc-700 hover:to-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all active:scale-95 active:translate-y-[1px]"
                >
                  <span>BET NO</span>
                  <span className="text-[9px] font-semibold opacity-70 text-zinc-400">
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
                  <span className="text-zinc-650 font-mono">{myBets.length} bets</span>
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
              </div>
            )}

            {/* STOP TARUHAN (KUNCI PASAR) - Circuit Breaker */}
            <div className="bg-zinc-900/50 border border-red-900/20 rounded-3xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <h4 className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Rem Darurat (Circuit Breaker)
                </h4>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Jika Bandar telat menekan Kunci Taruhan dan wasit sudah memutuskan, tekan tombol di bawah. Jika Mayoritas Petaruh (&gt;51%) menekan, pasar otomatis dikunci.
              </p>
              <div className="flex items-center justify-between text-[10px] text-zinc-600 font-mono">
                <span>Emergency Votes</span>
                <span className="text-red-400 font-bold">
                  {market.emergency_freeze_count > 0 ? Math.round((market.emergency_freeze_count / 3) * 100) : 0}% (Butuh &gt;51%)
                </span>
              </div>
              <button
                onClick={handleEmergencyFreeze}
                className="btn-3d-danger w-full py-3.5 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-black"
              >
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                STOP TARUHAN (KUNCI PASAR)
              </button>
            </div>
          </div>
        ) : market.status === "CLOSED" ? (
          /* ═══ CLOSED STATE — RESULT & P&L ═══ */
          <div className="space-y-6">
            {/* Finished Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  Pasar Selesai
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  PASAR SELESAI
                </h3>
                <p className="text-xs text-zinc-400">
                  {market.match_info.tournament} • {market.match_info.match}
                </p>
              </div>

              <div className="bg-black/50 border border-zinc-800/80 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                  Keputusan Akhir
                </span>
                <span className={`text-3xl font-black tracking-wider ${
                  market.resolution_outcome === "YES" ? "text-yellow-400" : "text-zinc-400"
                }`}>
                  {market.resolution_outcome || "TIDAK ADA"}
                </span>
              </div>
            </div>

            {/* Profit & Loss Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block text-center">
                Laporan Hasil & P&L
              </span>
              
              {myBets.length > 0 ? (
                <div className="text-center py-2 space-y-2">
                  <p className={`text-lg font-black ${
                    (() => {
                      const winAmount = myBets
                        .filter(b => b.choice === market.resolution_outcome)
                        .reduce((sum, b) => sum + (b.amount_usdt * (b.choice === "YES" ? market.qvac_odds.YES : market.qvac_odds.NO) - b.amount_usdt), 0);
                      const loseAmount = myBets
                        .filter(b => b.choice !== market.resolution_outcome)
                        .reduce((sum, b) => sum + b.amount_usdt, 0);
                      return (winAmount - loseAmount) >= 0 ? "text-emerald-400" : "text-red-500";
                    })()
                  }`}>
                    {(() => {
                      const winAmount = myBets
                        .filter(b => b.choice === market.resolution_outcome)
                        .reduce((sum, b) => sum + (b.amount_usdt * (b.choice === "YES" ? market.qvac_odds.YES : market.qvac_odds.NO) - b.amount_usdt), 0);
                      const loseAmount = myBets
                        .filter(b => b.choice !== market.resolution_outcome)
                        .reduce((sum, b) => sum + b.amount_usdt, 0);
                      const netPL = winAmount - loseAmount;
                      return netPL >= 0
                        ? `✅ P&L: +${netPL.toFixed(1)} USDT (Menang)`
                        : `❌ P&L: ${netPL.toFixed(1)} USDT (Kalah)`;
                    })()}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Berdasarkan {myBets.length} taruhan yang Anda pasang.
                  </p>
                </div>
              ) : (
                <div className="text-center py-2 space-y-2">
                  {/* Fallback mock for UI review as requested */}
                  <div className="border border-dashed border-zinc-800 rounded-xl p-3 bg-black/30">
                    <p className="text-[10px] text-zinc-500 mb-2">
                      (Demo Preview: Anda tidak menaruh dana di pasar ini)
                    </p>
                    <div className="flex flex-col gap-2.5">
                      <div className="text-xs text-emerald-400 font-bold">
                        ✅ P&L: +15 USDT (Menang)
                      </div>
                      <div className="text-xs text-red-500 font-bold">
                        ❌ P&L: -5 USDT (Kalah)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reset / Back to lobby */}
            <button
              onClick={() => {
                useMarketStore.getState().resetStore();
              }}
              className="w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-950 hover:from-zinc-700 hover:to-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all active:scale-95 active:translate-y-[1px]"
            >
              Kembali ke Pemindaian (Scan)
            </button>
          </div>
        ) : (
          /* ═══ FROZEN STATE / CONSENSUS ═══ */
          <div className="space-y-5">
            {/* Frozen Banner */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-center space-y-3">
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
        )}
      </div>
    </div>
  );
}
