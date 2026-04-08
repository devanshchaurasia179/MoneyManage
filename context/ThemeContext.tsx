import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useColorScheme, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── DO NOT import getUser here at module level ──
// getUser is called lazily after DB is confirmed ready

interface ThemeContextValue {
  isDark: boolean;
  toggle: () => void;
  setDark: (val: boolean) => void;
  userName: string;
  setUserName: (name: string) => void;
  refreshUser: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
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
  const [isDark, setIsDark] = useState(systemScheme === "dark");
  const [loaded, setLoaded] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // 1. Load theme preference
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (val !== null) setIsDark(val === "dark");
        else setIsDark(systemScheme === "dark");
      })
      .catch(() => {})
      .finally(() => setLoaded(true));

    // 2. Load user name safely — DB must be initialized by the time
    //    this effect runs (initDB() is called in app/_layout.tsx before
    //    ThemeProvider mounts, so it's safe here inside useEffect,
    //    NOT at module/render time)
    try {
      const { getUser } = require("../utils/db");
      const users = getUser();
      if (users && users.length > 0) setUserName(users[0].name ?? "");
    } catch {
      // DB not ready yet — userName stays "" until refreshUser() is called
    }
  }, []);

  const refreshUser = useCallback(() => {
    try {
      const { getUser } = require("../utils/db");
      const users = getUser();
      if (users && users.length > 0) setUserName(users[0].name ?? "");
    } catch {
      // silently ignore if DB not ready
    }
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