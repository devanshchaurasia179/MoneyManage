import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { ThemeProvider } from "../context/ThemeContext";
import { initDB } from "../utils/db";

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDB();
    setDbReady(true);
  }, []);

  if (!dbReady) return null;

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* your screens */}
      </Stack>
    </ThemeProvider>
  );
}