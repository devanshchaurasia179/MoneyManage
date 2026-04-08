import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getUser, insertUser, updateUser } from "../../utils/db";
import { useTheme } from "../../context/ThemeContext";

const CURRENCIES = [
  { label: "USD – US Dollar",        symbol: "$",   code: "USD" },
  { label: "EUR – Euro",             symbol: "€",   code: "EUR" },
  { label: "GBP – British Pound",    symbol: "£",   code: "GBP" },
  { label: "INR – Indian Rupee",     symbol: "₹",   code: "INR" },
  { label: "JPY – Japanese Yen",     symbol: "¥",   code: "JPY" },
  { label: "CAD – Canadian Dollar",  symbol: "CA$", code: "CAD" },
  { label: "AUD – Australian Dollar",symbol: "A$",  code: "AUD" },
  { label: "CHF – Swiss Franc",      symbol: "Fr",  code: "CHF" },
  { label: "CNY – Chinese Yuan",     symbol: "¥",   code: "CNY" },
  { label: "BRL – Brazilian Real",   symbol: "R$",  code: "BRL" },
  { label: "MXN – Mexican Peso",     symbol: "$",   code: "MXN" },
  { label: "KRW – South Korean Won", symbol: "₩",   code: "KRW" },
  { label: "SGD – Singapore Dollar", symbol: "S$",  code: "SGD" },
  { label: "AED – UAE Dirham",       symbol: "د.إ", code: "AED" },
  { label: "PKR – Pakistani Rupee",  symbol: "₨",   code: "PKR" },
];

const DARK = {
  bg: "#080C12", card: "#0f1520", border: "#1a2235",
  text: "#F0EDE8", subtext: "#64748b", accent: "#2ECC71",
  accentLight: "#0d1f12", inputBg: "#111827", separator: "#1a2235",
  danger: "#E74C3C", success: "#2ECC71",
};

const LIGHT = {
  bg: "#F7F5F2", card: "#FFFFFF", border: "#E8E4DF",
  text: "#1A1714", subtext: "#8A8076", accent: "#16a34a",
  accentLight: "#f0fdf4", inputBg: "#FDFCFB", separator: "#EDE9E4",
  danger: "#C0392B", success: "#27AE60",
};

export default function Profile() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [hasUser, setHasUser] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingName, setEditingName] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const users = getUser();
      if (users.length > 0) {
        setName(users[0].name ?? "");
        setCurrency(users[0].currency ?? "USD");
        setHasUser(true);
      }
    }, [])
  );

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name before saving.");
      return;
    }
    if (hasUser) updateUser(name.trim(), currency);
    else { insertUser(name.trim(), currency); setHasUser(true); }
    setEditingName(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={[s.eyebrow, { color: T.accent }]}>SETTINGS</Text>
          <Text style={[s.title, { color: T.text }]}>Your Profile</Text>
        </View>

        {/* Avatar */}
        <View style={s.avatarWrapper}>
          <View style={[s.avatar, { backgroundColor: T.accentLight, borderColor: T.accent }]}>
            <Text style={[s.avatarLetter, { color: T.accent }]}>
              {name.trim() ? name.trim()[0].toUpperCase() : "?"}
            </Text>
          </View>
          <Text style={[s.avatarName, { color: T.text }]}>{name.trim() || "Unnamed"}</Text>
          <Text style={[s.avatarSub, { color: T.subtext }]}>{selectedCurrency.symbol} · {selectedCurrency.code}</Text>
        </View>

        {/* Name Card */}
        <View style={[s.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[s.cardLabel, { color: T.subtext }]}>DISPLAY NAME</Text>
          <View style={s.nameRow}>
            <TextInput
              style={[s.nameInput, {
                color: T.text,
                backgroundColor: editingName ? T.inputBg : "transparent",
                borderColor: editingName ? T.accent : "transparent",
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={T.subtext}
              editable={editingName}
              onFocus={() => setEditingName(true)}
              returnKeyType="done"
              onSubmitEditing={() => setEditingName(false)}
            />
            <TouchableOpacity
              style={[s.editBtn, { backgroundColor: editingName ? T.accentLight : T.separator }]}
              onPress={() => setEditingName((v) => !v)}
            >
              <Text style={[s.editBtnText, { color: editingName ? T.accent : T.subtext }]}>
                {editingName ? "Done" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Currency Card */}
        <View style={[s.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[s.cardLabel, { color: T.subtext }]}>CURRENCY</Text>
          <TouchableOpacity
            style={[s.currencyBtn, {
              backgroundColor: T.inputBg,
              borderColor: showCurrencyPicker ? T.accent : T.border,
            }]}
            onPress={() => setShowCurrencyPicker((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={s.currencyLeft}>
              <Text style={[s.currencySymbol, { color: T.accent }]}>{selectedCurrency.symbol}</Text>
              <Text style={[s.currencyLabel, { color: T.text }]}>{selectedCurrency.label}</Text>
            </View>
            <Text style={[s.chevron, { color: T.subtext }]}>{showCurrencyPicker ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {showCurrencyPicker && (
            <View style={[s.picker, { backgroundColor: T.inputBg, borderColor: T.border }]}>
              {CURRENCIES.map((c, i) => (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    s.pickerItem,
                    i < CURRENCIES.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.separator },
                    c.code === currency && { backgroundColor: T.accentLight },
                  ]}
                  onPress={() => { setCurrency(c.code); setShowCurrencyPicker(false); }}
                >
                  <Text style={[s.pickerSymbol, { color: T.accent }]}>{c.symbol}</Text>
                  <Text style={[s.pickerLabel, { color: T.text }]}>{c.label}</Text>
                  {c.code === currency && <Text style={[s.checkmark, { color: T.accent }]}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: saved ? T.success : T.accent }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={s.saveBtnText}>{saved ? "✓  Saved!" : "Save Changes"}</Text>
        </TouchableOpacity>

        <Text style={[s.footer, { color: T.subtext }]}>Changes are stored locally on your device.</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 16 },
  header: { marginBottom: 28 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 2.5, marginBottom: 4 },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  avatarWrapper: { alignItems: "center", marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarLetter: { fontSize: 34, fontWeight: "700" },
  avatarName: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  avatarSub: { fontSize: 13, marginTop: 2 },
  card: { borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 14 },
  cardLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameInput: { flex: 1, fontSize: 16, fontWeight: "600", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5 },
  editBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  editBtnText: { fontSize: 13, fontWeight: "700" },
  currencyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  currencyLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  currencySymbol: { fontSize: 18, fontWeight: "700", width: 28 },
  currencyLabel: { fontSize: 14, fontWeight: "500" },
  chevron: { fontSize: 11 },
  picker: { marginTop: 10, borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  pickerItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  pickerSymbol: { fontSize: 15, fontWeight: "700", width: 26 },
  pickerLabel: { flex: 1, fontSize: 13 },
  checkmark: { fontSize: 14, fontWeight: "700" },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 10, marginBottom: 16 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
  footer: { textAlign: "center", fontSize: 12 },
});