import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import {
  getTransactions,
  getAllBudgets,
  upsertBudget,
  toggleStar,
  deleteTransaction,
  getUser,
  Transaction,
} from "../../utils/db";

import {
  buildColors, getDateRange, fmt, fmtDate, groupByDay,
  TimePeriod, CategoryStat, CategoryBudget, getCatMeta,
} from "../../components/analytics/types";
import { GlowyPieChart }  from "../../components/analytics/GlowyPieChart";
import { PeriodTab }      from "../../components/analytics/PeriodTab";
import { SummaryCard }    from "../../components/analytics/SummaryCard";
import { CategoryRow }    from "../../components/analytics/CategoryRow";
import { TxRow }          from "../../components/analytics/TxRow";
import { BudgetModal }    from "../../components/analytics/BudgetModal";
import { TransactionDetailModal } from "../../components/Home/TransactionDetailModal";

const SYMBOL_MAP: Record<string, string> = {
  USD: "$",   EUR: "€",   GBP: "£",   INR: "₹",
  JPY: "¥",   CAD: "CA$", AUD: "A$",  CHF: "Fr",
  CNY: "¥",   BRL: "R$",  MXN: "$",   KRW: "₩",
  SGD: "S$",  AED: "د.إ", PKR: "₨",
};

/** Convert a Date to a "YYYY-MM-DD" key matching groupByDay format */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AnalyticsScreen() {
  const { isDark } = useTheme();
  const C = buildColors(isDark);

  const [period, setPeriod]             = useState<TimePeriod>("month");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets]           = useState<CategoryBudget>({});
  const [budgetModal, setBudgetModal]   = useState<{ category: string; current: number } | null>(null);
  const [activeTab, setActiveTab]       = useState<"overview" | "transactions">("overview");
  const [selectedCat, setSelectedCat]   = useState<string | null>(null);
  const [selectedTx, setSelectedTx]     = useState<Transaction | null>(null);
  const [currency, setCurrency]         = useState("$");

  // ── date picker state ─────────────────────────────────────────────────────
  const [filterDate, setFilterDate]         = useState<string | null>(null);
  const [pickerVisible, setPickerVisible]   = useState(false);
  const [pickerDate, setPickerDate]         = useState<Date>(new Date());

  // ── load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    setTransactions(getTransactions());
    setBudgets(getAllBudgets());
    const users = getUser();
    if (users && users.length > 0) {
      const code = users[0].currency ?? "USD";
      setCurrency(SYMBOL_MAP[code] ?? code);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleSetPeriod = useCallback((p: TimePeriod) => {
    setFilterDate(null);
    setPeriod(p);
  }, []);

  const handleSetActiveTab = useCallback((tab: "overview" | "transactions") => {
    setFilterDate(null);
    setActiveTab(tab);
  }, []);

  // ── date picker handlers ──────────────────────────────────────────────────
  const openPicker = useCallback(() => {
    if (filterDate) {
      const [y, m, d] = filterDate.split("-").map(Number);
      setPickerDate(new Date(y, m - 1, d));
    } else {
      setPickerDate(new Date());
    }
    setPickerVisible(true);
  }, [filterDate]);

  const onPickerChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === "android") {
        setPickerVisible(false);
        if (event.type === "set" && date) {
          setFilterDate(toDateKey(date));
        }
      } else {
        if (date) setPickerDate(date);
      }
    },
    []
  );

  const confirmIOSPicker = useCallback(() => {
    setFilterDate(toDateKey(pickerDate));
    setPickerVisible(false);
  }, [pickerDate]);

  const clearFilter = useCallback(() => {
    setFilterDate(null);
    setPickerVisible(false);
  }, []);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleBudgetSave = useCallback((cat: string, amount: number) => {
    upsertBudget(cat, amount);
    setBudgets((prev) => ({ ...prev, [cat]: amount }));
  }, []);

  const handleStar = useCallback((t: Transaction) => {
    toggleStar(t.id, t.starred === 1);
    loadData();
  }, [loadData]);

  const handleDelete = useCallback((t: Transaction) => {
    deleteTransaction(t.id);
    loadData();
  }, [loadData]);

  // ── derived ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const { start, end } = getDateRange(period);
    return transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d >= start && d <= end;
    });
  }, [transactions, period]);

  const expenses     = useMemo(() => filtered.filter((t) => t.type === "expense"), [filtered]);
  const incomes      = useMemo(() => filtered.filter((t) => t.type === "income"),  [filtered]);
  const totalExpense = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0),   [expenses]);
  const totalIncome  = useMemo(() => incomes.reduce((s, t)  => s + t.amount, 0),   [incomes]);
  const totalBudget  = useMemo(() => Object.values(budgets).reduce((s, v) => s + v, 0), [budgets]);
  const net = totalIncome - totalExpense;

  const categoryStats: CategoryStat[] = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    expenses.forEach((tx) => {
      if (!map[tx.category]) map[tx.category] = { total: 0, count: 0 };
      map[tx.category].total += tx.amount;
      map[tx.category].count++;
    });
    let angle = 0;
    return Object.entries(map)
      .map(([cat, { total, count }]) => ({
        category: cat, total, count,
        budget: budgets[cat] ?? 0,
        percent: totalExpense > 0 ? (total / totalExpense) * 100 : 0,
        color: getCatMeta(cat).color,
        startAngle: 0, endAngle: 0,
      }))
      .sort((a, b) => b.total - a.total)
      .map((s) => {
        s.startAngle = angle;
        s.endAngle   = angle + (s.percent / 100) * 360;
        angle = s.endAngle;
        return s;
      });
  }, [expenses, budgets, totalExpense]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);
  const days    = useMemo(
    () => Object.keys(grouped).sort((a, b) => b.localeCompare(a)),
    [grouped]
  );

  const filteredDays = useMemo(() => {
    if (!filterDate) return days;
    return days.filter((d) => d === filterDate);
  }, [days, filterDate]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.bg }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Insights</Text>
        <Text style={[styles.headerSub, { color: C.textSec }]}>
          {period === "week" ? "This week"
            : period === "month" ? "This month"
            : period === "quarter" ? "This quarter"
            : "This year"}
        </Text>
      </View>

      {/* Period tabs */}
      <View style={styles.periodRow}>
        {(["week", "month", "quarter", "year"] as TimePeriod[]).map((p) => (
          <PeriodTab
            key={p} value={p}
            label={p[0].toUpperCase() + p.slice(1)}
            active={period === p} onPress={handleSetPeriod} C={C}
          />
        ))}
      </View>

      {/* Section tabs */}
      <View style={[styles.sectionTabRow, { borderBottomColor: C.border }]}>
        {(["overview", "transactions"] as const).map((tab) => (
          <TouchableOpacity
            key={tab} onPress={() => handleSetActiveTab(tab)}
            style={[
              styles.sectionTab,
              activeTab === tab && { borderBottomColor: C.accent, borderBottomWidth: 2.5 },
            ]}
          >
            <Text style={[styles.sectionTabText, { color: activeTab === tab ? C.accent : C.textSec }]}>
              {tab === "overview" ? "Overview" : "Transactions"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === "overview" ? (
          <>
            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <SummaryCard
                label="Spent" value={fmt(totalExpense, currency)}
                iconName="trending-down" iconLib="Ionicons" iconColor={C.expense} C={C}
              />
              <SummaryCard
                label="Income" value={fmt(totalIncome, currency)}
                iconName="trending-up" iconLib="Ionicons" iconColor={C.income} C={C}
              />
              <SummaryCard
                label="Budget"
                value={totalBudget > 0 ? fmt(totalBudget, currency) : "—"}
                sub={
                  totalBudget > 0
                    ? `${Math.min((totalExpense / totalBudget) * 100, 100).toFixed(0)}% used`
                    : "Not set"
                }
                iconName="wallet-outline" iconLib="Ionicons" iconColor={C.purple} C={C}
              />
            </View>

            {/* Net balance chip */}
            <View style={[styles.netChip, { backgroundColor: C.card, borderColor: C.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <MaterialCommunityIcons name="swap-horizontal" size={16} color={C.textSec} />
                <Text style={[styles.netLabel, { color: C.textSec }]}>Net Balance</Text>
              </View>
              <Text style={[styles.netValue, { color: net >= 0 ? C.income : C.expense }]}>
                {net >= 0 ? "+" : ""}{fmt(net, currency)}
              </Text>
            </View>

            {categoryStats.length > 0 ? (
              <>
                <Text style={[styles.sectionLabel, { color: C.textSec }]}>SPENDING BREAKDOWN</Text>
                <View style={[styles.pieWrap, { backgroundColor: C.card, borderColor: C.border }]}>
                  <GlowyPieChart
                    stats={categoryStats} selected={selectedCat}
                    onSelect={setSelectedCat} C={C}
                    currency={currency} totalExpense={totalExpense}
                  />
                  <Text style={[styles.pieTip, { color: C.textSec }]}>
                    Tap a slice to inspect · tap again to deselect
                  </Text>
                </View>

                <Text style={[styles.sectionLabel, { color: C.textSec }]}>BY CATEGORY</Text>
                {categoryStats.map((stat) => (
                  <CategoryRow
                    key={stat.category} stat={stat} C={C} currency={currency}
                    onBudgetPress={(cat, cur) => setBudgetModal({ category: cat, current: cur })}
                    isSelected={selectedCat === stat.category}
                    onPress={() => setSelectedCat(selectedCat === stat.category ? null : stat.category)}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="chart-donut" size={54} color={C.textMuted} />
                <Text style={[styles.emptyTitle, { color: C.text }]}>No expenses yet</Text>
                <Text style={[styles.emptyText, { color: C.textSec }]}>
                  Transactions this {period} will appear here.
                </Text>
              </View>
            )}
          </>
        ) : days.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={54} color={C.textMuted} />
            <Text style={[styles.emptyTitle, { color: C.text }]}>No transactions</Text>
            <Text style={[styles.emptyText, { color: C.textSec }]}>Nothing recorded this {period}.</Text>
          </View>
        ) : (
          <>
            {/* ── Date picker bar ── */}
            <View style={[styles.datePickerBar, { backgroundColor: C.card, borderColor: C.border }]}>
              <TouchableOpacity
                onPress={openPicker}
                activeOpacity={0.75}
                style={styles.datePickerBtn}
              >
                <Ionicons
                  name="calendar-outline"
                  size={17}
                  color={filterDate ? C.accent : C.textSec}
                  style={{ marginRight: 7 }}
                />
                <Text style={[styles.datePickerBtnText, { color: filterDate ? C.accent : C.textSec }]}>
                  {filterDate ? fmtDate(filterDate) : "Filter by date"}
                </Text>
              </TouchableOpacity>

              {filterDate && (
                <TouchableOpacity
                  onPress={clearFilter}
                  activeOpacity={0.7}
                  style={[styles.clearBtn, { borderColor: C.border }]}
                >
                  <Ionicons name="close" size={14} color={C.textSec} />
                </TouchableOpacity>
              )}
            </View>

            {/* iOS inline picker */}
            {pickerVisible && Platform.OS === "ios" && (
              <View style={[styles.iosPickerWrap, { backgroundColor: C.card, borderColor: C.border }]}>
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="inline"
                  onChange={onPickerChange}
                  maximumDate={new Date()}
                  themeVariant={isDark ? "dark" : "light"}
                  accentColor={C.accent}
                />
                <View style={styles.iosPickerActions}>
                  <TouchableOpacity onPress={clearFilter} style={styles.iosPickerCancelBtn}>
                    <Text style={[styles.iosPickerCancelText, { color: C.textSec }]}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmIOSPicker}
                    style={[styles.iosPickerDoneBtn, { backgroundColor: C.accent }]}
                  >
                    <Text style={styles.iosPickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Android native picker */}
            {pickerVisible && Platform.OS === "android" && (
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="default"
                onChange={onPickerChange}
                maximumDate={new Date()}
              />
            )}

            {/* ── filtered count label ── */}
            {filterDate && (
              <Text style={[styles.filterHint, { color: C.textSec }]}>
                {(grouped[filterDate] ?? []).length} transaction
                {(grouped[filterDate] ?? []).length !== 1 ? "s" : ""} on {fmtDate(filterDate)}
              </Text>
            )}

            {/* ── Transaction list ── */}
            {filteredDays.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="calendar-outline" size={54} color={C.textMuted} />
                <Text style={[styles.emptyTitle, { color: C.text }]}>No transactions</Text>
                <Text style={[styles.emptyText, { color: C.textSec }]}>
                  Nothing recorded on {fmtDate(filterDate!)}.
                </Text>
              </View>
            ) : (
              filteredDays.map((day) => {
                const txs    = grouped[day];
                const dayExp = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
                const dayInc = txs.filter((t) => t.type === "income").reduce((s, t)  => s + t.amount, 0);
                return (
                  <View key={day}>
                    <View style={[styles.dayHeader, { borderBottomColor: C.border }]}>
                      <Text style={[styles.dayLabel, { color: C.text }]}>{fmtDate(day)}</Text>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        {dayInc > 0 && (
                          <Text style={{ color: C.income, fontSize: 12, fontWeight: "600" }}>
                            +{fmt(dayInc, currency)}
                          </Text>
                        )}
                        {dayExp > 0 && (
                          <Text style={{ color: C.expense, fontSize: 12, fontWeight: "600" }}>
                            −{fmt(dayExp, currency)}
                          </Text>
                        )}
                      </View>
                    </View>
                    {txs.map((tx) => (
                      <TxRow key={tx.id} tx={tx} C={C} currency={currency} onPress={setSelectedTx} />
                    ))}
                  </View>
                );
              })
            )}
          </>
        )}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Budget modal */}
      {budgetModal && (
        <BudgetModal
          visible
          category={budgetModal.category}
          current={budgetModal.current}
          onSave={handleBudgetSave}
          onClose={() => setBudgetModal(null)}
          C={C}
        />
      )}

      {/* Transaction detail modal */}
      <TransactionDetailModal
        visible={!!selectedTx}
        transaction={selectedTx}
        fmt={(n) => fmt(n, currency)}
        onClose={() => setSelectedTx(null)}
        onStar={(t) => { setSelectedTx(null); setTimeout(() => handleStar(t), 200); }}
        onDelete={(t) => { setSelectedTx(null); setTimeout(() => handleDelete(t), 200); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.8 },
  headerSub:   { fontSize: 13, marginTop: 2 },
  periodRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 7,
  },
  sectionTabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTab:     { flex: 1, alignItems: "center", paddingVertical: 11 },
  sectionTabText: { fontSize: 14, fontWeight: "700" },
  scroll: { paddingHorizontal: 14, paddingTop: 14 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  netChip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  netLabel: { fontSize: 13, fontWeight: "600" },
  netValue: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
  },
  pieWrap: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
    paddingBottom: 10,
  },
  pieTip: { textAlign: "center", fontSize: 11, paddingBottom: 4 },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 2,
  },
  dayLabel: { fontSize: 13, fontWeight: "700" },
  emptyWrap:  { alignItems: "center", paddingTop: 64, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyText:  { fontSize: 13, textAlign: "center", maxWidth: 220 },

  // ── date picker bar ────────────────────────────────────────────────────
  datePickerBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  datePickerBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // ── iOS picker ─────────────────────────────────────────────────────────
  iosPickerWrap: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
  },
  iosPickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  iosPickerCancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  iosPickerCancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  iosPickerDoneBtn: {
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 10,
  },
  iosPickerDoneText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  filterHint: {
    fontSize: 11,
    marginBottom: 10,
    marginTop: 2,
    paddingLeft: 2,
  },
});