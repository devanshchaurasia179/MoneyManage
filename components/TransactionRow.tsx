import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Transaction } from "../utils/db";
import { SwipeableRow } from "./SwipeableRow";
import { IconIncome, IconExpense } from "./Icons";
import { useTheme } from "../context/ThemeContext";

type Props = {
  transaction: Transaction;
  isArchived: boolean;
  fmt: (n: number) => string;
  onPress: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
  onArchive: (t: Transaction) => void;
};

export const TransactionRow = ({ transaction: t, isArchived, fmt, onPress, onDelete, onArchive }: Props) => {
  const { isDark } = useTheme();

  const C = isDark ? {
    rowBg: "#080f0a",
    rowBorder: "#1a2a1e",
    title: "#e5e7eb",
    category: "#6b7280",
    excluded: "#4b5563",
    iconIncomeBg: "#14321c",
    iconExpenseBg: "#2a1a1a",
  } : {
    rowBg: "#ffffff",
    rowBorder: "#e2e8f0",
    title: "#0f172a",
    category: "#94a3b8",
    excluded: "#cbd5e1",
    iconIncomeBg: "#dcfce7",
    iconExpenseBg: "#fee2e2",
  };

  return (
    <SwipeableRow
      onDelete={() => onDelete(t)}
      onArchive={() => onArchive(t)}
      isArchived={isArchived}
    >
      <TouchableOpacity
        style={[styles.txRow, { backgroundColor: C.rowBg, borderBottomColor: C.rowBorder }]}
        activeOpacity={0.75}
        onPress={() => onPress(t)}
      >
        <View style={[styles.txIcon, { backgroundColor: t.type === "income" ? C.iconIncomeBg : C.iconExpenseBg }]}>
          {t.type === "income"
            ? <IconIncome size={18} color="#2CCE71" />
            : <IconExpense size={18} color="#f87171" />}
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txTitle, { color: C.title }]}>{t.title.toUpperCase()}</Text>
          <Text style={[styles.txCategory, { color: C.category }]}>{t.category.toUpperCase()}</Text>
          {isArchived && t.exclude_from_balance === 1 && (
            <Text style={[styles.txExcluded, { color: C.excluded }]}>excluded from balance</Text>
          )}
        </View>
        <Text style={[styles.txAmount, { color: t.type === "income" ? "#2CCE71" : "#f87171" }]}>
          {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
        </Text>
      </TouchableOpacity>
    </SwipeableRow>
  );
};

const styles = StyleSheet.create({
  txRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: "600" },
  txCategory: { fontSize: 11, marginTop: 2, letterSpacing: 0.8 },
  txExcluded: { fontSize: 10, marginTop: 2, fontStyle: "italic" },
  txAmount: { fontSize: 15, fontWeight: "600" },
});