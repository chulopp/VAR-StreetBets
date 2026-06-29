"use client";

import Link from "next/link";
import { Tv, Crown, Users, Zap, Shield, Wifi } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-yellow-600/3 rounded-full blur-[80px] pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center space-y-10">
        {/* Logo & Title */}
        <div className="flex flex-col items-center space-y-5">
          {/* 3D Glowing Logo */}
          <div className="animate-logo-float relative">
            <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-yellow-500/15 blur-xl" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-700 flex items-center justify-center shadow-[0_8px_32px_rgba(234,179,8,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-2px_0_rgba(0,0,0,0.15)] border border-yellow-400/30">
              <Tv className="w-9 h-9 text-black drop-shadow-sm" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white animate-glow-pulse">
              VAR-Street Bets
            </h1>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em]">
              P2P Micro-Betting • Offline Mesh • Zero Trust
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded-full">
              <Wifi className="w-3 h-3 text-yellow-500" />
              <span className="text-[10px] font-bold text-zinc-400">Pears P2P</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded-full">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-[10px] font-bold text-zinc-400">QVAC AI</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded-full">
              <Shield className="w-3 h-3 text-yellow-500" />
              <span className="text-[10px] font-bold text-zinc-400">WDK Wallet</span>
            </div>
          </div>
        </div>

        {/* Role Selector Buttons */}
        <div className="w-full space-y-4">
          {/* Bandar Button */}
          <Link href="/bandar" className="block w-full">
            <button
              id="btn-role-bandar"
              className="btn-3d-yellow w-full py-5 rounded-2xl text-base uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-black/15 flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-black text-sm">BUKA PASAR</div>
                <div className="text-[10px] font-semibold opacity-70">Host Bandar</div>
              </div>
            </button>
          </Link>

          {/* Punter Button */}
          <Link href="/punter" className="block w-full">
            <button
              id="btn-role-punter"
              className="btn-3d-dark w-full py-5 rounded-2xl text-base uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-left">
                <div className="font-black text-sm">GABUNG PASAR</div>
                <div className="text-[10px] font-semibold text-zinc-500">Punter</div>
              </div>
            </button>
          </Link>
        </div>

        {/* Bottom branding */}
        <div className="text-center space-y-3 pt-4">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-[10px] text-zinc-600 font-semibold">Mesh Network Ready</span>
          </div>
          <p className="text-[9px] text-zinc-700 font-mono tracking-wider">
            Powered by Pears SDK • QVAC SDK • WDK
          </p>
          <p className="text-[9px] text-zinc-800 font-mono">
            Tether Developers Cup 2026
          </p>
        </div>
      </div>
    </div>
  );
}
