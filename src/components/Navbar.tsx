"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Wallet, ShieldCheck } from "lucide-react";
import { useMarketStore } from "@/store/marketStore";

export default function Navbar() {
  const pathname = usePathname();
  const { walletConnected, connectWallet } = useMarketStore();

  const handleConnect = () => {
    connectWallet();
  };

  return (
    <nav className="w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-6 py-4 flex items-center justify-between z-50 mb-3">
      <Link href="/" className="flex items-center gap-2 group">
        <Image
          src="/LOGO.svg"
          alt="VAR-Street Bets Logo"
          width={28}
          height={28}
          className="group-hover:scale-105 transition-transform"
        />
      </Link>

      <button
        onClick={handleConnect}
        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${
          walletConnected
            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            : "border border-yellow-500/40 hover:border-yellow-500/80 text-yellow-500 bg-transparent hover:bg-yellow-500/5"
        }`}
      >
        {walletConnected ? (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>0xWDK...Connected</span>
          </>
        ) : (
          <>
            <Wallet className="w-3.5 h-3.5 text-yellow-500" />
            <span>Connect Local WDK</span>
          </>
        )}
      </button>
    </nav>
  );
}
