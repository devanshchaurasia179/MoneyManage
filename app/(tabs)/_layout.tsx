import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  View, Text, Platform, TouchableOpacity, Animated, Easing,
} from "react-native";
import { useEffect, useRef, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";

// ─── Animated Theme Toggle ────────────────────────────────────────────────────
function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  const slideAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const spinAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const trackAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isDark ? 1 : 0,
        useNativeDriver: true,
        tension: 90, friction: 11,
      }),
      Animated.timing(trackAnim, {
        toValue: isDark ? 1 : 0,
        duration: 280,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(spinAnim, {
          toValue: 1, duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(spinAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.25, duration: 100, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]),
    ]).start();
  }, [isDark]);

  const trackColor = trackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#fef3c7", "#1e3a5f"],
  });
  const trackBorderColor = trackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#fbbf24", "#3b82f6"],
  });
  const thumbX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 27],
  });
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.8}>
      <Animated.View
        style={{
          width: 56, height: 30, borderRadius: 15,
          backgroundColor: trackColor,
          borderWidth: 1.5, borderColor: trackBorderColor,
          justifyContent: "center",
        }}
      >
        <View style={{ position: "absolute", left: 7, top: 7, opacity: isDark ? 0.9 : 0 }}>
          <View style={{ width: 2.5, height: 2.5, borderRadius: 2, backgroundColor: "#bfdbfe", marginBottom: 3 }} />
          <View style={{ width: 1.5, height: 1.5, borderRadius: 1, backgroundColor: "#93c5fd" }} />
        </View>
        <View style={{ position: "absolute", right: 9, top: 9, opacity: isDark ? 0 : 0.9 }}>
          <View style={{ width: 2.5, height: 2.5, borderRadius: 2, backgroundColor: "#f59e0b" }} />
        </View>
        <Animated.View
          style={{
            position: "absolute", left: 0,
            width: 23, height: 23, borderRadius: 12,
            backgroundColor: isDark ? "#93c5fd" : "#fbbf24",
            alignItems: "center", justifyContent: "center",
            shadowColor: isDark ? "#60a5fa" : "#f59e0b",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8, shadowRadius: 6, elevation: 5,
            transform: [{ translateX: thumbX }, { scale: scaleAnim }, { rotate: spin }],
          }}
        >
          <Text style={{ fontSize: 12 }}>{isDark ? "🌙" : "☀️"}</Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  // ✅ userName now comes from context — updates instantly when Profile saves
  const { isDark, userName } = useTheme();

  const C = isDark ? {
    headerBg: "#080C12", headerBorder: "#1a2235",
    tabBg: "#02070e", tabBorder: "#1a2235",
    active: "#2ECC71", inactive: "#2d4a5e",
    text: "#ffffff", subtext: "#64748b",
    iconBg: "#0d1f12", iconBorder: "#1a3a22",
    focusBg: "#080C12", shadow: "#000000",
  } : {
    headerBg: "#ffffff", headerBorder: "#e2e8f0",
    tabBg: "#fbfbfb", tabBorder: "#e2e8f0",
    active: "#16a34a", inactive: "#94a3b8",
    text: "#0f172a", subtext: "#64748b",
    iconBg: "#f0fdf4", iconBorder: "#bbf7d0",
    focusBg: "#fbfbfb", shadow: "#94a3b8",
  };

  const headerLeft = useCallback(
    () => (
      <View style={{ marginLeft: 16, flexDirection: "row", alignItems: "center" }}>
        <View style={{
          backgroundColor: C.iconBg, padding: 7,
          borderRadius: 12, borderWidth: 1, borderColor: C.iconBorder,
        }}>
          <MaterialCommunityIcons name="wallet-outline" size={22} color={C.active} />
        </View>
        <View style={{ marginLeft: 10 }}>
          <Text style={{ color: C.subtext, fontSize: 11, fontWeight: "500", letterSpacing: 0.3 }}>Hello,</Text>
          {/* ✅ Reads from context — live updates */}
          <Text style={{ color: C.text, fontSize: 14, fontWeight: "800", letterSpacing: -0.3 }}>
            {userName || "User"}
          </Text>
        </View>
      </View>
    ),
    [isDark, userName, C]
  );

  const headerRight = useCallback(
    () => (
      <View style={{ marginRight: 16 }}>
        <ThemeToggle />
      </View>
    ),
    [isDark]
  );

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: C.headerBg,
          height: Platform.OS === "ios" ? 108 : 88,
          borderBottomWidth: 1,
          borderBottomColor: C.headerBorder,
        } as any,
        headerTitleAlign: "center",
        headerTintColor: C.text,
        headerLeft,
        headerRight,
        headerTitle: () => {
          const titles: Record<string, string> = {
            index: "Dashboard", analytics: "Insights",
            offers: "Special Deals", profile: "Profile",
          };
          return (
            <Text style={{ fontSize: 16, fontWeight: "800", color: C.text, letterSpacing: -0.2 }}>
              {titles[route.name] || "Manager"}
            </Text>
          );
        },
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 28 : 22,
          left: 16, right: 16,
          backgroundColor: C.tabBg,
          borderRadius: 28, height: 64,
          borderTopWidth: 1, borderColor: C.tabBorder,
          paddingBottom: Platform.OS === "ios" ? 0 : 4,
          elevation: 20,
          shadowColor: C.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.5 : 0.15,
          shadowRadius: 20,
        },
        tabBarActiveTintColor: C.active,
        tabBarInactiveTintColor: C.inactive,
        tabBarLabelStyle: {
          fontSize: 10, fontWeight: "700",
          letterSpacing: 0.4, marginTop: -4, marginBottom: 8,
        },
        tabBarItemStyle: { paddingTop: 10 },
      })}
    >
      <Tabs.Screen name="index" options={{
        title: "Home",
        tabBarIcon: ({ color, focused }) => (
          <View style={focused ? { backgroundColor: C.focusBg, borderRadius: 10, padding: 4 } : {}}>
            <Ionicons name={focused ? "home" : "home-outline"} size={21} color={color} />
          </View>
        ),
      }} />
      <Tabs.Screen name="analytics" options={{
        title: "Analytics",
        tabBarIcon: ({ color, focused }) => (
          <View style={focused ? { backgroundColor: C.focusBg, borderRadius: 10, padding: 4 } : {}}>
            <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={21} color={color} />
          </View>
        ),
      }} />
      <Tabs.Screen name="offers" options={{
        title: "Offers",
        tabBarIcon: ({ color, focused }) => (
          <View style={focused ? { backgroundColor: C.focusBg, borderRadius: 10, padding: 4 } : {}}>
            <Ionicons name={focused ? "gift" : "gift-outline"} size={21} color={color} />
          </View>
        ),
      }} />
      <Tabs.Screen name="profile" options={{
        title: "Profile",
        tabBarIcon: ({ color, focused }) => (
          <View style={focused ? { backgroundColor: C.focusBg, borderRadius: 10, padding: 4 } : {}}>
            <Ionicons name={focused ? "person" : "person-outline"} size={21} color={color} />
          </View>
        ),
      }} />
    </Tabs>
  );
}