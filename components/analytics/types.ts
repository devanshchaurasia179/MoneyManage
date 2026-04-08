// ─── Types ────────────────────────────────────────────────────────────

export type TimePeriod = "week" | "month" | "quarter" | "year";
export type CategoryBudget = Record<string, number>;
export type IconLib = "MaterialCommunityIcons" | "Ionicons" | "FontAwesome5";

export type CategoryStat = {
  category: string;
  total: number;
  count: number;
  budget: number;
  percent: number;
  color: string;
  startAngle: number;
  endAngle: number;
};

export type CatMeta = { color: string; lib: IconLib; icon: string };

// ─── Colors ───────────────────────────────────────────────────────────

export function buildColors(isDark: boolean) {
  return isDark
    ? {
        bg: "#07090F",
        surface: "#0D1117",
        card: "#111827",
        border: "#1F2937",
        text: "#F9FAFB",
        textSec: "#9CA3AF",
        textMuted: "#374151",
        accent: "#10B981",
        income: "#10B981",
        expense: "#F87171",
        purple: "#A78BFA",
        isDark: true,
      }
    : {
        bg: "#F0F4F8",
        surface: "#FFFFFF",
        card: "#FFFFFF",
        border: "#E5E7EB",
        text: "#111827",
        textSec: "#6B7280",
        textMuted: "#D1D5DB",
        accent: "#059669",
        income: "#059669",
        expense: "#EF4444",
        purple: "#7C3AED",
        isDark: false,
      };
}

export type Colors = ReturnType<typeof buildColors>;

// ─── Category meta ─────────────────────────────────────────────────────

export const CAT_META: Record<string, CatMeta> = {
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

const DEFAULT_META: CatMeta = {
  color: "#95A5A6",
  lib: "MaterialCommunityIcons",
  icon: "tag-outline",
};

export function getCatMeta(cat: string): CatMeta {
  return CAT_META[cat] ?? DEFAULT_META;
}

// ─── Helpers ──────────────────────────────────────────────────────────

export function getDateRange(period: TimePeriod) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "week") start.setDate(start.getDate() - start.getDay());
  else if (period === "month") start.setDate(1);
  else if (period === "quarter") start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
  else start.setMonth(0, 1);
  return { start, end };
}

export function fmt(amount: number, cur = "₹"): string {
  if (amount >= 1e7) return `${cur}${(amount / 1e7).toFixed(1)}Cr`;
  if (amount >= 1e5) return `${cur}${(amount / 1e5).toFixed(1)}L`;
  if (amount >= 1e3) return `${cur}${(amount / 1e3).toFixed(1)}K`;
  return `${cur}${amount.toFixed(0)}`;
}

export function fmtDate(str: string) {
  const d = new Date(str);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (str.slice(0, 10) === today) return "Today";
  if (str.slice(0, 10) === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    weekday: "short",
  });
}

export function groupByDay(
  txs: import("../../utils/db").Transaction[]
): Record<string, import("../../utils/db").Transaction[]> {
  return txs.reduce((acc, tx) => {
    const d = tx.date.slice(0, 10);
    (acc[d] = acc[d] || []).push(tx);
    return acc;
  }, {} as Record<string, import("../../utils/db").Transaction[]>);
}
