import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, Animated, Pressable,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getUser, insertUser, updateUser } from "../../utils/db";
import { useTheme } from "../../context/ThemeContext";

const CURRENCIES = [
  { label: "USD – US Dollar",         symbol: "$",   code: "USD", flag: "🇺🇸" },
  { label: "EUR – Euro",              symbol: "€",   code: "EUR", flag: "🇪🇺" },
  { label: "GBP – British Pound",     symbol: "£",   code: "GBP", flag: "🇬🇧" },
  { label: "INR – Indian Rupee",      symbol: "₹",   code: "INR", flag: "🇮🇳" },
  { label: "JPY – Japanese Yen",      symbol: "¥",   code: "JPY", flag: "🇯🇵" },
  { label: "CAD – Canadian Dollar",   symbol: "CA$", code: "CAD", flag: "🇨🇦" },
  { label: "AUD – Australian Dollar", symbol: "A$",  code: "AUD", flag: "🇦🇺" },
  { label: "CHF – Swiss Franc",       symbol: "Fr",  code: "CHF", flag: "🇨🇭" },
  { label: "CNY – Chinese Yuan",      symbol: "¥",   code: "CNY", flag: "🇨🇳" },
  { label: "BRL – Brazilian Real",    symbol: "R$",  code: "BRL", flag: "🇧🇷" },
  { label: "MXN – Mexican Peso",      symbol: "$",   code: "MXN", flag: "🇲🇽" },
  { label: "KRW – South Korean Won",  symbol: "₩",   code: "KRW", flag: "🇰🇷" },
  { label: "SGD – Singapore Dollar",  symbol: "S$",  code: "SGD", flag: "🇸🇬" },
  { label: "AED – UAE Dirham",        symbol: "د.إ", code: "AED", flag: "🇦🇪" },
  { label: "PKR – Pakistani Rupee",   symbol: "₨",   code: "PKR", flag: "🇵🇰" },
];

const DARK = {
  bg: "#080C12",
  bgGradientTop: "#0a1628",
  card: "#0f1520",
  cardElevated: "#131d2e",
  border: "#1a2235",
  borderFocus: "#2ECC71",
  text: "#F0EDE8",
  textSecondary: "#c8c4be",
  subtext: "#64748b",
  accent: "#2ECC71",
  accentDim: "#1a9e54",
  accentLight: "#0d1f12",
  accentGlow: "rgba(46,204,113,0.15)",
  inputBg: "#111827",
  separator: "#1a2235",
  danger: "#E74C3C",
  success: "#2ECC71",
  pillBg: "#0f1a0f",
  shimmer: "#1a2a3a",
};

const LIGHT = {
  bg: "#F4F1EE",
  bgGradientTop: "#EBF5F0",
  card: "#FFFFFF",
  cardElevated: "#FAFAFA",
  border: "#E8E4DF",
  borderFocus: "#16a34a",
  text: "#1A1714",
  textSecondary: "#3d3530",
  subtext: "#8A8076",
  accent: "#16a34a",
  accentDim: "#15803d",
  accentLight: "#f0fdf4",
  accentGlow: "rgba(22,163,74,0.1)",
  inputBg: "#FDFCFB",
  separator: "#EDE9E4",
  danger: "#C0392B",
  success: "#27AE60",
  pillBg: "#f0fdf4",
  shimmer: "#e8e4df",
};

