import "../global.css";
import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Navbar from "@/components/Navbar";
import GlobalToast from "@/components/GlobalToast";
import { useMarketStore } from "@/store/marketStore";

export default function RootLayout() {
  const resolveDisputedMarkets = useMarketStore((s) => s.resolveDisputedMarkets);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    let unsubNetInfo: (() => void) | undefined;

    const setupNetInfo = async () => {
      try {
        const NetInfo = require("@react-native-community/netinfo").default;

        unsubNetInfo = NetInfo.addEventListener((state: any) => {
          if (state.isConnected && wasOfflineRef.current) {
            console.log("[NETINFO] Internet reconnected — resolving disputed markets...");
            resolveDisputedMarkets();
          }
          wasOfflineRef.current = !state.isConnected;
        });

        // Initial check
        const initialState = await NetInfo.fetch();
        wasOfflineRef.current = !initialState.isConnected;
      } catch (err) {
        console.warn("[NETINFO] Failed to init network listener:", err);
      }
    };

    setupNetInfo();

    return () => {
      if (unsubNetInfo) unsubNetInfo();
    };
  }, [resolveDisputedMarkets]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#000000" />
      <View className="flex-1 bg-black">
        <Navbar />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#000000" },
            animation: "slide_from_right",
          }}
        />
        <GlobalToast />
      </View>
    </SafeAreaProvider>
  );
}
