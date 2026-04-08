import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  initDB, getTransactions, getStarredTransactions,
  addTransaction, deleteTransaction, toggleStar,
  getUser, Transaction,
} from "../../utils/db";
import { useTheme } from "../../context/ThemeContext";

import { UIAlertModal } from "../../components/Home/UIAlertModal";
import { BalanceCard } from "../../components/Home/BalanceCard";
import { BarChart } from "../../components/Home/BarChart";
import { TransactionRow } from "../../components/Home/TransactionRow";
import { AddTransactionModal, FormState } from "../../components/Home/AddTransactionModal";
import { TransactionDetailModal } from "../../components/Home/TransactionDetailModal";
import { IconPlus } from "../../components/Home/Icons";
import {
  DEFAULT_CATEGORIES, getCurrencySymbol,
  ChartRange, ActiveTab, AlertConfig,
} from "../../components/Home/constants";

export default function HomeScreen() {
  const { isDark } = useTheme();

  const C = isDark ? {
    bg: "#080f0a", text: "#e5e7eb", subtext: "#9ca3af",
    active: "#2ECC71", cardBg: "#0f1b12", cardBorder: "#1f2a22",
    addBtn: "#14532d", addBorder: "#16a34a", addText: "#2CCE71",
    tabBg: "#0f1b12", tabBorder: "#16a34a",
    tabText: "#6b7280", tabTextActive: "#2CCE71",
    sectionBorder: "#1f2a22", hint: "#374151", empty: "#4b5563",
  } : {
    bg: "#f8fafc", text: "#0f172a", subtext: "#64748b",
    active: "#16a34a", cardBg: "#ffffff", cardBorder: "#e2e8f0",
    addBtn: "#dcfce7", addBorder: "#16a34a", addText: "#16a34a",
    tabBg: "#f0fdf4", tabBorder: "#16a34a",
    tabText: "#94a3b8", tabTextActive: "#16a34a",
    sectionBorder: "#e2e8f0", hint: "#94a3b8", empty: "#94a3b8",
  };

  const [transactions, setTransactions]     = useState<Transaction[]>([]);
  const [starredTxs, setStarredTxs]         = useState<Transaction[]>([]);
  const [activeTab, setActiveTab]           = useState<ActiveTab>("active");
  const [currency, setCurrency]             = useState("$");
  const [addModalVisible, setAddModalVisible]       = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTx, setSelectedTx]         = useState<Transaction | null>(null);
  const [alertConfig, setAlertConfig]       = useState<AlertConfig | null>(null);
  const [categories, setCategories]         = useState<string[]>(DEFAULT_CATEGORIES);
  const [chartRange, setChartRange]         = useState<ChartRange>("1M");

  const showAlert   = (config: AlertConfig) => setAlertConfig(config);
  const dismissAlert = () => setAlertConfig(null);

  useFocusEffect(
    useCallback(() => {
      initDB();
      loadAll();
    }, [])
  );

  const loadAll = () => {
    const all = getTransactions();        // ALL transactions, starred + unstarred
    setTransactions(all);
    setStarredTxs(getStarredTransactions());
    const users = getUser();
    if (users.length > 0) setCurrency(getCurrencySymbol(users[0].currency));
  };

  const fmt = (n: number) =>
    `${currency}${Math.abs(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Balance uses all transactions except those explicitly excluded
  const totalBalance = transactions
    .filter((t) => t.exclude_from_balance === 0)
    .reduce((acc, t) => (t.type === "income" ? acc + t.amount : acc - t.amount), 0);

  // Monthly change = current month transactions (all, not just unstarred)
  const now = new Date();
  const monthlyChange = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear() &&
        t.exclude_from_balance === 0
      );
    })
    .reduce((acc, t) => (t.type === "income" ? acc + t.amount : acc - t.amount), 0);

  const handleSave = (form: FormState) => {
    addTransaction(
      form.title.trim(), parseFloat(form.amount), form.type,
      form.category.trim(), form.date.toISOString(), form.note.trim()
    );
    setAddModalVisible(false);
    loadAll();
  };

  const handleDelete = (tx: Transaction) => {
    showAlert({
      icon: "trash",
      title: "Delete Transaction",
      message: `Remove "${tx.title}" (${tx.type === "income" ? "+" : "-"}${fmt(tx.amount)})? This cannot be undone.`,
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: () => { deleteTransaction(tx.id); loadAll(); },
        },
      ],
    });
  };

  // Star = bookmark. Transaction stays visible in Recent, just gets a star badge.
  const handleStar = (tx: Transaction) => {
    toggleStar(tx.id, tx.starred === 1);
    loadAll();
  };

  const handleAddCategory = (cat: string) => {
    if (!categories.includes(cat)) setCategories((p) => [...p, cat]);
  };

  // What to show in the active tab — all transactions (starred show with a star icon)
  const recentList  = transactions.slice(0, 20);
  const starredList = starredTxs;

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <UIAlertModal config={alertConfig} onDismiss={dismissAlert} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Balance Card */}
        <BalanceCard totalBalance={totalBalance} monthlyChange={monthlyChange} fmt={fmt} />

        {/* Chart */}
        <BarChart transactions={transactions} chartRange={chartRange} onRangeChange={setChartRange} />

        {/* Add button */}
        <View style={styles.addRow}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: C.addBtn, borderColor: C.addBorder }]}
            onPress={() => setAddModalVisible(true)}
          >
            <IconPlus size={14} color={C.addText} />
            <Text style={[styles.addBtnText, { color: C.addText }]}>Add Transaction</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(["active", "starred"] as ActiveTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                { borderColor: C.sectionBorder },
                activeTab === tab && { backgroundColor: C.tabBg, borderColor: C.tabBorder },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                { color: C.tabText },
                activeTab === tab && { color: C.tabTextActive, fontWeight: "700" },
              ]}>
                {tab === "active"
                  ? "Recent"
                  : `Starred (${starredTxs.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction List */}
        <View style={styles.section}>
          {activeTab === "active" ? (
            recentList.length === 0
              ? <Text style={[styles.emptyText, { color: C.empty }]}>
                  No transactions yet. Tap "Add Transaction" to get started.
                </Text>
              : recentList.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  fmt={fmt}
                  onPress={(tx) => { setSelectedTx(tx); setDetailModalVisible(true); }}
                  onDelete={handleDelete}
                  onStar={handleStar}
                />
              ))
          ) : (
            starredList.length === 0
              ? <Text style={[styles.emptyText, { color: C.empty }]}>
                  No starred transactions yet. Swipe left and tap the star to save one.
                </Text>
              : starredList.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  fmt={fmt}
                  onPress={(tx) => { setSelectedTx(tx); setDetailModalVisible(true); }}
                  onDelete={handleDelete}
                  onStar={handleStar}
                />
              ))
          )}
          {activeTab === "active" && transactions.length > 0 && (
            <Text style={[styles.hint, { color: C.hint }]}>← swipe left to star or delete</Text>
          )}
        </View>
      </ScrollView>

      <AddTransactionModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleSave}
        showAlert={showAlert}
        categories={categories}
        onAddCategory={handleAddCategory}
      />

      <TransactionDetailModal
        visible={detailModalVisible}
        transaction={selectedTx}
        fmt={fmt}
        onClose={() => setDetailModalVisible(false)}
        onStar={handleStar}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 100 },
  addRow: { paddingHorizontal: 16, marginBottom: 14, marginTop: 4 },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  addBtnText: { fontSize: 14, fontWeight: "700" },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 8, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1, alignItems: "center",
  },
  tabText: { fontSize: 12, fontWeight: "500" },
  section: { marginHorizontal: 16, marginBottom: 24 },
  emptyText: { fontSize: 14, textAlign: "center", marginTop: 16 },
  hint: { fontSize: 11, textAlign: "center", marginTop: 12, letterSpacing: 0.4 },
});