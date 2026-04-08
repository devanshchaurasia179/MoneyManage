import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  StyleSheet,
  useColorScheme,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SWIPE_THRESHOLD, SWIPE_FULL } from "./constants";
import { IconTrash } from "./Icons";

type Props = {
  children: React.ReactNode;
  onDelete: () => void;
  onStar: () => void;
  isStarred: boolean;
};

export const SwipeableRow = ({ children, onDelete, onStar, isStarred }: Props) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const T = isDark ? dark : light;

  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  // Per-button scale for press feedback
  const starScale = useRef(new Animated.Value(1)).current;
  const deleteScale = useRef(new Animated.Value(1)).current;

  const springConfig = { tension: 140, friction: 16, useNativeDriver: true };
  const fastSpring = { tension: 200, friction: 18, useNativeDriver: true };

  const open = useCallback(() => {
    Animated.spring(translateX, { toValue: SWIPE_FULL, ...springConfig }).start(
      () => { isOpen.current = true; }
    );
  }, []);

  const close = useCallback(() => {
    Animated.spring(translateX, { toValue: 0, ...springConfig }).start(
      () => { isOpen.current = false; }
    );
  }, []);

  const pressIn = (scale: Animated.Value) =>
    Animated.spring(scale, { toValue: 0.88, ...fastSpring }).start();
  const pressOut = (scale: Animated.Value) =>
    Animated.spring(scale, { toValue: 1, ...fastSpring }).start();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderGrant: () => {
        translateX.stopAnimation();
        translateX.setOffset((translateX as any)._value);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        // Allow slight over-drag (rubber-band) to the right when open
        let next = g.dx;
        if (!isOpen.current) {
          next = Math.min(8, Math.max(SWIPE_FULL * 1.05, g.dx)); // open direction
        } else {
          next = Math.min(8, Math.max(SWIPE_FULL * 1.05, g.dx));
        }
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        translateX.flattenOffset();
        const current = (translateX as any)._value;
        if (g.vx < -0.5 || (current < -SWIPE_THRESHOLD && g.vx >= 0)) {
          open();
        } else {
          close();
        }
      },
      onPanResponderTerminate: () => {
        translateX.flattenOffset();
        close();
      },
    })
  ).current;

  // ── Derived animated values ──────────────────────────────────────
  const actionsProgress = translateX.interpolate({
    inputRange: [SWIPE_FULL, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Individual button slide-in from right (staggered)
  const deleteSlide = translateX.interpolate({
    inputRange: [SWIPE_FULL, -SWIPE_THRESHOLD * 0.5, 0],
    outputRange: [0, 4, 24],
    extrapolate: "clamp",
  });
  const starSlide = translateX.interpolate({
    inputRange: [SWIPE_FULL, -SWIPE_THRESHOLD * 0.5, 0],
    outputRange: [0, 8, 36],
    extrapolate: "clamp",
  });

  // Icon pop when fully open
  const iconScale = translateX.interpolate({
    inputRange: [SWIPE_FULL, SWIPE_FULL * 0.6, 0],
    outputRange: [1, 0.8, 0.6],
    extrapolate: "clamp",
  });

  // Subtle row shadow lift while dragging
  const rowElevation = translateX.interpolate({
    inputRange: [SWIPE_FULL, -SWIPE_THRESHOLD * 0.3, 0],
    outputRange: [1, 0.6, 0],
    extrapolate: "clamp",
  });

  // Separator fade
  const separatorOpacity = translateX.interpolate({
    inputRange: [SWIPE_FULL, -SWIPE_THRESHOLD * 0.4, 0],
    outputRange: [0, 0.3, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.root, { backgroundColor: T.rootBg }]}>
      {/* ── Action panel ─────────────────────────────────────── */}
      <View style={[styles.actions, { width: Math.abs(SWIPE_FULL) }]}>

        {/* Star button */}
        <Animated.View
          style={[
            styles.btnWrap,
            { transform: [{ translateX: starSlide }, { scale: starScale }] },
          ]}
        >
          <Pressable
            style={[styles.btn, { backgroundColor: T.starBg }]}
            onPressIn={() => pressIn(starScale)}
            onPressOut={() => pressOut(starScale)}
            onPress={() => { close(); setTimeout(onStar, 180); }}
          >
            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              {isStarred ? (
                <Ionicons name="star" size={19} color={T.starIcon} />
              ) : (
                <Ionicons name="star-outline" size={19} color={T.starIcon} />
              )}
            </Animated.View>
            <Text style={[styles.btnLabel, { color: T.starLabel }]}>
              {isStarred ? "Unstar" : "Star"}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Divider */}
        <Animated.View style={[styles.divider, { backgroundColor: T.divider, opacity: actionsProgress }]} />

        {/* Delete button */}
        <Animated.View
          style={[
            styles.btnWrap,
            { transform: [{ translateX: deleteSlide }, { scale: deleteScale }] },
          ]}
        >
          <Pressable
            style={[styles.btn, { backgroundColor: T.deleteBg }]}
            onPressIn={() => pressIn(deleteScale)}
            onPressOut={() => pressOut(deleteScale)}
            onPress={() => { close(); setTimeout(onDelete, 180); }}
          >
            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              <IconTrash size={19} color={T.deleteIcon} />
            </Animated.View>
            <Text style={[styles.btnLabel, { color: T.deleteLabel }]}>Delete</Text>
          </Pressable>
        </Animated.View>

      </View>

      {/* ── Row separator fade ───────────────────────────────── */}
      <Animated.View
        style={[styles.separator, { backgroundColor: T.separator, opacity: separatorOpacity }]}
      />

      {/* ── Swipeable content ────────────────────────────────── */}
      <Animated.View
        style={[
          styles.row,
          {
            backgroundColor: T.rowBg,
            transform: [{ translateX }],
            shadowColor: T.shadow,
            shadowOpacity: rowElevation as any,
            shadowRadius: 12,
            shadowOffset: { width: -4, height: 0 },
            elevation: 4,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

// ── Color tokens ────────────────────────────────────────────────────
const light = {
  rootBg:      "#f1f5f9",
  rowBg:       "#ffffff",
  starBg:      "#fef3c7",
  starIcon:    "#b45309",
  starLabel:   "#92400e",
  deleteBg:    "#fee2e2",
  deleteIcon:  "#dc2626",
  deleteLabel: "#991b1b",
  divider:     "#e2e8f0",
  separator:   "#e2e8f0",
  shadow:      "#64748b",
};

const dark = {
  rootBg:      "#0f172a",
  rowBg:       "#1e293b",
  starBg:      "#422006",
  starIcon:    "#fbbf24",
  starLabel:   "#fcd34d",
  deleteBg:    "#3b0a0a",
  deleteIcon:  "#f87171",
  deleteLabel: "#fca5a5",
  divider:     "#334155",
  separator:   "#334155",
  shadow:      "#000000",
};

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
  },
  actions: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "stretch",
  },
  btnWrap: {
    flex: 1,
    alignItems: "stretch",
  },
  btn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 4,
  },
  btnLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  divider: {
    width: 1,
    marginVertical: 12,
    alignSelf: "stretch",
  },
  row: {
    // shadow props set inline for animated value
  },
  separator: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});