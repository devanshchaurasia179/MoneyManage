import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ThemeProvider } from "../context/ThemeContext";
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider>
      
      <Stack screenOptions={{ headerShown: false }}>
        {/* Get Started Screen */}
        <Stack.Screen name="index" />

        {/* Onboarding Flow */}
        <Stack.Screen name="onboarding/index" />

        {/* Main App */}
        <Stack.Screen name="(tabs)" />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}