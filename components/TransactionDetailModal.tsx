import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Transaction } from "../../utils/db";
import { IconClose, IconArchive, IconRestore, IconTrash } from "./Icons";

type Props = {
  visible: boolean;
  transaction: Transaction | null;
  fmt: (n: number) => string;
  onClose: () => void;
  onArchive: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export const TransactionDetailModal = ({ visible, transaction: t, fmt, onClose, onArchive, onDelete }: Props) => (
  <Modal visible={visible} animationType="fade" transparent>
    <View style={[styles.overlay, { justifyContent: "center", paddingHorizontal: 16 }]}>
      <View style={[styles.sheet, { borderRadius: 20 }]}>
        {t && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Transaction Details</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <IconClose size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={[styles.amountPill, {
              backgroundColor: t.type === "income" ? "#14532d" : "#3b0e0e",
              borderColor: t.type === "income" ? "#16a34a" : "#7f1d1d",
            }]}>
              <Text style={[styles.amountText, { color: t.type === "income" ? "#2CCE71" : "#f87171" }]}>
                {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
              </Text>
              <Text style={styles.typeBadge}>{t.type.toUpperCase()}</Text>
            </View>

            <View style={styles.grid}>
              <DetailRow label="Title" value={t.title} />
              <DetailRow label="Category" value={t.category} />
              <DetailRow label="Date" value={new Date(t.date).toLocaleDateString("en-US", {
                weekday: "short", year: "numeric", month: "long", day: "numeric",
              })} />
              <DetailRow label="Time" value={new Date(t.date).toLocaleTimeString("en-US", {
                hour: "2-digit", minute: "2-digit",
              })} />
              {!!t.note && <DetailRow label="Note" value={t.note} />}
              <DetailRow label="Status" value={
                t.archived === 1
                  ? t.exclude_from_balance === 1
                    ? "Archived · excluded from balance"
                    : "Archived · counted in balance"
                  : "Active"
              } />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: "#1a3320" }]}
                onPress={() => { onClose(); setTimeout(() => onArchive(t), 200); }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {t.archived === 1
                    ? <IconRestore size={14} color="#9ca3af" />
                    : <IconArchive size={14} color="#9ca3af" />}
                  <Text style={{ color: "#9ca3af", fontWeight: "600", fontSize: 13 }}>
                    {t.archived === 1 ? "Restore" : "Archive"}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: "#7f1d1d" }]}
                onPress={() => { onClose(); setTimeout(() => onDelete(t), 200); }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <IconTrash size={14} color="#f87171" />
                  <Text style={{ color: "#f87171", fontWeight: "600", fontSize: 13 }}>Delete</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)" },
  sheet: {
    backgroundColor: "#0f1b12", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, borderTopWidth: 1, borderColor: "#1a3320",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 17, fontWeight: "700", color: "#e5e7eb" },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: "#0a140d",
    borderWidth: 1, borderColor: "#1a3320", alignItems: "center", justifyContent: "center",
  },
  amountPill: { borderRadius: 12, borderWidth: 1, padding: 16, alignItems: "center", marginBottom: 16 },
  amountText: { fontSize: 28, fontWeight: "700" },
  typeBadge: { fontSize: 10, color: "#6b7280", letterSpacing: 1.5, marginTop: 4 },
  grid: { borderRadius: 10, borderWidth: 1, borderColor: "#1a3320", overflow: "hidden", marginBottom: 16 },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 0.5, borderBottomColor: "#1a2a1e",
  },
  detailLabel: { fontSize: 12, color: "#6b7280", flex: 1 },
  detailValue: { fontSize: 13, color: "#e5e7eb", fontWeight: "500", flex: 2, textAlign: "right" },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    alignItems: "center", backgroundColor: "#0a140d",
  },
});
