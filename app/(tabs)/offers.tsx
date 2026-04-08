import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Animated,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";          // ✅ works in Expo Go, no native linking needed
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// ─── Data ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "1", name: "All",      icon: "grid-outline"                },
  { id: "2", name: "Food",     icon: "fast-food-outline"           },
  { id: "3", name: "Shopping", icon: "cart-outline"                },
  { id: "4", name: "Travel",   icon: "airplane-outline"            },
  { id: "5", name: "Others",   icon: "ellipsis-horizontal-outline" },
];

const OFFERS = [
  {
    id: "1",
    category: "Food",
    title: "Domino's Pizza",
    desc: "Flat ₹100 off on orders above ₹299",
    code: "BITE1430",
    color: "#dc2626",
    tagColor: "#dc2626",
    tagBg: "#fee2e2",
    savings: "Save ₹100",
    expiry: "Expires Apr 30",
  },
  {
    id: "2",
    category: "Food",
    title: "Swiggy",
    desc: "Free delivery on orders above ₹199",
    code: "SWIGFREE",
    color: "#ea580c",
    tagColor: "#ea580c",
    tagBg: "#ffedd5",
    savings: "Free Delivery",
    expiry: "Expires May 15",
  },
  {
    id: "3",
    category: "Shopping",
    title: "Amazon Pay",
    desc: "10% cashback on electronics purchases",
    code: "AMZ10BACK",
    color: "#d97706",
    tagColor: "#d97706",
    tagBg: "#fef3c7",
    savings: "10% Cashback",
    expiry: "Expires Apr 25",
  },
  {
    id: "4",
    category: "Shopping",
    title: "Flipkart",
    desc: "Extra 8% off using Flipkart SuperCoins",
    code: "FKSUPER8",
    color: "#2563eb",
    tagColor: "#2563eb",
    tagBg: "#dbeafe",
    savings: "Save 8%",
    expiry: "Expires May 5",
  },
  {
    id: "5",
    category: "Travel",
    title: "MakeMyTrip",
    desc: "Up to ₹2000 off on flight bookings",
    code: "FLYHIGH2K",
    color: "#0891b2",
    tagColor: "#0891b2",
    tagBg: "#cffafe",
    savings: "Save ₹2000",
    expiry: "Expires Jun 1",
  },
  {
    id: "6",
    category: "Others",
    title: "BookMyShow",
    desc: "₹150 off on movie tickets (min 2 seats)",
    code: "BMS150",
    color: "#9333ea",
    tagColor: "#9333ea",
    tagBg: "#f3e8ff",
    savings: "Save ₹150",
    expiry: "Expires Apr 28",
  },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function OffersScreen() {          // ✅ named export satisfies Expo Router
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("All");
  const [copiedId, setCopiedId]   = useState<string | null>(null);
  const toastAnim                 = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg]   = useState("");

  // ─── Theme tokens ────────────────────────────────────────────────────

  const C = isDark
    ? {
        bg:       "#080C12",
        card:     "#111827",
        border:   "#1e293b",
        text:     "#f1f5f9",
        subtext:  "#64748b",
        muted:    "#334155",
        accent:   "#22c55e",
        accentBg: "#052e16",
        badge:    "#1e293b",
      }
    : {
        bg:       "#f8fafc",
        card:     "#ffffff",
        border:   "#e2e8f0",
        text:     "#0f172a",
        subtext:  "#64748b",
        muted:    "#cbd5e1",
        accent:   "#16a34a",
        accentBg: "#dcfce7",
        badge:    "#f1f5f9",
      };

  // ─── Helpers ─────────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const handleCopy = async (item: (typeof OFFERS)[0]) => {
    try {
      if (Platform.OS === "ios" || Platform.OS === "android") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await Clipboard.setStringAsync(item.code);   // ✅ expo-clipboard uses async API
      setCopiedId(item.id);
      showToast(`"${item.code}" copied to clipboard`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.warn("Copy failed:", e);
    }
  };

  const filteredOffers =
    activeTab === "All" ? OFFERS : OFFERS.filter((o) => o.category === activeTab);

  // ─── Render offer card ───────────────────────────────────────────────

  const renderOffer = ({ item }: { item: (typeof OFFERS)[0] }) => {
    const isCopied = copiedId === item.id;
    return (
      <View style={[styles.offerCard, { backgroundColor: C.card, borderColor: C.border }]}>
        {/* Left colour bar */}
        <View style={[styles.leftBar, { backgroundColor: item.color }]} />

        <View style={styles.cardInner}>
          {/* Top row: category pill + expiry */}
          <View style={styles.metaRow}>
            <View style={[styles.categoryPill, { backgroundColor: item.tagBg }]}>
              <Text style={[styles.categoryPillText, { color: item.tagColor }]}>
                {item.category.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.expiry, { color: C.subtext }]}>{item.expiry}</Text>
          </View>

          {/* Middle row: title + copy button */}
          <View style={styles.mainRow}>
            <View style={styles.titleBlock}>
              <Text style={[styles.offerTitle, { color: C.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.offerDesc, { color: C.subtext }]} numberOfLines={2}>
                {item.desc}
              </Text>
            </View>

            <View style={styles.rightBlock}>
              {/* Savings badge */}
              <View style={[styles.savingsBadge, { backgroundColor: C.accentBg }]}>
                <Text style={[styles.savingsText, { color: C.accent }]}>{item.savings}</Text>
              </View>

              {/* Copy code button */}
              <TouchableOpacity
                onPress={() => handleCopy(item)}
                activeOpacity={0.7}
                style={[
                  styles.codeButton,
                  {
                    borderColor: isCopied ? C.accent : C.muted,
                    backgroundColor: isCopied ? C.accentBg : C.badge,
                  },
                ]}
              >
                <Ionicons
                  name={isCopied ? "checkmark-circle" : "copy-outline"}
                  size={13}
                  color={isCopied ? C.accent : C.subtext}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.codeText, { color: isCopied ? C.accent : C.text }]}>
                  {isCopied ? "Copied!" : item.code}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dashed divider (ticket perforation) */}
          <View style={[styles.perforation, { borderColor: C.border }]} />
        </View>

        {/* Ticket notches */}
        <View style={[styles.notchLeft,  { backgroundColor: C.bg }]} />
        <View style={[styles.notchRight, { backgroundColor: C.bg }]} />
      </View>
    );
  };

  // ─── Toast ───────────────────────────────────────────────────────────

  const toastStyle = {
    opacity: toastAnim,
    transform: [
      {
        translateY: toastAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>Offers & Vouchers</Text>
        <Text style={[styles.sub, { color: C.subtext }]}>Explore deals so you can save more</Text>
      </View>

      {/* Category tabs */}
      <View style={styles.tabWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveTab(cat.name)}
                activeOpacity={0.75}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive ? C.accent : C.card,
                    borderColor: isActive ? C.accent : C.border,
                  },
                ]}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={15}
                  color={isActive ? "#fff" : C.subtext}
                />
                <Text style={[styles.tabLabel, { color: isActive ? "#fff" : C.subtext }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Offer count + hint */}
      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: C.subtext }]}>
          {filteredOffers.length} {filteredOffers.length === 1 ? "offer" : "offers"} available
        </Text>
        <View style={[styles.hintBadge, { backgroundColor: C.accentBg }]}>
          <Ionicons name="finger-print-outline" size={12} color={C.accent} />
          <Text style={[styles.hintText, { color: C.accent }]}>Tap code to copy</Text>
        </View>
      </View>

      {/* Offers list */}
      <FlatList
        data={filteredOffers}
        renderItem={renderOffer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="pricetag-outline" size={40} color={C.muted} />
            <Text style={[styles.emptyText, { color: C.subtext }]}>
              No offers in this category yet.
            </Text>
          </View>
        }
      />

      {/* Toast */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.toast,
          { backgroundColor: isDark ? "#1e293b" : "#0f172a" },
          toastStyle,
        ]}
      >
        <Ionicons name="checkmark-circle" size={15} color="#22c55e" style={{ marginRight: 6 }} />
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const NAVBAR_HEIGHT = 80; // adjust to match your tab bar height

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },

  header: { paddingHorizontal: 20, marginBottom: 20 },
  title:  { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  sub:    { fontSize: 14, marginTop: 4 },

  tabWrapper: { height: 52 },
  tabScroll:  { paddingHorizontal: 20, alignItems: "center", gap: 8 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 0.5,
    gap: 5,
  },
  tabLabel: { fontSize: 13, fontWeight: "600" },

  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
  },
  countText: { fontSize: 12 },
  hintBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hintText: { fontSize: 11, fontWeight: "600" },

  list: {
    padding: 20,
    paddingBottom: NAVBAR_HEIGHT + 20,
    gap: 14,
  },

  offerCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: "hidden",
    flexDirection: "row",
    position: "relative",
  },
  leftBar:   { width: 5 },
  cardInner: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },

  metaRow:          { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  categoryPill:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  categoryPillText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  expiry:           { fontSize: 11 },

  mainRow:    { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  titleBlock: { flex: 1, minWidth: 0 },
  offerTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  offerDesc:  { fontSize: 12, lineHeight: 16 },

  rightBlock:   { alignItems: "flex-end", gap: 8, flexShrink: 0 },
  savingsBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  savingsText:  { fontSize: 11, fontWeight: "700" },

  codeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  codeText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },

  perforation: { marginTop: 12, borderTopWidth: 1, borderStyle: "dashed" },

  notchLeft: {
    position: "absolute",
    left: -1,
    bottom: 46,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  notchRight: {
    position: "absolute",
    right: -1,
    bottom: 46,
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  emptyBox:  { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },

  toast: {
    position: "absolute",
    bottom: NAVBAR_HEIGHT + 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  toastText: { color: "#f1f5f9", fontSize: 13, fontWeight: "500" },
});