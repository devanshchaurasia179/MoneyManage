import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Transaction } from "../utils/db";
import { useTheme } from "../context/ThemeContext";
import { ChartRange } from "./constants";

type Props = {
  transactions: Transaction[];
  chartRange: ChartRange;
  onRangeChange: (r: ChartRange) => void;
};

const RANGES: ChartRange[] = ["1W", "1M", "3M", "1Y"];

function buildBars(transactions: Transaction[], range: ChartRange) {
  const now = new Date();
  type Bar = { label: string; income: number; expense: number };
  const bars: Bar[] = [];

  if (range === "1W") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      bars.push({ label: days[d.getDay()], income: 0, expense: 0 });
    }
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diffDays >= 0 && diffDays <= 6) {
        const idx = 6 - diffDays;
        if (t.type === "income") bars[idx].income += t.amount;
        else bars[idx].expense += t.amount;
      }
    });
  } else if (range === "1M") {
    // 4 weeks
    for (let i = 3; i >= 0; i--) {
      bars.push({ label: `W${4 - i}`, income: 0, expense: 0 });
    }
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diffDays >= 0 && diffDays < 28) {
        const weekIdx = Math.floor(diffDays / 7);
        const idx = 3 - weekIdx;
        if (idx >= 0) {
          if (t.type === "income") bars[idx].income += t.amount;
          else bars[idx].expense += t.amount;
        }
      }
    });
  } else if (range === "3M") {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      bars.push({ label: months[d.getMonth()], income: 0, expense: 0 });
    }
    transactions.forEach((t) => {
      const d = new Date(t.date);
      for (let i = 0; i < 3; i++) {
        const ref = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1);
        if (d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()) {
          if (t.type === "income") bars[i].income += t.amount;
          else bars[i].expense += t.amount;
        }
      }
    });
  } else {
    // 1Y — 12 months
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      bars.push({ label: months[d.getMonth()], income: 0, expense: 0 });
    }
    transactions.forEach((t) => {
      const d = new Date(t.date);
      for (let i = 0; i < 12; i++) {
        const ref = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        if (d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()) {
          if (t.type === "income") bars[i].income += t.amount;
          else bars[i].expense += t.amount;
        }
      }
    });
  }

  return bars;
}

export const BarChart = ({ transactions, chartRange, onRangeChange }: Props) => {
  const { isDark } = useTheme();

  const C = isDark ? {
    cardBg: "#0f1b12", cardBorder: "#1f2a22",
    text: "#e5e7eb", subtext: "#6b7280",
    tabBg: "#0a140d", tabActiveBg: "#14532d",
    tabBorder: "#1a3320", tabActiveText: "#2CCE71", tabText: "#6b7280",
    barTrack: "#1a2a1e",
  } : {
    cardBg: "#ffffff", cardBorder: "#e2e8f0",
    text: "#0f172a", subtext: "#94a3b8",
    tabBg: "#f1f5f9", tabActiveBg: "#dcfce7",
    tabBorder: "#e2e8f0", tabActiveText: "#16a34a", tabText: "#94a3b8",
    barTrack: "#f1f5f9",
  };

  const bars = useMemo(() => buildBars(transactions, chartRange), [transactions, chartRange]);

  const maxVal = Math.max(...bars.flatMap((b) => [b.income, b.expense]), 1);

  const fmtShort = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));

  return (
    <View style={[styles.card, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.cardTitle, { color: C.text }]}>Income vs Expenses</Text>
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: "#2CCE71" }]} />
          <Text style={[styles.legendText, { color: C.subtext }]}>Income</Text>
          <View style={[styles.legendDot, { backgroundColor: "#f87171" }]} />
          <Text style={[styles.legendText, { color: C.subtext }]}>Expense</Text>
        </View>
      </View>

      {/* Range tabs */}
      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.rangeTab,
              { backgroundColor: C.tabBg, borderColor: C.tabBorder },
              chartRange === r && { backgroundColor: C.tabActiveBg, borderColor: isDark ? "#16a34a" : "#16a34a" },
            ]}
            onPress={() => onRangeChange(r)}
          >
            <Text style={[
              styles.rangeTabText,
              { color: C.tabText },
              chartRange === r && { color: C.tabActiveText, fontWeight: "700" },
            ]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bars */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barsContainer}>
        {bars.map((bar, i) => {
          const incomeH = Math.max((bar.income / maxVal) * 110, bar.income > 0 ? 4 : 0);
          const expenseH = Math.max((bar.expense / maxVal) * 110, bar.expense > 0 ? 4 : 0);
          return (
            <View key={i} style={styles.barGroup}>
              {/* Value labels */}
              <View style={styles.valueLabels}>
                {bar.income > 0 && (
                  <Text style={[styles.valueLabel, { color: "#2CCE71" }]}>{fmtShort(bar.income)}</Text>
                )}
                {bar.expense > 0 && (
                  <Text style={[styles.valueLabel, { color: "#f87171" }]}>{fmtShort(bar.expense)}</Text>
                )}
              </View>
              {/* Bar pair */}
              <View style={styles.barPair}>
                <View style={[styles.barTrack, { backgroundColor: C.barTrack, height: 110 }]}>
                  <View style={[styles.barFill, { height: incomeH, backgroundColor: "#2CCE71" }]} />
                </View>
                <View style={[styles.barTrack, { backgroundColor: C.barTrack, height: 110 }]}>
                  <View style={[styles.barFill, { height: expenseH, backgroundColor: "#f87171" }]} />
                </View>
              </View>
              <Text style={[styles.barLabel, { color: C.subtext }]}>{bar.label}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 16,
    borderWidth: 1, padding: 16, paddingBottom: 12,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  legend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },
  rangeRow: { flexDirection: "row", gap: 6, marginBottom: 16 },
  rangeTab: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
  },
  rangeTabText: { fontSize: 12 },
  barsContainer: { gap: 8, paddingBottom: 4, alignItems: "flex-end" },
  barGroup: { alignItems: "center", width: 44 },
  valueLabels: { marginBottom: 4, alignItems: "center", minHeight: 28 },
  valueLabel: { fontSize: 9, fontWeight: "600" },
  barPair: { flexDirection: "row", gap: 4, alignItems: "flex-end" },
  barTrack: { width: 16, borderRadius: 6, justifyContent: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", borderRadius: 6 },
  barLabel: { fontSize: 11, marginTop: 6, fontWeight: "500" },
});