// Animated Save Button
function SaveButton({ onPress, saved, T }: { onPress: () => void; saved: boolean; T: typeof DARK }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          s.saveBtn,
          {
            backgroundColor: saved ? T.success : T.accent,
            shadowColor: T.accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: saved ? 0.5 : 0.35,
            shadowRadius: 14,
            elevation: 8,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={s.saveBtnInner}>
          {saved ? (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.saveBtnText}>Changes Saved!</Text>
            </>
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.saveBtnText}>Save Changes</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Profile() {
  const { isDark, setUserName } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [hasUser, setHasUser] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const avatarScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const users = getUser();
      if (users.length > 0) {
        setName(users[0].name ?? "");
        setCurrency(users[0].currency ?? "USD");
        setHasUser(true);
      }
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 350,
        useNativeDriver: true,
      }).start();
      return () => fadeAnim.setValue(0);
    }, [])
  );

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  const handleNameFocus = () => {
    setEditingName(true);
    Animated.spring(avatarScale, {
      toValue: 1.08, useNativeDriver: true, tension: 180, friction: 8,
    }).start();
  };

  const handleNameBlur = () => {
    Animated.spring(avatarScale, {
      toValue: 1, useNativeDriver: true, tension: 180, friction: 8,
    }).start();
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name before saving.");
      return;
    }
    if (hasUser) updateUser(name.trim(), currency);
    else { insertUser(name.trim(), currency); setHasUser(true); }

    // ✅ Update context so header updates instantly
    setUserName(name.trim());

    setEditingName(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = name.trim()
    ? name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Hero Banner ── */}
          <View style={[s.heroBanner, { backgroundColor: T.accentGlow, borderColor: T.border }]}>
            {/* Avatar */}
            <Animated.View style={[s.avatarRing, {
              borderColor: T.accent,
              shadowColor: T.accent,
              transform: [{ scale: avatarScale }],
            }]}>
              <View style={[s.avatarInner, { backgroundColor: T.accentLight }]}>
                <Text style={[s.avatarInitials, { color: T.accent }]}>{initials}</Text>
              </View>
            </Animated.View>

            <View style={s.heroText}>
              <Text style={[s.heroName, { color: T.text }]} numberOfLines={1}>
                {name.trim() || "Your Name"}
              </Text>
              <View style={[s.currencyPill, { backgroundColor: T.pillBg, borderColor: T.border }]}>
                <Text style={[s.currencyPillText, { color: T.accent }]}>
                  {selectedCurrency.flag}  {selectedCurrency.symbol} · {selectedCurrency.code}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Section Label ── */}
          <Text style={[s.sectionLabel, { color: T.subtext }]}>PERSONAL INFO</Text>

          {/* ── Name Card ── */}
          <View style={[s.card, {
            backgroundColor: T.card,
            borderColor: editingName ? T.borderFocus : T.border,
            shadowColor: editingName ? T.accent : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            elevation: editingName ? 4 : 0,
          }]}>
            <View style={s.cardHeader}>
              <View style={[s.cardIconWrap, { backgroundColor: T.accentLight }]}>
                <Ionicons name="person-outline" size={15} color={T.accent} />
              </View>
              <Text style={[s.cardLabel, { color: T.subtext }]}>Display Name</Text>
            </View>

            <View style={s.nameRow}>
              <TextInput
                style={[s.nameInput, {
                  color: T.text,
                  backgroundColor: editingName ? T.inputBg : "transparent",
                  borderColor: editingName ? T.borderFocus : T.border,
                  borderWidth: editingName ? 1.5 : 1,
                }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={T.subtext}
                editable={editingName}
                onFocus={handleNameFocus}
                onBlur={handleNameBlur}
                returnKeyType="done"
                onSubmitEditing={() => setEditingName(false)}
              />
              <TouchableOpacity
                style={[s.editBtn, {
                  backgroundColor: editingName ? T.accentLight : T.inputBg,
                  borderColor: editingName ? T.accent : T.border,
                }]}
                onPress={() => {
                  if (editingName) handleNameBlur();
                  setEditingName((v) => !v);
                }}
              >
                <Ionicons
                  name={editingName ? "checkmark" : "pencil-outline"}
                  size={15}
                  color={editingName ? T.accent : T.subtext}
                />
                <Text style={[s.editBtnText, { color: editingName ? T.accent : T.subtext }]}>
                  {editingName ? "Done" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Section Label ── */}
          <Text style={[s.sectionLabel, { color: T.subtext }]}>PREFERENCES</Text>

          {/* ── Currency Card ── */}
          <View style={[s.card, {
            backgroundColor: T.card,
            borderColor: showCurrencyPicker ? T.borderFocus : T.border,
            shadowColor: showCurrencyPicker ? T.accent : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            elevation: showCurrencyPicker ? 4 : 0,
          }]}>
            <View style={s.cardHeader}>
              <View style={[s.cardIconWrap, { backgroundColor: T.accentLight }]}>
                <Ionicons name="wallet-outline" size={15} color={T.accent} />
              </View>
              <Text style={[s.cardLabel, { color: T.subtext }]}>Currency</Text>
            </View>

            <TouchableOpacity
              style={[s.currencyBtn, {
                backgroundColor: T.inputBg,
                borderColor: showCurrencyPicker ? T.borderFocus : T.border,
              }]}
              onPress={() => setShowCurrencyPicker((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={s.currencyLeft}>
                <Text style={s.currencyFlag}>{selectedCurrency.flag}</Text>
                <View>
                  <Text style={[s.currencyCode, { color: T.accent }]}>
                    {selectedCurrency.symbol} · {selectedCurrency.code}
                  </Text>
                  <Text style={[s.currencyName, { color: T.subtext }]}>
                    {selectedCurrency.label.split(" – ")[1]}
                  </Text>
                </View>
              </View>
              <View style={[s.chevronWrap, { backgroundColor: T.accentLight }]}>
                <Ionicons
                  name={showCurrencyPicker ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={T.accent}
                />
              </View>
            </TouchableOpacity>

            {showCurrencyPicker && (
              <View style={[s.picker, { backgroundColor: T.inputBg, borderColor: T.border }]}>
                {CURRENCIES.map((c, i) => (
                  <Pressable
                    key={c.code}
                    style={({ pressed }) => [
                      s.pickerItem,
                      i < CURRENCIES.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.separator },
                      c.code === currency && { backgroundColor: T.accentLight },
                      pressed && { opacity: 0.75 },
                    ]}
                    onPress={() => { setCurrency(c.code); setShowCurrencyPicker(false); }}
                  >
                    <Text style={s.pickerFlag}>{c.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.pickerCode, { color: T.text }]}>{c.code}</Text>
                      <Text style={[s.pickerName, { color: T.subtext }]}>{c.label.split(" – ")[1]}</Text>
                    </View>
                    <Text style={[s.pickerSymbol, { color: T.accent }]}>{c.symbol}</Text>
                    {c.code === currency && (
                      <Ionicons name="checkmark-circle" size={16} color={T.accent} style={{ marginLeft: 6 }} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* ── Save ── */}
          <View style={{ marginTop: 8 }}>
            <SaveButton onPress={handleSave} saved={saved} T={T} />
          </View>

          <View style={[s.footerRow, { borderTopColor: T.border }]}>
            <Ionicons name="lock-closed-outline" size={11} color={T.subtext} />
            <Text style={[s.footer, { color: T.subtext }]}>  Stored locally · Never shared</Text>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 110, paddingTop: 20 },

  // Hero
  heroBanner: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 22, borderWidth: 1,
    paddingHorizontal: 20, paddingVertical: 20,
    marginBottom: 28, gap: 16,
  },
  avatarRing: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
  },
  avatarInner: {
    flex: 1, borderRadius: 34,
    alignItems: "center", justifyContent: "center",
  },
  avatarInitials: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  heroText: { flex: 1 },
  heroName: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5, marginBottom: 6 },
  currencyPill: {
    alignSelf: "flex-start",
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  currencyPillText: { fontSize: 12, fontWeight: "600" },

  // Section
  sectionLabel: {
    fontSize: 10, fontWeight: "700", letterSpacing: 2.5,
    marginBottom: 10, marginLeft: 4,
  },

  // Card
  card: {
    borderWidth: 1.5, borderRadius: 18,
    padding: 16, marginBottom: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  cardIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cardLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },

  // Name
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameInput: {
    flex: 1, fontSize: 16, fontWeight: "600",
    paddingVertical: 11, paddingHorizontal: 14,
    borderRadius: 12,
  },
  editBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 12, borderWidth: 1.5,
  },
  editBtnText: { fontSize: 12, fontWeight: "700" },

  // Currency
  currencyBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  currencyLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  currencyFlag: { fontSize: 24 },
  currencyCode: { fontSize: 15, fontWeight: "700" },
  currencyName: { fontSize: 11, marginTop: 1 },
  chevronWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  picker: { marginTop: 10, borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  pickerItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 11, gap: 10,
  },
  pickerFlag: { fontSize: 20 },
  pickerCode: { fontSize: 13, fontWeight: "700" },
  pickerName: { fontSize: 11, marginTop: 1 },
  pickerSymbol: { fontSize: 13, fontWeight: "700" },

  // Save
  saveBtn: { borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  saveBtnInner: { flexDirection: "row", alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.2 },

  // Footer
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20, paddingTop: 16, borderTopWidth: 1 },
  footer: { fontSize: 11 },
});