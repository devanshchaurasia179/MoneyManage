import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CatIcon } from "./CatIcon";
import { Colors, CategoryStat, getCatMeta, fmt } from "./types";

interface CategoryRowProps {
  stat: CategoryStat;
  C: Colors;
  currency: string;
  onBudgetPress: (cat: string, cur: number) => void;
  isSelected: boolean;
  onPress: () => void;
}

export function CategoryRow({
  stat,
  C,
  currency,
  onBudgetPress,
  isSelected,
  onPress,
}: CategoryRowProps) {
  const meta = getCatMeta(stat.category);
  const over = stat.budget > 0 && stat.total > stat.budget;
  const fillPct =
    stat.budget > 0
      ? Math.min((stat.total / stat.budget) * 100, 100)
      : stat.percent;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.72}
      style={[
        styles.catRow,
        { backgroundColor: C.card, borderColor: isSelected ? meta.color : C.border },
        isSelected && { borderWidth: 1.5 },
      ]}
    >
      <View style={[styles.catIconWrap, { backgroundColor: meta.color + "1A" }]}>
        <CatIcon category={stat.category} size={18} color={meta.color} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.catTopRow}>
          <Text style={[styles.catName, { color: C.text }]}>{stat.category}</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text
              style={[
                styles.catAmount,
                { color: over ? C.expense : C.text },
              ]}
            >
              {fmt(stat.total, currency)}
            </Text>
            {stat.budget > 0 && (
              <Text style={[styles.catBudgetText, { color: C.textSec }]}>
                {" "}/ {fmt(stat.budget, currency)}
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.barTrack, { backgroundColor: C.border }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${fillPct}%` as any,
                backgroundColor: over ? C.expense : meta.color,
              },
            ]}
          />
        </View>
        <View style={styles.catBottomRow}>
          <Text style={[styles.catMeta, { color: C.textSec }]}>
            {stat.count} txn · {stat.percent.toFixed(1)}%
          </Text>
          {stat.budget > 0 ? (
            <TouchableOpacity onPress={() => onBudgetPress(stat.category, stat.budget)}>
              <Text
                style={[
                  styles.budgetLink,
                  { color: over ? C.expense : C.accent },
                ]}
              >
                {over ? "⚠ Over budget" : `${fillPct.toFixed(0)}% used`}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => onBudgetPress(stat.category, 0)}>
              <Text style={[styles.budgetLink, { color: C.accent }]}>
                + Set budget
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  catRow: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  catIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  catTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  catName: { fontSize: 14, fontWeight: "700" },
  catAmount: { fontSize: 14, fontWeight: "800" },
  catBudgetText: { fontSize: 12 },
  barTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 5, borderRadius: 3 },
  catBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  catMeta: { fontSize: 11 },
  budgetLink: { fontSize: 11, fontWeight: "700" },
});
