import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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

// ── Empty state: Recent tab ────────────────────────────────────────────────────
function EmptyRecent({
  C, isDark, onAdd,
}: {
  C: ColorScheme; isDark: boolean; onAdd: () => void;
}) {
  const starColor  = isDark ? "#EF9F27" : "#d97706";
  const starBorder = isDark ? "#854F0B" : "#d97706";
  const starBg     = isDark ? "#1c1200" : "#fffbeb";

  return (
    <View style={[es.well, { backgroundColor: C.cardBg, borderColor: C.sectionBorder }]}>
      <View style={[es.iconRing, { borderColor: C.sectionBorder, backgroundColor: C.bg }]}>
        <Ionicons name="receipt-outline" size={24} color={C.subtext} />
      </View>

      <Text style={[es.title, { color: C.text }]}>No transactions yet</Text>
      <Text style={[es.sub, { color: C.subtext }]}>
        Start tracking your income and expenses to see them here.
      </Text>

      <View style={es.steps}>
        {[
          "Tap Add Transaction above",
          "Enter a title, amount, and category",
          "Your balance updates instantly",
        ].map((step, i) => (
          <View key={i}>
            <View style={es.stepRow}>
              <View style={[es.stepNum, {
                backgroundColor: C.addBtn, borderColor: C.addBorder,
              }]}>
                <Text style={[es.stepNumText, { color: C.addText }]}>{i + 1}</Text>
              </View>
              <Text style={[es.stepText, { color: C.subtext }]}>{step}</Text>
            </View>
            {i < 2 && (
              <View style={[es.stepLine, { backgroundColor: C.addBorder }]} />
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[es.cta, { backgroundColor: C.addBtn, borderColor: C.addBorder }]}
        onPress={onAdd}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={14} color={C.addText} />
        <Text style={[es.ctaText, { color: C.addText }]}>Add your first transaction</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Empty state: Starred tab ───────────────────────────────────────────────────
function EmptyStarred({ C, isDark }: { C: ColorScheme; isDark: boolean }) {
  const starColor  = isDark ? "#EF9F27" : "#d97706";
  const starBorder = isDark ? "#854F0B" : "#d97706";
  const starBg     = isDark ? "#1c1200" : "#fffbeb";

  return (
    <View style={[es.well, { backgroundColor: C.cardBg, borderColor: C.sectionBorder }]}>
      <View style={[es.iconRing, {
        borderColor: starBorder,
        backgroundColor: starBg,
      }]}>
        <Ionicons name="star-outline" size={24} color={starColor} />
      </View>

      <Text style={[es.title, { color: C.text }]}>No starred transactions</Text>
      <Text style={[es.sub, { color: C.subtext }]}>
        Star transactions you want to track closely — like recurring bills or big purchases.
      </Text>

      <View style={[es.swipeHint, { backgroundColor: C.bg, borderColor: C.sectionBorder }]}>
        <View style={[es.swipeIconWrap, { backgroundColor: C.cardBg, borderColor: C.sectionBorder }]}>
          <Ionicons name="arrow-back-outline" size={14} color={C.subtext} />
        </View>
        <Text style={[es.swipeText, { color: C.subtext }]}>
          Swipe left on any transaction, then tap the star icon
        </Text>
      </View>
    </View>
  );
}

// ── Color scheme type ──────────────────────────────────────────────────────────
type ColorScheme = {
  bg: string; text: string; subtext: string;
  active: string; cardBg: string; cardBorder: string;
  addBtn: string; addBorder: string; addText: string;
  tabBg: string; tabBorder: string;
  tabText: string; tabTextActive: string;
  sectionBorder: string; hint: string; empty: string;
};

// ── HomeScreen ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { isDark } = useTheme();

  const C: ColorScheme = isDark ? {
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

  const [transactions, setTransactions]             = useState<Transaction[]>([]);
  const [starredTxs, setStarredTxs]                 = useState<Transaction[]>([]);
  const [activeTab, setActiveTab]                   = useState<ActiveTab>("active");
  const [currency, setCurrency]                     = useState("$");
  const [addModalVisible, setAddModalVisible]       = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTx, setSelectedTx]                 = useState<Transaction | null>(null);
  const [alertConfig, setAlertConfig]               = useState<AlertConfig | null>(null);
  const [categories, setCategories]                 = useState<string[]>(DEFAULT_CATEGORIES);
  const [chartRange, setChartRange]                 = useState<ChartRange>("1M");

  const showAlert    = (config: AlertConfig) => setAlertConfig(config);
  const dismissAlert = () => setAlertConfig(null);

  useFocusEffect(
    useCallback(() => {
      initDB();
      loadAll();
    }, [])
  );

  const loadAll = () => {
    const all = getTransactions();
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

  const totalBalance = transactions
    .filter((t) => t.exclude_from_balance === 0)
    .reduce((acc, t) => (t.type === "income" ? acc + t.amount : acc - t.amount), 0);

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

  const handleStar = (tx: Transaction) => {
    toggleStar(tx.id, tx.starred === 1);
    loadAll();
  };

  const handleAddCategory = (cat: string) => {
    if (!categories.includes(cat)) setCategories((p) => [...p, cat]);
  };

  const recentList  = transactions.slice(0, 20);
  const starredList = starredTxs;

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <UIAlertModal config={alertConfig} onDismiss={dismissAlert} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <BalanceCard
          totalBalance={totalBalance}
          monthlyChange={monthlyChange}
          fmt={fmt}
        />

        <BarChart
          transactions={transactions}
          chartRange={chartRange}
          onRangeChange={setChartRange}
        />

        {/* Add button */}
        <View style={styles.addRow}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: C.addBtn, borderColor: C.addBorder }]}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.8}
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
                {tab === "active" ? "Recent" : `Starred (${starredTxs.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction list */}
        <View style={styles.section}>
          {activeTab === "active" ? (
            recentList.length === 0
              ? <EmptyRecent C={C} isDark={isDark} onAdd={() => setAddModalVisible(true)} />
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
              ? <EmptyStarred C={C} isDark={isDark} />
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

          {activeTab === "active" && recentList.length > 0 && (
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

// ── Styles ─────────────────────────────────────────────────────────────────────
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
  hint: { fontSize: 11, textAlign: "center", marginTop: 12, letterSpacing: 0.4 },
});

// ── Empty state styles ─────────────────────────────────────────────────────────
const es = StyleSheet.create({
  well: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  iconRing: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 1.5, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 15, fontWeight: "600", textAlign: "center" },
  sub: {
    fontSize: 13, textAlign: "center",
    lineHeight: 20, maxWidth: 240,
  },
  // Steps
  steps: { width: "100%", maxWidth: 240, marginTop: 4 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepNum: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  stepNumText: { fontSize: 11, fontWeight: "700" },
  stepText: { flex: 1, fontSize: 12, lineHeight: 20 },
  stepLine: {
    width: 1, height: 10,
    marginLeft: 9.5, opacity: 0.35, marginVertical: 2,
  },
  // CTA button
  cta: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, marginTop: 4,
  },
  ctaText: { fontSize: 13, fontWeight: "600" },
  // Swipe hint
  swipeHint: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1,
    width: "100%", maxWidth: 270, marginTop: 4,
  },
  swipeIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  swipeText: { flex: 1, fontSize: 12, lineHeight: 18 },
});