import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function OffersScreen() {
  const { isDark } = useTheme();

  const C = isDark ? {
    bg: "#080C12", text: "#ffffff", subtext: "#64748b",
  } : {
    bg: "#f8fafc", text: "#0f172a", subtext: "#64748b",
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <Text style={[styles.title, { color: C.text }]}>Special Deals</Text>
      <Text style={[styles.sub, { color: C.subtext }]}>Offers and promotions will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 14 },
});