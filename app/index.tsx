import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, Easing, Dimensions, StatusBar } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter, useRootNavigationState } from "expo-router";
import { initDB, getUser } from "../utils/db";

const { width, height } = Dimensions.get("window");

// ── Floating orb decoration ─────────────────────────────────────────
const FloatingOrb = ({
  delay, size, x, y, color, duration,
}: {
  delay: number; size: number; x: number; y: number; color: string; duration: number;
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1, duration: 800, useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: -18, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
};

// ── Stat badge ──────────────────────────────────────────────────────
const StatBadge = ({
  label, value, delay, accent,
}: {
  label: string; value: string; delay: number; accent: string;
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(anim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statBadge,
        {
          opacity: anim,
          transform: [{ scale: anim }, { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <View style={[styles.statDot, { backgroundColor: accent }]} />
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
};

export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [loading, setLoading] = useState(true);

  // Entry animations
  const logoAnim   = useRef(new Animated.Value(0)).current;
  const titleAnim  = useRef(new Animated.Value(0)).current;
  const subAnim    = useRef(new Animated.Value(0)).current;
  const btnAnim    = useRef(new Animated.Value(0)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;
  const shimmer    = useRef(new Animated.Value(0)).current;
  const glowPulse  = useRef(new Animated.Value(0.6)).current;

  // Glow pulse loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.6, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Shimmer loop on button
  const runShimmer = () => {
    shimmer.setValue(0);
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  };

  useEffect(() => {
    if (!navigationState?.key) return;
    initDB();
    const user = getUser();

    if (user.length > 0) {
      setTimeout(() => router.replace("/(tabs)"), 0);
    } else {
      setLoading(false);
      // Orchestrated staggered entrance
      Animated.stagger(100, [
        Animated.spring(logoAnim,  { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.spring(titleAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.spring(subAnim,   { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.spring(btnAnim,   { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      ]).start(() => runShimmer());
    }
  }, [navigationState]);

  const handlePressIn = () => {
    Animated.spring(btnScale, { toValue: 0.94, tension: 200, friction: 10, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(btnScale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start();
  };
  const handleStart = () => router.push("/onboarding");

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingDot} />
      </View>
    );
  }

  // ── Animated helpers ─────────────────────────────────────────────
  const logoStyle = {
    opacity: logoAnim,
    transform: [
      { scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
      { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
    ],
  };
  const titleStyle = {
    opacity: titleAnim,
    transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };
  const subStyle = {
    opacity: subAnim,
    transform: [{ translateY: subAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };
  const btnStyle = {
    opacity: btnAnim,
    transform: [
      { scale: Animated.multiply(btnScale, btnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] })) },
    ],
  };

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 300],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Background orbs ──────────────────────────────────── */}
      <FloatingOrb delay={200} size={180} x={-60}       y={80}          color="rgba(34,197,94,0.07)"  duration={3200} />
      <FloatingOrb delay={400} size={120} x={width-90}  y={height*0.15} color="rgba(16,185,129,0.09)" duration={2800} />
      <FloatingOrb delay={600} size={90}  x={width*0.3} y={height*0.72} color="rgba(52,211,153,0.06)" duration={3600} />

      {/* ── Logo glow ring ───────────────────────────────────── */}
      <Animated.View style={[styles.glowRing, { opacity: glowPulse }]} />
      <Animated.View style={[styles.glowRingOuter, { opacity: Animated.multiply(glowPulse, 0.4) }]} />

      {/* ── Logo ─────────────────────────────────────────────── */}
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image
          source={require("../assets/images/finance.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>

  
      {/* ── Title ────────────────────────────────────────────── */}
      <Animated.View style={titleStyle}>
        <Text style={styles.eyebrow}>YOUR FINANCIAL OS</Text>
        <Text style={styles.title}>Money{"\n"}Manager</Text>
      </Animated.View>

      {/* ── Subtitle ─────────────────────────────────────────── */}
      <Animated.Text style={[styles.subtitle, subStyle]}>
        Track every rupee. Understand your patterns.{"\n"}Take control of your future.
      </Animated.Text>

      {/* ── CTA button ───────────────────────────────────────── */}
      <Animated.View style={[styles.btnOuter, btnStyle]}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.button}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleStart}
        >
          {/* Shimmer sweep */}
          <Animated.View
            style={[
              styles.shimmerStrip,
              { transform: [{ translateX: shimmerTranslate }, { rotate: "20deg" }] },
            ]}
          />
          <Text style={styles.buttonText}>Get Started</Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Footer note ──────────────────────────────────────── */}
      <Animated.Text style={[styles.footerNote, subStyle]}>
        No account needed · 100% private
      </Animated.Text>

      {/* ── Bottom grid decoration ───────────────────────────── */}
      <View style={styles.gridDecor} pointerEvents="none">
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={[styles.gridLine, { left: (width / 5) * i }]} />
        ))}
      </View>
    </View>
  );
}

const ACCENT      = "#22c55e";
const ACCENT_MID  = "#16a34a";
const BG          = "#080e1a";
const SURFACE     = "#0f1e2e";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    overflow: "hidden",
  },

  // ── Loading ──────────────────────────────────────────────────────
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
    opacity: 0.8,
  },

  // ── Glow ─────────────────────────────────────────────────────────
  glowRing: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.18)",
    backgroundColor: "rgba(34,197,94,0.04)",
    top: height * 0.12,
    alignSelf: "center",
  },
  glowRingOuter: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.08)",
    top: height * 0.09,
    alignSelf: "center",
  },

  // ── Logo ─────────────────────────────────────────────────────────
  logoWrap: {
    width: 200,
    height: 200,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },

  // ── Stats ─────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#e2e8f0",
    letterSpacing: 0.2,
  },
  statLabel: {
    fontSize: 9.5,
    color: "#64748b",
    fontWeight: "500",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  // ── Title ─────────────────────────────────────────────────────────
  eyebrow: {
    fontSize: 10,
    letterSpacing: 3,
    color: ACCENT,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    opacity: 0.85,
  },
  title: {
    fontSize: 52,
    fontWeight: "800",
    color: "#f8fafc",
    textAlign: "center",
    lineHeight: 56,
    letterSpacing: -1.5,
    marginBottom: 16,
  },

  // ── Subtitle ──────────────────────────────────────────────────────
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 40,
    letterSpacing: 0.1,
  },

  // ── Button ────────────────────────────────────────────────────────
  btnOuter: {
    width: "100%",
    borderRadius: 18,
    // Outer glow shadow
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: ACCENT,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    overflow: "hidden",
    // Top highlight
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.25)",
  },
  shimmerStrip: {
    position: "absolute",
    width: 60,
    height: "200%",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 30,
  },
  buttonText: {
    color: "#052e16",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  buttonArrow: {
    color: "#052e16",
    fontSize: 18,
    fontWeight: "700",
  },

  // ── Footer ────────────────────────────────────────────────────────
  footerNote: {
    fontSize: 12,
    color: "#334155",
    letterSpacing: 0.3,
    fontWeight: "500",
  },

  // ── Grid decoration ───────────────────────────────────────────────
  gridDecor: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.025,
  },
  gridLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#94a3b8",
  },
});