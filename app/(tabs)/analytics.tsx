import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import Svg, { Path, Circle, G, Text as SvgText } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { getTransactions, Transaction } from "../../utils/db";

const { width: SW } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────

type TimePeriod = "week" | "month" | "quarter" | "year";
type CategoryBudget = Record<string, number>;
type CategoryStat = {
  category: string;
  total: number;
  count: number;
  budget: number;
  percent: number;
  color: string;
  startAngle: number;
  endAngle: number;
};

// ─── Category meta ────────────────────────────────────────────────────────────

type IconLib = "MaterialCommunityIcons" | "Ionicons" | "FontAwesome5";
type CatMeta = { color: string; lib: IconLib; icon: string };

const CAT_META: Record<string, CatMeta> = {
  Food:          { color: "#FF6B6B", lib: "MaterialCommunityIcons", icon: "food-fork-drink" },
  Transport:     { color: "#4ECDC4", lib: "MaterialCommunityIcons", icon: "car-outline" },
  Shopping:      { color: "#FFD93D", lib: "MaterialCommunityIcons", icon: "shopping-outline" },
  Health:        { color: "#6BCB77", lib: "MaterialCommunityIcons", icon: "heart-pulse" },
  Entertainment: { color: "#FF8B94", lib: "Ionicons",               icon: "film-outline" },
  Utilities:     { color: "#A29BFE", lib: "MaterialCommunityIcons", icon: "lightning-bolt-outline" },
  Education:     { color: "#FFA07A", lib: "Ionicons",               icon: "book-outline" },
  Travel:        { color: "#00CEC9", lib: "MaterialCommunityIcons", icon: "airplane" },
  Housing:       { color: "#FDCB6E", lib: "MaterialCommunityIcons", icon: "home-outline" },
  Salary:        { color: "#2ECC71", lib: "FontAwesome5",           icon: "money-bill-wave" },
  Business:      { color: "#3498DB", lib: "MaterialCommunityIcons", icon: "briefcase-outline" },
  Investment:    { color: "#9B59B6", lib: "FontAwesome5",           icon: "chart-line" },
  Other:         { color: "#95A5A6", lib: "MaterialCommunityIcons", icon: "dots-horizontal-circle-outline" },
};
const DEFAULT_META: CatMeta = { color: "#95A5A6", lib: "MaterialCommunityIcons", icon: "tag-outline" };

function getCatMeta(cat: string): CatMeta { return CAT_META[cat] ?? DEFAULT_META; }

function CatIcon({ category, size, color }: { category: string; size: number; color?: string }) {
  const meta = getCatMeta(category);
  const c = color ?? meta.color;
  if (meta.lib === "Ionicons") return <Ionicons name={meta.icon as any} size={size} color={c} />;
  if (meta.lib === "FontAwesome5") return <FontAwesome5 name={meta.icon as any} size={size} color={c} />;
  return <MaterialCommunityIcons name={meta.icon as any} size={size} color={c} />;
}

// ─── Color builder ────────────────────────────────────────────────────────────

function buildColors(isDark: boolean) {
  return isDark ? {
    bg: "#07090F", surface: "#0D1117", card: "#111827",
    border: "#1F2937", text: "#F9FAFB", textSec: "#9CA3AF",
    textMuted: "#374151", accent: "#10B981", income: "#10B981",
    expense: "#F87171", purple: "#A78BFA", isDark: true,
  } : {
    bg: "#F0F4F8", surface: "#FFFFFF", card: "#FFFFFF",
    border: "#E5E7EB", text: "#111827", textSec: "#6B7280",
    textMuted: "#D1D5DB", accent: "#059669", income: "#059669",
    expense: "#EF4444", purple: "#7C3AED", isDark: false,
  };
}
type Colors = ReturnType<typeof buildColors>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(period: TimePeriod) {
  const now = new Date();
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  if (period === "week") start.setDate(start.getDate() - start.getDay());
  else if (period === "month") start.setDate(1);
  else if (period === "quarter") start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
  else start.setMonth(0, 1);
  return { start, end };
}

