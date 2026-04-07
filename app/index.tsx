import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useEffect, useState } from "react";
import { useRouter, useRootNavigationState } from "expo-router";
import { initDB, getUser } from "../utils/db";

export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!navigationState?.key) return;

  initDB();
  const user = getUser();

  if (user.length > 0) {
    setTimeout(() => {
      router.replace("/(tabs)");
    }, 0);
  } else {
    setLoading(false);
  }
}, [navigationState]);

  const handleStart = () => {
    router.push("/onboarding");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "white" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/finance.png")}
        style={styles.image}
        resizeMode="contain"
      />

      <Text style={styles.title}>Money Manage</Text>

      <Text style={styles.subtitle}>
        Track your expenses. Control your future.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  image: {
    width: 220,
    height: 220,
    marginBottom: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    marginVertical: 10,
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#22c55e",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});