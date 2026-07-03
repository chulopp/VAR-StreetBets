"use client";

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Link, usePathname } from "expo-router";
import { Wallet, ShieldCheck } from "lucide-react-native";
import { useMarketStore } from "@/store/marketStore";
import LogoSvg from "../../public/LOGO.svg";

export default function Navbar() {
  const pathname = usePathname();
  const { walletConnected, connectWallet } = useMarketStore();

  const handleConnect = () => {
    connectWallet();
  };

  return (
    <View className="w-full bg-zinc-950/80 border-b border-zinc-900 px-6 py-4 flex-row items-center justify-between z-50 mb-3">
      <Link href="/" asChild>
        <Pressable className="flex-row items-center gap-2">
          <LogoSvg width={28} height={28} />
        </Pressable>
      </Link>

      <Pressable
        onPress={handleConnect}
        style={walletConnected ? styles.btnConnected : styles.btnDisconnected}
        className="px-4 py-2 rounded-xl flex-row items-center gap-2"
      >
        {walletConnected ? (
          <>
            <ShieldCheck size={14} color="#34d399" />
            <Text style={styles.textConnected} className="text-xs font-bold uppercase tracking-wider">
              0xWDK...Connected
            </Text>
          </>
        ) : (
          <>
            <Wallet size={14} color="#eab308" />
            <Text style={styles.textDisconnected} className="text-xs font-bold uppercase tracking-wider">
              Connect Local WDK
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  btnConnected: {
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.3)",
    backgroundColor: "rgba(52,211,153,0.1)",
    shadowColor: "rgba(16,185,129,0.1)",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 0,
  },
  btnDisconnected: {
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.4)",
    backgroundColor: "transparent",
  },
  textConnected: {
    color: "#34d399",
  },
  textDisconnected: {
    color: "#eab308",
  },
});
