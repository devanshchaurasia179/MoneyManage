import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { insertUser, initDB } from "../../utils/db";

const currencies = ["₹", "$", "€", "£"];

export default function Onboarding() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("₹");

  const handleContinue = () => {
    if (!name.trim()) return;

    initDB();
    insertUser(name, currency);

    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome 👋</Text>
      <Text style={styles.subtitle}>Let’s personalize your experience</Text>

      {/* Name Input */}
      <TextInput
        placeholder="Enter your name"
        placeholderTextColor="#94a3b8"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      {/* Currency Selection */}
      <Text style={styles.label}>Select Currency</Text>

      <View style={styles.currencyContainer}>
        {currencies.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.currencyButton,
              currency === item && styles.selectedCurrency,
            ]}
            onPress={() => setCurrency(item)}
          >
            <Text
              style={[
                styles.currencyText,
                currency === item && styles.selectedCurrencyText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#1e293b",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    color: "#94a3b8",
    marginBottom: 10,
  },
  currencyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  currencyButton: {
    flex: 1,
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: "#1e293b",
    alignItems: "center",
  },
  selectedCurrency: {
    backgroundColor: "#22c55e",
  },
  currencyText: {
    color: "#fff",
    fontSize: 16,
  },
  selectedCurrencyText: {
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});