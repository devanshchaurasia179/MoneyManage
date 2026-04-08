import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useColorScheme, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ThemeContextValue {
  isDark: boolean;
  toggle: () => void;
  setDark: (val: boolean) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggle: () => {},
  setDark: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// ─── Provider ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "app_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");
  const [loaded, setLoaded] = useState(false);

  // Load persisted preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (val !== null) setIsDark(val === "dark");
        else setIsDark(systemScheme === "dark");
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, next ? "dark" : "light").catch(() => {});
      return next;
    });
  }, []);

  const setDark = useCallback((val: boolean) => {
    setIsDark(val);
    AsyncStorage.setItem(STORAGE_KEY, val ? "dark" : "light").catch(() => {});
  }, []);

  if (!loaded) return null; // Prevent flash before preference loads

  return (
    <ThemeContext.Provider value={{ isDark, toggle, setDark }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#080C12" : "#ffffff"}
      />
      {children}
    </ThemeContext.Provider>
  );
}