import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CatIcon } from "./CatIcon";
import { Colors, getCatMeta, fmt } from "./types";
import { Transaction } from "../../utils/db";

interface TxRowProps {
  tx: Transaction;
  C: Colors;
  currency: string;
  onPress: (tx: Transaction) => void;
}

export function TxRow({ tx, C, currency, onPress }: TxRowProps) {
  const isExpense = tx.type === "expense";
  const meta = getCatMeta(tx.category);
  const isStarred = tx.starred === 1;

  return (
    <TouchableOpacity
      onPress={() => onPress(tx)}
      activeOpacity={0.7}
      style={[styles.txRow, { borderBottomColor: C.border }]}
    >
      <View style={[styles.txIconWrap, { backgroundColor: meta.color + "1A" }]}>
        <CatIcon category={tx.category} size={17} color={meta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={[styles.txTitle, { color: C.text }]} numberOfLines={1}>
            {tx.title}
          </Text>
          {isStarred && (
            <Ionicons name="star" size={11} color="#f59e0b" style={{ marginLeft: 5, marginTop: 1 }} />
          )}
        </View>
        <Text style={[styles.txCat, { color: C.textSec }]}>{tx.category}</Text>
      </View>
      <Text style={[styles.txAmount, { color: isExpense ? C.expense : C.income }]}>
        {isExpense ? "−" : "+"}
        {fmt(tx.amount, currency)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  txIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center" },
  txTitle: { fontSize: 14, fontWeight: "600", flexShrink: 1 },
  txCat: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "700" },
});