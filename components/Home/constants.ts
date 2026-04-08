export const SCREEN_WIDTH_OFFSET = 32;
export const SWIPE_THRESHOLD = 60;
export const SWIPE_FULL = -160;

export const DEFAULT_CATEGORIES = [
  "Salary", "Freelance", "Investment", "Paycheck",
  "Groceries", "Food", "Transport", "Shopping",
  "Bills", "Entertainment", "Health", "Other",
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥",
  CAD: "CA$", AUD: "A$", CHF: "CHF", CNY: "¥", KRW: "₩",
};

export const getCurrencySymbol = (code: string) =>
  CURRENCY_SYMBOLS[code?.toUpperCase()] ?? code ?? "$";

export type ChartRange = "1D" | "1W" | "1M" | "3M" | "YTD" | "ALL";
export type ActiveTab = "active" | "archived";

export type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

export type AlertConfig = {
  icon?: "warn" | "info" | "trash" | "archive";
  title: string;
  message: string;
  buttons: AlertButton[];
};

export const PRIMARY = "#2CCE71";
export const PRIMARY_DARK = "#14532d";
export const PRIMARY_BORDER = "#16a34a";
export const BG_MAIN = "#080f0a";
export const BG_CARD = "#0f1b12";
export const BG_INPUT = "#0a140d";
export const BORDER_DIM = "#1a3320";
export const BORDER_MID = "#1f2a22";
export const TEXT_PRIMARY = "#e5e7eb";
export const TEXT_MUTED = "#9ca3af";
export const TEXT_DIM = "#6b7280";
export const TEXT_FAINT = "#4b5563";
export const RED = "#f87171";
export const RED_BG = "#2a1a1a";
export const RED_DARK = "#3b0e0e";
export const RED_BORDER = "#7f1d1d";