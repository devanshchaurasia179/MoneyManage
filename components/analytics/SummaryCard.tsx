import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Colors, IconLib } from "./types";

interface SummaryCardProps {
  label: string;
  value: string;
  sub?: string;
  iconName: string;
  iconLib: IconLib;
  iconColor: string;
  C: Colors;
}

export function SummaryCard({
  label,
  value,
  sub,
  iconName,
  iconLib,
  iconColor,
  C,
}: SummaryCardProps) {
  const Icon: any =
    iconLib === "Ionicons"
      ? Ionicons
      : iconLib === "FontAwesome5"
      ? FontAwesome5
      : MaterialCommunityIcons;

  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: C.card, borderColor: C.border },
      ]}
    >
      <View
        style={[
          styles.summaryIconWrap,
          { backgroundColor: iconColor + "1A" },
        ]}
      >
        <Icon name={iconName} size={15} color={iconColor} />
      </View>
      <Text style={[styles.summaryLabel, { color: C.textSec }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: C.text }]}>{value}</Text>
      {sub ? (
        <Text style={[styles.summarySub, { color: C.textSec }]}>{sub}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 3,
  },
  summaryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryValue: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  summarySub: { fontSize: 10, marginTop: 1 },
});
