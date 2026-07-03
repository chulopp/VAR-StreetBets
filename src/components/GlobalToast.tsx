"use client";

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { useToastStore } from "@/store/useToastStore";

export default function GlobalToast() {
  const { message, isVisible } = useToastStore();
  const [localVisible, setLocalVisible] = useState(false);
  const [localMessage, setLocalMessage] = useState("");

  useEffect(() => {
    if (isVisible && message) {
      setLocalMessage(message);
      setLocalVisible(true);
    } else if (!isVisible && localVisible) {
      const t = setTimeout(() => {
        setLocalVisible(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isVisible, message]);

  if (!localVisible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: isVisible ? 1 : 0, translateY: isVisible ? 0 : -20 }}
        transition={{ type: "timing", duration: 300 }}
        style={styles.toast}
      >
        <View className="flex-row items-center gap-2">
          <View className="w-1.5 h-1.5 rounded-full bg-yellow-500" style={styles.dot} />
          <Text className="text-white text-xs font-bold tracking-wide">{localMessage}</Text>
        </View>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(24,24,27,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
  dot: {
    // animate-pulse handled by Moti on a separate layer if needed
  },
});
