import React, { useState } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, FlatList, StyleSheet,
} from "react-native";
import { IconClose } from "./Icons";
import { DateTimePicker } from "./DateTimePicker";
import { AlertConfig } from "./constants";
import { useTheme } from "../../context/ThemeContext";

export type FormState = {
  title: string;
  amount: string;
  type: "income" | "expense";
  category: string;
  note: string;
  date: Date;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (form: FormState) => void;
  showAlert: (config: AlertConfig) => void;
  categories: string[];
  onAddCategory: (cat: string) => void;
};

const DEFAULT_FORM: FormState = {
  title: "", amount: "", type: "expense", category: "", note: "", date: new Date(),
};

export const AddTransactionModal = ({
  visible, onClose, onSave, showAlert, categories, onAddCategory,
}: Props) => {
  const { isDark } = useTheme();
  const C = isDark ? {
    overlay: "rgba(0,0,0,0.75)",
    sheetBg: "#0f1b12", sheetBorder: "#1a3320",
    title: "#e5e7eb",
    closeBg: "#0a140d", closeBorder: "#1a3320",
    toggleBg: "#0a140d",
    inputBg: "#0a140d", inputBorder: "#1a3320", inputText: "#e5e7eb", inputPlaceholder: "#4b5563",
    catPlaceholder: "#4b5563", catText: "#e5e7eb",
    fieldLabel: "#6b7280",
    submitBg: "#16a34a",
    newCatBtnBg: "#14532d", newCatBtnBorder: "#16a34a", newCatBtnText: "#2CCE71",
    catRowBorder: "#1a2a1e", catRowActiveBg: "#0d2214",
    catRowText: "#9ca3af", catRowTextActive: "#2CCE71",
  } : {
    overlay: "rgba(0,0,0,0.5)",
    sheetBg: "#ffffff", sheetBorder: "#e2e8f0",
    title: "#0f172a",
    closeBg: "#f1f5f9", closeBorder: "#e2e8f0",
    toggleBg: "#f1f5f9",
    inputBg: "#f8fafc", inputBorder: "#e2e8f0", inputText: "#0f172a", inputPlaceholder: "#94a3b8",
    catPlaceholder: "#94a3b8", catText: "#0f172a",
    fieldLabel: "#94a3b8",
    submitBg: "#16a34a",
    newCatBtnBg: "#dcfce7", newCatBtnBorder: "#16a34a", newCatBtnText: "#16a34a",
    catRowBorder: "#e2e8f0", catRowActiveBg: "#f0fdf4",
    catRowText: "#64748b", catRowTextActive: "#16a34a",
  };

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const handleClose = () => { setForm(DEFAULT_FORM); onClose(); };

  const handleSave = () => {
    const { title, amount, category } = form;
    if (!title.trim() || !amount.trim() || !category.trim()) {
      showAlert({ icon: "warn", title: "Missing Fields", message: "Please fill in the title, amount, and category before saving.", buttons: [{ text: "Got it", style: "default" }] });
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      showAlert({ icon: "warn", title: "Invalid Amount", message: "Please enter a valid positive number for the amount.", buttons: [{ text: "OK", style: "default" }] });
      return;
    }
    onSave(form);
    setForm(DEFAULT_FORM);
  };

  const handleAddCategory = () => {
    const cat = newCategoryInput.trim();
    if (!cat) return;
    onAddCategory(cat);
    setForm((f) => ({ ...f, category: cat }));
    setNewCategoryInput("");
    setCategoryModalVisible(false);
  };

  const sheetStyle = { backgroundColor: C.sheetBg, borderTopWidth: 1, borderColor: C.sheetBorder };
  const inputStyle = { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.inputText };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.overlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.sheet, sheetStyle]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: C.title }]}>Add Transaction</Text>
              <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: C.closeBg, borderColor: C.closeBorder }]}>
                <IconClose size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={[styles.typeToggle, { backgroundColor: C.toggleBg }]}>
              {(["expense", "income"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn,
                    form.type === t && (t === "income"
                      ? { backgroundColor: isDark ? "#14532d" : "#dcfce7" }
                      : { backgroundColor: isDark ? "#3b0e0e" : "#fee2e2" })
                  ]}
                  onPress={() => setForm((f) => ({ ...f, type: t }))}
                >
                  <Text style={[styles.typeBtnText, { color: C.catRowText }, form.type === t && { color: C.inputText, fontWeight: "700" }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="Title" placeholderTextColor={C.inputPlaceholder}
              value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            />
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="Amount" placeholderTextColor={C.inputPlaceholder}
              keyboardType="decimal-pad" value={form.amount}
              onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
            />
            <TouchableOpacity style={[styles.input, styles.categoryInput, inputStyle]} onPress={() => setCategoryModalVisible(true)}>
              <Text style={{ color: form.category ? C.catText : C.catPlaceholder, fontSize: 15 }}>
                {form.category || "Select Category"}
              </Text>
              <Text style={{ color: C.fieldLabel }}>▾</Text>
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { color: C.fieldLabel }]}>DATE & TIME</Text>
            <DateTimePicker value={form.date} onChange={(d) => setForm((f) => ({ ...f, date: d }))} />

            <TextInput
              style={[styles.input, inputStyle, { height: 72 }]}
              placeholder="Note (optional)" placeholderTextColor={C.inputPlaceholder}
              multiline value={form.note}
              onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
            />
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: C.submitBg }]} onPress={handleSave}>
              <Text style={styles.submitBtnText}>Save Transaction</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={categoryModalVisible} animationType="slide" transparent>
        <View style={[styles.overlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.sheet, sheetStyle, { maxHeight: "70%" }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: C.title }]}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={[styles.closeBtn, { backgroundColor: C.closeBg, borderColor: C.closeBorder }]}>
                <IconClose size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.newCatRow}>
              <TextInput
                style={[styles.input, inputStyle, { flex: 1, marginBottom: 0 }]}
                placeholder="New category..." placeholderTextColor={C.inputPlaceholder}
                value={newCategoryInput} onChangeText={setNewCategoryInput}
              />
              <TouchableOpacity style={[styles.newCatBtn, { backgroundColor: C.newCatBtnBg, borderColor: C.newCatBtnBorder }]} onPress={handleAddCategory}>
                <Text style={[styles.newCatBtnText, { color: C.newCatBtnText }]}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              style={{ marginTop: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.catRow, { borderBottomColor: C.catRowBorder }, form.category === item && { backgroundColor: C.catRowActiveBg, borderRadius: 8, paddingHorizontal: 8 }]}
                  onPress={() => { setForm((f) => ({ ...f, category: item })); setCategoryModalVisible(false); }}
                >
                  <Text style={[styles.catRowText, { color: C.catRowText }, form.category === item && { color: C.catRowTextActive, fontWeight: "600" }]}>{item}</Text>
                  {form.category === item && <Text style={{ color: C.catRowTextActive }}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 17, fontWeight: "700" },
  closeBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  typeToggle: { flexDirection: "row", borderRadius: 12, padding: 4, marginBottom: 14 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  typeBtnText: { fontSize: 14, fontWeight: "500" },
  input: { borderRadius: 10, borderWidth: 1, fontSize: 15, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 10 },
  categoryInput: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fieldLabel: { fontSize: 11, letterSpacing: 1.2, marginBottom: 6 },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  newCatRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  newCatBtn: { borderRadius: 10, paddingHorizontal: 14, justifyContent: "center", borderWidth: 1 },
  newCatBtnText: { fontWeight: "600", fontSize: 14 },
  catRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13, paddingHorizontal: 4, borderBottomWidth: 0.5 },
  catRowText: { fontSize: 15 },
});