// metro.config.js — Combines NativeWind + SVG Transformer
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// ─── SVG Transformer ───────────────────────────────────────────────────────
// Allow .svg imports as React components via react-native-svg-transformer
const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...resolver.sourceExts, "svg"],
};

// ─── NativeWind ────────────────────────────────────────────────────────────
module.exports = withNativeWind(config, { input: "./global.css" });
