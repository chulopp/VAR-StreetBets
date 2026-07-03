import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Crown, Users, Zap, Shield, Wifi } from "lucide-react-native";
import LogoSvg from "../public/LOGO.svg";

export default function HomePage() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Content Container */}
        <View className="relative z-10 w-full max-w-sm self-center flex-col items-center mt-16">

          {/* Logo & Title */}
          <View className="flex-col items-center gap-3">
            {/* Logo with glow */}
            <View className="relative items-center justify-center">
              <View style={styles.glowBg} />
              <LogoSvg width={96} height={96} />
            </View>

            {/* Title & Badges */}
            <View className="items-center gap-4">
              <Text className="text-3xl font-black tracking-tight text-white">
                VAR STREET BETS
              </Text>

              {/* Feature pills */}
              <View className="flex-row items-center gap-2 flex-wrap justify-center">
                <View style={styles.pill} className="flex-row items-center gap-1 px-2.5 py-1 rounded-full">
                  <Wifi size={12} color="#eab308" />
                  <Text className="text-[10px] font-bold text-zinc-400">Pears P2P</Text>
                </View>
                <View style={styles.pill} className="flex-row items-center gap-1 px-2.5 py-1 rounded-full">
                  <Zap size={12} color="#eab308" />
                  <Text className="text-[10px] font-bold text-zinc-400">QVAC AI</Text>
                </View>
                <View style={styles.pill} className="flex-row items-center gap-1 px-2.5 py-1 rounded-full">
                  <Shield size={12} color="#eab308" />
                  <Text className="text-[10px] font-bold text-zinc-400">WDK Wallet</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Role Selector Buttons */}
          <View className="w-full max-w-xs mx-auto gap-4 mt-8">
            {/* Bandar Button */}
            <Link href="/bandar" asChild>
              <Pressable
                id="btn-role-bandar"
                style={styles.btnYellow}
                className="w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2"
              >
                <Crown size={16} color="#000000" />
                <Text style={styles.btnYellowText} className="text-sm font-black uppercase tracking-wider">
                  OPEN MARKET
                </Text>
              </Pressable>
            </Link>

            {/* Punter Button */}
            <Link href="/punter" asChild>
              <Pressable
                id="btn-role-punter"
                style={styles.btnDark}
                className="w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2"
              >
                <Users size={16} color="#a1a1aa" />
                <Text className="text-sm font-black uppercase tracking-wider text-zinc-300">
                  JOIN MARKET
                </Text>
              </Pressable>
            </Link>
          </View>

          {/* Bottom branding */}
          <View className="items-center pt-4 mt-8">
            <View className="flex-row items-center justify-center gap-1.5">
              <View style={styles.pulseDot} />
              <Text className="text-[10px] text-zinc-600 font-semibold">Mesh Network Ready</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  glowBg: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "rgba(234,179,8,0.1)",
    // blur not supported natively — visual approximation
  },
  pill: {
    backgroundColor: "rgba(24,24,27,0.8)",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  btnYellow: {
    // .btn-3d-yellow
    backgroundColor: "#eab308",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.4)",
    shadowColor: "rgba(234,179,8,0.25)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  btnYellowText: {
    color: "#000000",
  },
  btnDark: {
    // .btn-3d-dark approximation
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#eab308",
  },
});
