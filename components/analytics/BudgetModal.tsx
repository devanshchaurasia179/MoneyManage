import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { CatIcon } from "./CatIcon";
import { Colors, getCatMeta } from "./types";

interface BudgetModalProps {
  visible: boolean;
  category: string;
  current: number;
  onSave: (cat: string, amount: number) => void;
  onClose: () => void;
  C: Colors;
}

export function BudgetModal({
  visible,
  category,
  current,
  onSave,
  onClose,
  C,
}: BudgetModalProps) {
  const [val, setVal] = useState(current > 0 ? String(current) : "");
  const meta = getCatMeta(category);

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View
        style={[
          styles.modalSheet,
          { backgroundColor: C.card, borderColor: C.border },
        ]}
      >
        <View style={[styles.modalHandle, { backgroundColor: C.border }]} />
        <View style={styles.modalHeader}>
          <View
            style={[styles.modalIconWrap, { backgroundColor: meta.color + "20" }]}
          >
            <CatIcon category={category} size={22} color={meta.color} />
          </View>
          <View>
            <Text style={[styles.modalTitle, { color: C.text }]}>
              Monthly Budget
            </Text>
            <Text style={[styles.modalSub, { color: C.textSec }]}>
              {category}
            </Text>
          </View>
        </View>
        <TextInput
          style={[
            styles.modalInput,
            {
              color: C.text,
              borderColor: C.border,
              backgroundColor: C.surface,
            },
          ]}
          value={val}
          onChangeText={setVal}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={C.textMuted}
          autoFocus
        />
        <View style={styles.modalActions}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.modalBtnSec, { borderColor: C.border }]}
          >
            <Text style={{ color: C.textSec, fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              onSave(category, parseFloat(val) || 0);
              onClose();
            }}
            style={[styles.modalBtnPrimary, { backgroundColor: C.accent }]}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Save Budget</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSub: { fontSize: 13, marginTop: 2 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalBtnSec: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
});
