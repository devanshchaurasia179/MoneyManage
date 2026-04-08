import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  totalBalance: number;
  monthlyChange: number;
  fmt: (n: number) => string;
};

export const BalanceCard = ({ totalBalance, monthlyChange, fmt }: Props) => {
  const isPositive = totalBalance >= 0;
  const isMonthlyPositive = monthlyChange >= 0;

  return (
    <LinearGradient
      colors={
        isPositive
          ? ["#0f2d1a", "#0d3d1f", "#0a4a22"]  // green gradient for positive
          : ["#2d0f0f", "#3d0d0d", "#4a0a0a"]  // red gradient for negative
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.balanceCard}
    >
      {/* Accent glow line at top */}
      
      <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
      <Text style={[styles.balanceAmount, { color: isPositive ? "#2CCE71" : "#f87171" }]}>
        {isPositive ? "" : "-"}{fmt(totalBalance)}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.balanceLabel}>MONTHLY CHANGE</Text>
      <Text style={[styles.monthlyChange, { color: isMonthlyPositive ? "#2CCE71" : "#f87171" }]}>
        {isMonthlyPositive ? "+ " : "- "}{fmt(monthlyChange)}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1a3320",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  accentLine: {
    position: "absolute",
    top: 0,
    left: 40,
    right: 40,
    height: 2,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  balanceLabel: {
    fontSize: 11,
    color: "#6b7280",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: "800",
    marginVertical: 6,
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "#1a3320",
    width: "60%",
    marginVertical: 12,
  },
  monthlyChange: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
});
