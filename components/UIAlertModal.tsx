import React, { useRef } from "react";
import { Modal, Animated, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AlertConfig } from "./constants";
import { IconTrash, IconArchive, IconInfo, IconWarn } from "./Icons";
import { useTheme } from "../context/ThemeContext";

type Props = { config: AlertConfig | null; onDismiss: () => void };

export const UIAlertModal = ({ config, onDismiss }: Props) => {
  const { isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const isVisible = !!config;

  const C = isDark ? {
    boxBg: "#0f1b12", boxBorder: "#1a3320",
    title: "#e5e7eb", message: "#9ca3af",
    btnBg: "#0a140d", btnBorder: "#1a3320",
    cancelBorder: "#1a3320", cancelBg: "#0a140d", cancelText: "#6b7280",
    destructiveBorder: "#7f1d1d", destructiveBg: "#1c0a0a", destructiveText: "#f87171",
    defaultBorder: "#14532d", defaultBg: "#0d2214", defaultText: "#2CCE71",
  } : {
    boxBg: "#ffffff", boxBorder: "#e2e8f0",
    title: "#0f172a", message: "#64748b",
    btnBg: "#f8fafc", btnBorder: "#e2e8f0",
    cancelBorder: "#e2e8f0", cancelBg: "#f8fafc", cancelText: "#64748b",
    destructiveBorder: "#fca5a5", destructiveBg: "#fef2f2", destructiveText: "#dc2626",
    defaultBorder: "#86efac", defaultBg: "#f0fdf4", defaultText: "#16a34a",
  };

  React.useEffect(() => {
    if (isVisible) {
      fadeAnim.setValue(0); scaleAnim.setValue(0.92);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 18, useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible]);

  if (!config) return null;

  const dismiss = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 140, useNativeDriver: true }),
    ]).start(() => { onDismiss(); cb?.(); });
  };

  const IconComponent = () => {
    if (config.icon === "trash") return <IconTrash size={28} color="#f87171" />;
    if (config.icon === "archive") return <IconArchive size={28} color="#60a5fa" />;
    if (config.icon === "info") return <IconInfo size={28} color="#60a5fa" />;
    return <IconWarn size={28} color="#f59e0b" />;
  };

  const iconBg = config.icon === "trash" ? "#2a1010" : config.icon === "archive" ? "#0d1f35" : config.icon === "info" ? "#0d1f35" : "#2a1c05";
  const iconBorder = config.icon === "trash" ? "#7f1d1d" : config.icon === "archive" ? "#1e3a5f" : config.icon === "info" ? "#1e3a5f" : "#78350f";

  return (
    <Modal visible transparent animationType="none">
      <Animated.View style={[styles.alertOverlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.alertBox, { backgroundColor: C.boxBg, borderColor: C.boxBorder, transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.alertIconWrap, { backgroundColor: iconBg, borderColor: iconBorder }]}>
            <IconComponent />
          </View>
          <Text style={[styles.alertTitle, { color: C.title }]}>{config.title}</Text>
          <Text style={[styles.alertMessage, { color: C.message }]}>{config.message}</Text>
          <View style={styles.alertButtons}>
            {config.buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.alertBtn,
                  btn.style === "cancel" && { borderColor: C.cancelBorder, backgroundColor: C.cancelBg },
                  btn.style === "destructive" && { borderColor: C.destructiveBorder, backgroundColor: C.destructiveBg },
                  btn.style === "default" && { borderColor: C.defaultBorder, backgroundColor: C.defaultBg },
                ]}
                activeOpacity={0.75}
                onPress={() => dismiss(btn.onPress)}
              >
                <Text style={[styles.alertBtnText,
                  btn.style === "cancel" && { color: C.cancelText },
                  btn.style === "destructive" && { color: C.destructiveText },
                  btn.style === "default" && { color: C.defaultText },
                ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  alertOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  alertBox: { borderRadius: 20, padding: 24, borderWidth: 1, width: "100%", alignItems: "center" },
  alertIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 1 },
  alertTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  alertMessage: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  alertButtons: { width: "100%", gap: 8 },
  alertBtn: { paddingVertical: 13, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  alertBtnText: { fontSize: 14, fontWeight: "600" },
});