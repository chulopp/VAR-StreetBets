"use client";

import Link from "next/link";
import Image from "next/image";
import { Crown, Users, Zap, Shield, Wifi } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-start px-6 py-12 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-yellow-600/3 rounded-full blur-[80px] pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center space-y-8 mt-16 sm:mt-24">
        {/* Logo & Title */}
        <div className="flex flex-col items-center space-y-3">
          {/* Logo with subtle glow (static) */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-28 h-28 rounded-full bg-yellow-500/10 blur-xl pointer-events-none" />
            <Image
              src="/LOGO.svg"
              alt="VAR-Street Bets Logo"
              width={96}
              height={96}
              className="relative z-10"
              priority
            />
          </div>

          {/* Title & Badges */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-black tracking-tight text-white">
              VAR STREET BETS
            </h1>

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
        </div>

        {/* Role Selector Buttons */}
        <div className="w-full max-w-xs mx-auto space-y-4">
          {/* Bandar Button */}
          <Link href="/bandar" className="block w-full">
            <button
              id="btn-role-bandar"
              className="btn-3d-yellow w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              <span>OPEN MARKET</span>
            </button>
          </Link>

          {/* Punter Button */}
          <Link href="/punter" className="block w-full">
            <button
              id="btn-role-punter"
              className="w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-950 hover:from-zinc-700 hover:to-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all active:scale-95 active:translate-y-[1px]"
            >
              <Users className="w-4 h-4 text-zinc-400" />
              <span>JOIN MARKET</span>
            </button>
          </Link>
        </div>

        {/* Bottom branding */}
        <div className="text-center pt-4">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-[10px] text-zinc-600 font-semibold">Mesh Network Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
