import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors, TimePeriod } from "./types";

interface PeriodTabProps {
  label: string;
  value: TimePeriod;
  active: boolean;
  onPress: (v: TimePeriod) => void;
  C: Colors;
}

export function PeriodTab({ label, value, active, onPress, C }: PeriodTabProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(value)}
      activeOpacity={0.7}
      style={[
        styles.periodTab,
        { borderColor: C.border },
        active && { backgroundColor: C.accent, borderColor: C.accent },
      ]}
    >
      <Text
        style={[styles.periodTabText, { color: active ? "#fff" : C.textSec }]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
  },
  periodTabText: { fontSize: 12, fontWeight: "700" },
});
