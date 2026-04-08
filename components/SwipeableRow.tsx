import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Animated, PanResponder, StyleSheet } from "react-native";
import { SWIPE_THRESHOLD, SWIPE_FULL } from "./constants";
import { IconArchive, IconRestore, IconTrash } from "./Icons";

type Props = {
  children: React.ReactNode;
  onDelete: () => void;
  onArchive: () => void;
  isArchived: boolean;
};

export const SwipeableRow = ({ children, onDelete, onArchive, isArchived }: Props) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const open = () => {
    Animated.spring(translateX, { toValue: SWIPE_FULL, tension: 120, friction: 14, useNativeDriver: true })
      .start(() => { isOpen.current = true; });
  };

  const close = () => {
    Animated.spring(translateX, { toValue: 0, tension: 120, friction: 14, useNativeDriver: true })
      .start(() => { isOpen.current = false; });
  };

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
        const next = Math.min(0, Math.max(SWIPE_FULL, g.dx));
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

  const actionsOpacity = translateX.interpolate({
    inputRange: [SWIPE_FULL, -SWIPE_THRESHOLD, 0],
    outputRange: [1, 0.6, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={{ overflow: "hidden" }}>
      <Animated.View style={[styles.swipeActions, { opacity: actionsOpacity }]}>
        <TouchableOpacity
          style={[styles.swipeBtn, styles.swipeBtnArchive]}
          onPress={() => { close(); setTimeout(onArchive, 200); }}
        >
          {isArchived ? <IconRestore size={20} color="#e5e7eb" /> : <IconArchive size={20} color="#e5e7eb" />}
          <Text style={styles.swipeBtnText}>{isArchived ? "Restore" : "Archive"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeBtn, styles.swipeBtnDelete]}
          onPress={() => { close(); setTimeout(onDelete, 200); }}
        >
          <IconTrash size={20} color="#e5e7eb" />
          <Text style={styles.swipeBtnText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeActions: { position: "absolute", right: 0, top: 0, bottom: 0, flexDirection: "row" },
  swipeBtn: { width: 80, justifyContent: "center", alignItems: "center", gap: 4 },
  swipeBtnArchive: { backgroundColor: "#1a4a2e" },
  swipeBtnDelete: { backgroundColor: "#6b1c1c" },
  swipeBtnText: { fontSize: 11, color: "#e5e7eb", fontWeight: "600", textAlign: "center" },
});