function fmt(amount: number, cur = "₹"): string {
  if (amount >= 1e7) return `${cur}${(amount / 1e7).toFixed(1)}Cr`;
  if (amount >= 1e5) return `${cur}${(amount / 1e5).toFixed(1)}L`;
  if (amount >= 1e3) return `${cur}${(amount / 1e3).toFixed(1)}K`;
  return `${cur}${amount.toFixed(0)}`;
}

function fmtDate(str: string) {
  const d = new Date(str);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (str.slice(0, 10) === today) return "Today";
  if (str.slice(0, 10) === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", weekday: "short" });
}

function groupByDay(txs: Transaction[]): Record<string, Transaction[]> {
  return txs.reduce((acc, tx) => {
    const d = tx.date.slice(0, 10);
    (acc[d] = acc[d] || []).push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);
}

// ─── SVG Pie Chart ────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, s: number, e: number) {
  const gap = 1.8;
  const sa = s + gap / 2, ea = e - gap / 2;
  if (ea - sa <= 0) return "";
  const sp = polarToCartesian(cx, cy, r, sa);
  const ep = polarToCartesian(cx, cy, r, ea);
  const large = ea - sa > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${sp.x} ${sp.y} A ${r} ${r} 0 ${large} 1 ${ep.x} ${ep.y} Z`;
}

function PieChart({ stats, selected, onSelect, C, currency, totalExpense }: {
  stats: CategoryStat[]; selected: string | null;
  onSelect: (cat: string | null) => void;
  C: Colors; currency: string; totalExpense: number;
}) {
  const size = SW - 32;
  const cx = size / 2, cy = size / 2;
  const R = size * 0.37;
  const innerR = R * 0.55;
  const selectedStat = stats.find((s) => s.category === selected);

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        {stats.map((s) => {
          const isSel = selected === s.category;
          const expand = isSel ? 11 : 0;
          const midAngle = (s.startAngle + s.endAngle) / 2;
          const rad = ((midAngle - 90) * Math.PI) / 180;
          return (
            <G key={s.category} translateX={expand * Math.cos(rad)} translateY={expand * Math.sin(rad)}>
              <Path
                d={arcPath(cx, cy, R, s.startAngle, s.endAngle)}
                fill={s.color}
                opacity={selected && !isSel ? 0.3 : 1}
                onPress={() => onSelect(isSel ? null : s.category)}
              />
            </G>
          );
        })}
        <Circle cx={cx} cy={cy} r={innerR} fill={C.card} />
        {selectedStat ? (
          <>
            <SvgText x={cx} y={cy - 16} textAnchor="middle" fill={selectedStat.color} fontSize={13} fontWeight="700">
              {selectedStat.category}
            </SvgText>
            <SvgText x={cx} y={cy + 8} textAnchor="middle" fill={C.text} fontSize={22} fontWeight="800">
              {fmt(selectedStat.total, currency)}
            </SvgText>
            <SvgText x={cx} y={cy + 28} textAnchor="middle" fill={C.textSec} fontSize={12}>
              {selectedStat.percent.toFixed(1)}% of spend
            </SvgText>
          </>
        ) : (
          <>
            <SvgText x={cx} y={cy - 8} textAnchor="middle" fill={C.textSec} fontSize={11} fontWeight="600">
              TOTAL SPENT
            </SvgText>
            <SvgText x={cx} y={cy + 16} textAnchor="middle" fill={C.text} fontSize={24} fontWeight="800">
              {fmt(totalExpense, currency)}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

function PeriodTab({ label, value, active, onPress, C }: {
  label: string; value: TimePeriod; active: boolean;
  onPress: (v: TimePeriod) => void; C: Colors;
}) {
  return (
    <TouchableOpacity
      onPress={() => onPress(value)}
      activeOpacity={0.7}
      style={[styles.periodTab, { borderColor: C.border }, active && { backgroundColor: C.accent, borderColor: C.accent }]}
    >
      <Text style={[styles.periodTabText, { color: active ? "#fff" : C.textSec }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SummaryCard({ label, value, sub, iconName, iconLib, iconColor, C }: {
  label: string; value: string; sub?: string;
  iconName: string; iconLib: IconLib; iconColor: string; C: Colors;
}) {
  const Icon: any = iconLib === "Ionicons" ? Ionicons : iconLib === "FontAwesome5" ? FontAwesome5 : MaterialCommunityIcons;
  return (
    <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: C.border }]}>
      <View style={[styles.summaryIconWrap, { backgroundColor: iconColor + "1A" }]}>
        <Icon name={iconName} size={15} color={iconColor} />
      </View>
      <Text style={[styles.summaryLabel, { color: C.textSec }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: C.text }]}>{value}</Text>
      {sub ? <Text style={[styles.summarySub, { color: C.textSec }]}>{sub}</Text> : null}
    </View>
  );
}

function CategoryRow({ stat, C, currency, onBudgetPress, isSelected, onPress }: {
  stat: CategoryStat; C: Colors; currency: string;
  onBudgetPress: (cat: string, cur: number) => void;
  isSelected: boolean; onPress: () => void;
}) {
  const meta = getCatMeta(stat.category);
  const over = stat.budget > 0 && stat.total > stat.budget;
  const fillPct = stat.budget > 0 ? Math.min((stat.total / stat.budget) * 100, 100) : stat.percent;

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
            <Text style={[styles.catAmount, { color: over ? C.expense : C.text }]}>{fmt(stat.total, currency)}</Text>
            {stat.budget > 0 && (
              <Text style={[styles.catBudgetText, { color: C.textSec }]}> / {fmt(stat.budget, currency)}</Text>
            )}
          </View>
        </View>
        <View style={[styles.barTrack, { backgroundColor: C.border }]}>
          <View style={[styles.barFill, { width: `${fillPct}%` as any, backgroundColor: over ? C.expense : meta.color }]} />
        </View>
        <View style={styles.catBottomRow}>
          <Text style={[styles.catMeta, { color: C.textSec }]}>
            {stat.count} txn · {stat.percent.toFixed(1)}%
          </Text>
          {stat.budget > 0 ? (
            <TouchableOpacity onPress={() => onBudgetPress(stat.category, stat.budget)}>
              <Text style={[styles.budgetLink, { color: over ? C.expense : C.accent }]}>
                {over ? "⚠ Over budget" : `${fillPct.toFixed(0)}% used`}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => onBudgetPress(stat.category, 0)}>
              <Text style={[styles.budgetLink, { color: C.accent }]}>+ Set budget</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TxRow({ tx, C, currency }: { tx: Transaction; C: Colors; currency: string }) {
  const isExpense = tx.type === "expense";
  const meta = getCatMeta(tx.category);
  return (
    <View style={[styles.txRow, { borderBottomColor: C.border }]}>
      <View style={[styles.txIconWrap, { backgroundColor: meta.color + "1A" }]}>
        <CatIcon category={tx.category} size={17} color={meta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.txTitle, { color: C.text }]} numberOfLines={1}>{tx.title}</Text>
        <Text style={[styles.txCat, { color: C.textSec }]}>{tx.category}</Text>
      </View>
      <Text style={[styles.txAmount, { color: isExpense ? C.expense : C.income }]}>
        {isExpense ? "−" : "+"}{fmt(tx.amount, currency)}
      </Text>
    </View>
  );
}

function BudgetModal({ visible, category, current, onSave, onClose, C }: {
  visible: boolean; category: string; current: number;
  onSave: (cat: string, amount: number) => void; onClose: () => void; C: Colors;
}) {
  const [val, setVal] = useState(current > 0 ? String(current) : "");
  const meta = getCatMeta(category);
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.modalSheet, { backgroundColor: C.card, borderColor: C.border }]}>
        <View style={[styles.modalHandle, { backgroundColor: C.border }]} />
        <View style={styles.modalHeader}>
          <View style={[styles.modalIconWrap, { backgroundColor: meta.color + "20" }]}>
            <CatIcon category={category} size={22} color={meta.color} />
          </View>
          <View>
            <Text style={[styles.modalTitle, { color: C.text }]}>Monthly Budget</Text>
            <Text style={[styles.modalSub, { color: C.textSec }]}>{category}</Text>
          </View>
        </View>
        <TextInput
          style={[styles.modalInput, { color: C.text, borderColor: C.border, backgroundColor: C.surface }]}
          value={val}
          onChangeText={setVal}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={C.textMuted}
          autoFocus
        />
        <View style={styles.modalActions}>
          <TouchableOpacity onPress={onClose} style={[styles.modalBtnSec, { borderColor: C.border }]}>
            <Text style={{ color: C.textSec, fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { onSave(category, parseFloat(val) || 0); onClose(); }}
            style={[styles.modalBtnPrimary, { backgroundColor: C.accent }]}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Save Budget</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { isDark } = useTheme();
  const C = buildColors(isDark);

  const [period, setPeriod] = useState<TimePeriod>("month");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget>({});
  const [budgetModal, setBudgetModal] = useState<{ category: string; current: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions">("overview");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const currency = "₹";

  useFocusEffect(useCallback(() => {
    setTransactions(getTransactions());
  }, []));

  const filtered = useMemo(() => {
    const { start, end } = getDateRange(period);
    return transactions.filter((tx) => { const d = new Date(tx.date); return d >= start && d <= end; });
  }, [transactions, period]);

  const expenses = useMemo(() => filtered.filter((t) => t.type === "expense"), [filtered]);
  const incomes = useMemo(() => filtered.filter((t) => t.type === "income"), [filtered]);
  const totalExpense = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);
  const totalIncome = useMemo(() => incomes.reduce((s, t) => s + t.amount, 0), [incomes]);
  const totalBudget = useMemo(() => Object.values(budgets).reduce((s, v) => s + v, 0), [budgets]);
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
        s.endAngle = angle + (s.percent / 100) * 360;
        angle = s.endAngle;
        return s;
      });
  }, [expenses, budgets, totalExpense]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);
  const days = useMemo(() => Object.keys(grouped).sort((a, b) => b.localeCompare(a)), [grouped]);

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { backgroundColor: C.bg }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Insights</Text>
        <Text style={[styles.headerSub, { color: C.textSec }]}>
          {period === "week" ? "This week" : period === "month" ? "This month" : period === "quarter" ? "This quarter" : "This year"}
        </Text>
      </View>

      <View style={styles.periodRow}>
        {(["week", "month", "quarter", "year"] as TimePeriod[]).map((p) => (
          <PeriodTab key={p} value={p} label={p[0].toUpperCase() + p.slice(1)} active={period === p} onPress={setPeriod} C={C} />
        ))}
      </View>

      <View style={[styles.sectionTabRow, { borderBottomColor: C.border }]}>
        {(["overview", "transactions"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.sectionTab, activeTab === tab && { borderBottomColor: C.accent, borderBottomWidth: 2.5 }]}
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
            <View style={styles.summaryRow}>
              <SummaryCard label="Spent" value={fmt(totalExpense, currency)} iconName="trending-down" iconLib="Ionicons" iconColor={C.expense} C={C} />
              <SummaryCard label="Income" value={fmt(totalIncome, currency)} iconName="trending-up" iconLib="Ionicons" iconColor={C.income} C={C} />
              <SummaryCard
                label="Budget" value={totalBudget > 0 ? fmt(totalBudget, currency) : "—"}
                sub={totalBudget > 0 ? `${Math.min((totalExpense / totalBudget) * 100, 100).toFixed(0)}% used` : "Not set"}
                iconName="wallet-outline" iconLib="Ionicons" iconColor={C.purple} C={C}
              />
            </View>

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
                  <PieChart stats={categoryStats} selected={selectedCat} onSelect={setSelectedCat} C={C} currency={currency} totalExpense={totalExpense} />
                  <Text style={[styles.pieTip, { color: C.textSec }]}>Tap a slice to inspect · tap again to deselect</Text>
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
                <Text style={[styles.emptyText, { color: C.textSec }]}>Transactions this {period} will appear here.</Text>
              </View>
            )}
          </>
        ) : (
          days.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={54} color={C.textMuted} />
              <Text style={[styles.emptyTitle, { color: C.text }]}>No transactions</Text>
              <Text style={[styles.emptyText, { color: C.textSec }]}>Nothing recorded this {period}.</Text>
            </View>
          ) : (
            days.map((day) => {
              const txs = grouped[day];
              const dayExp = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
              const dayInc = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
              return (
                <View key={day}>
                  <View style={[styles.dayHeader, { borderBottomColor: C.border }]}>
                    <Text style={[styles.dayLabel, { color: C.text }]}>{fmtDate(day)}</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      {dayInc > 0 && <Text style={[{ color: C.income, fontSize: 12, fontWeight: "600" }]}>+{fmt(dayInc, currency)}</Text>}
                      {dayExp > 0 && <Text style={[{ color: C.expense, fontSize: 12, fontWeight: "600" }]}>−{fmt(dayExp, currency)}</Text>}
                    </View>
                  </View>
                  {txs.map((tx) => <TxRow key={tx.id} tx={tx} C={C} currency={currency} />)}
                </View>
              );
            })
          )
        )}
        <View style={{ height: 140 }} />
      </ScrollView>

      {budgetModal && (
        <BudgetModal
          visible category={budgetModal.category} current={budgetModal.current}
          onSave={(cat, amt) => setBudgets((p) => ({ ...p, [cat]: amt }))}
          onClose={() => setBudgetModal(null)} C={C}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: Platform.OS === "ios" ? 56 : 20, paddingHorizontal: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.8 },
  headerSub: { fontSize: 13, marginTop: 2 },

  periodRow: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, gap: 7 },
  periodTab: { flex: 1, paddingVertical: 8, borderRadius: 22, borderWidth: 1, alignItems: "center" },
  periodTabText: { fontSize: 12, fontWeight: "700" },

  sectionTabRow: { flexDirection: "row", paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionTab: { flex: 1, alignItems: "center", paddingVertical: 11 },
  sectionTabText: { fontSize: 14, fontWeight: "700" },

  scroll: { paddingHorizontal: 14, paddingTop: 14 },

  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 12, borderWidth: 1, gap: 3 },
  summaryIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  summaryLabel: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  summaryValue: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  summarySub: { fontSize: 10, marginTop: 1 },

  netChip: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 16,
  },
  netLabel: { fontSize: 13, fontWeight: "600" },
  netValue: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },

  sectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10, marginTop: 4 },

  pieWrap: { borderRadius: 20, borderWidth: 1, marginBottom: 16, overflow: "hidden", paddingBottom: 10 },
  pieTip: { textAlign: "center", fontSize: 11, paddingBottom: 4 },

  catRow: { flexDirection: "row", gap: 12, borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 8 },
  catIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 1 },
  catTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  catName: { fontSize: 14, fontWeight: "700" },
  catAmount: { fontSize: 14, fontWeight: "800" },
  catBudgetText: { fontSize: 12 },
  barTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 5, borderRadius: 3 },
  catBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  catMeta: { fontSize: 11 },
  budgetLink: { fontSize: 11, fontWeight: "700" },

  dayHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 2,
  },
  dayLabel: { fontSize: 13, fontWeight: "700" },

  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  txIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  txTitle: { fontSize: 14, fontWeight: "600" },
  txCat: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "700" },

  emptyWrap: { alignItems: "center", paddingTop: 64, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyText: { fontSize: 13, textAlign: "center", maxWidth: 220 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, padding: 24, paddingBottom: 40, gap: 16 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  modalIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSub: { fontSize: 13, marginTop: 2 },
  modalInput: { borderWidth: 1, borderRadius: 14, padding: 16, fontSize: 28, fontWeight: "800", textAlign: "center" },
  modalActions: { flexDirection: "row", gap: 10 },
  modalBtnSec: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
});