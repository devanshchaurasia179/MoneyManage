import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Transaction } from "../../utils/db";
import { useTheme } from "../../context/ThemeContext";
import { IconClose, IconTrash } from "./Icons";

type Props = {
  visible: boolean;
  transaction: Transaction | null;
  fmt: (n: number) => string;
  onClose: () => void;
  onStar: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
};

const DetailRow = ({
  label,
  value,
  labelColor,
  valueColor,
  borderColor,
}: {
  label: string;
  value: string;
  labelColor: string;
  valueColor: string;
  borderColor: string;
}) => (
  <View style={[styles.detailRow, { borderBottomColor: borderColor }]}>
    <Text style={[styles.detailLabel, { color: labelColor }]}>{label}</Text>
    <Text style={[styles.detailValue, { color: valueColor }]}>{value}</Text>
  </View>
);

export const TransactionDetailModal = ({
  visible, transaction: t, fmt, onClose, onStar, onDelete,
}: Props) => {
  const { isDark } = useTheme();

  const C = isDark ? {
    overlay:      "rgba(0,0,0,0.75)",
    sheet:        "#0f1b12",
    sheetBorder:  "#1a3320",
    title:        "#e5e7eb",
    closeBg:      "#0a140d",
    closeBorder:  "#1a3320",
    closeIcon:    "#6b7280",
    gridBorder:   "#1a3320",
    rowBorder:    "#1a2a1e",
    labelColor:   "#6b7280",
    valueColor:   "#e5e7eb",
    actionBg:     "#0a140d",
    starBorder:   "#854d0e",
    starColor:    "#f59e0b",
    starText:     "#f59e0b",
    deleteBorder: "#7f1d1d",
    deleteColor:  "#f87171",
    subtext:      "#6b7280",
    incomePill:   { bg: "#14532d", border: "#16a34a", text: "#2CCE71" },
    expensePill:  { bg: "#3b0e0e", border: "#7f1d1d", text: "#f87171" },
  } : {
    overlay:      "rgba(0,0,0,0.5)",
    sheet:        "#ffffff",
    sheetBorder:  "#e2e8f0",
    title:        "#0f172a",
    closeBg:      "#f8fafc",
    closeBorder:  "#e2e8f0",
    closeIcon:    "#64748b",
    gridBorder:   "#e2e8f0",
    rowBorder:    "#f1f5f9",
    labelColor:   "#94a3b8",
    valueColor:   "#0f172a",
    actionBg:     "#f8fafc",
    starBorder:   "#d97706",
    starColor:    "#d97706",
    starText:     "#b45309",
    deleteBorder: "#fca5a5",
    deleteColor:  "#dc2626",
    subtext:      "#94a3b8",
    incomePill:   { bg: "#dcfce7", border: "#86efac", text: "#15803d" },
    expensePill:  { bg: "#fee2e2", border: "#fca5a5", text: "#dc2626" },
  };

  const isStarred = t?.starred === 1;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[styles.overlay, { backgroundColor: C.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: C.sheet, borderColor: C.sheetBorder }]}>
          {t && (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: C.title }]}>Transaction Details</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: C.closeBg, borderColor: C.closeBorder }]}
                >
                  <IconClose size={16} color={C.closeIcon} />
                </TouchableOpacity>
              </View>

              {/* Amount pill */}
              {(() => {
                const pill = t.type === "income" ? C.incomePill : C.expensePill;
                return (
                  <View style={[styles.amountPill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
                    {isStarred && (
                      <View style={styles.starPillBadge}>
                        <Ionicons name="star" size={12} color={C.starColor} />
                        <Text style={[styles.starPillText, { color: C.starColor }]}>Saved</Text>
                      </View>
                    )}
                    <Text style={[styles.amountText, { color: pill.text }]}>
                      {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                    </Text>
                    <Text style={[styles.typeBadge, { color: C.subtext }]}>
                      {t.type.toUpperCase()}
                    </Text>
                  </View>
                );
              })()}

              {/* Detail grid */}
              <View style={[styles.grid, { borderColor: C.gridBorder }]}>
                <DetailRow label="Title"    value={t.title}    labelColor={C.labelColor} valueColor={C.valueColor} borderColor={C.rowBorder} />
                <DetailRow label="Category" value={t.category} labelColor={C.labelColor} valueColor={C.valueColor} borderColor={C.rowBorder} />
                <DetailRow
                  label="Date"
                  value={new Date(t.date).toLocaleDateString("en-US", {
                    weekday: "short", year: "numeric", month: "long", day: "numeric",
                  })}
                  labelColor={C.labelColor} valueColor={C.valueColor} borderColor={C.rowBorder}
                />
                <DetailRow
                  label="Time"
                  value={new Date(t.date).toLocaleTimeString("en-US", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                  labelColor={C.labelColor} valueColor={C.valueColor} borderColor={C.rowBorder}
                />
                {!!t.note && (
                  <DetailRow label="Note" value={t.note} labelColor={C.labelColor} valueColor={C.valueColor} borderColor={C.rowBorder} />
                )}
                <DetailRow
                  label="Status"
                  value={
                    isStarred
                      ? t.exclude_from_balance === 1
                        ? "Starred · excluded from balance"
                        : "Starred · counted in balance"
                      : "Active"
                  }
                  labelColor={C.labelColor}
                  valueColor={C.valueColor}
                  borderColor="transparent"
                />
              </View>

              {/* Action buttons */}
              <View style={styles.actions}>
                {/* Star / Unstar */}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: C.actionBg, borderColor: C.starBorder }]}
                  onPress={() => { onClose(); setTimeout(() => onStar(t), 200); }}
                >
                  <Ionicons
                    name={isStarred ? "star" : "star-outline"}
                    size={14}
                    color={C.starColor}
                  />
                  <Text style={[styles.actionText, { color: C.starText }]}>
                    {isStarred ? "Unstar" : "Star"}
                  </Text>
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: C.actionBg, borderColor: C.deleteBorder }]}
                  onPress={() => { onClose(); setTimeout(() => onDelete(t), 200); }}
                >
                  <IconTrash size={14} color={C.deleteColor} />
                  <Text style={[styles.actionText, { color: C.deleteColor }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  sheet: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: "700" },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  amountPill: {
    borderRadius: 12, borderWidth: 1,
    padding: 16, alignItems: "center", marginBottom: 16,
  },
  starPillBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6,
  },
  starPillText: { fontSize: 11, fontWeight: "600" },
  amountText: { fontSize: 28, fontWeight: "700" },
  typeBadge:  { fontSize: 10, letterSpacing: 1.5, marginTop: 4 },

  grid: {
    borderRadius: 10, borderWidth: 1,
    overflow: "hidden", marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 0.5,
  },
  detailLabel: { fontSize: 12, flex: 1 },
  detailValue: { fontSize: 13, fontWeight: "500", flex: 2, textAlign: "right" },

  actions: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6,
  },
  actionText: { fontWeight: "600", fontSize: 13 },
});