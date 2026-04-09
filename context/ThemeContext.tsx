import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useColorScheme, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ThemeContextValue {
  isDark: boolean;
  toggle: () => void;
  setDark: (val: boolean) => void;
  userName: string;
  setUserName: (name: string) => void;
  refreshUser: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,        // ← default light
  toggle: () => {},
  setDark: () => {},
  userName: "",
  setUserName: () => {},
  refreshUser: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const STORAGE_KEY = "app_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);   // ← always start light
  const [loaded, setLoaded] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (val !== null) {
          // User has an explicit saved preference — respect it
          setIsDark(val === "dark");
        } else {
          // No saved preference — default to light regardless of system
          setIsDark(false);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));

    try {
      const { getUser } = require("../utils/db");
      const users = getUser();
      if (users && users.length > 0) setUserName(users[0].name ?? "");
    } catch {
      // DB not ready yet
    }
  }, []);

  const refreshUser = useCallback(() => {
    try {
      const { getUser } = require("../utils/db");
      const users = getUser();
      if (users && users.length > 0) setUserName(users[0].name ?? "");
    } catch {}
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

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggle, setDark, userName, setUserName, refreshUser }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#080C12" : "#ffffff"}
      />
      {children}
    </ThemeContext.Provider>
  );
}