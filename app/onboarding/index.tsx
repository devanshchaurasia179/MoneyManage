import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { insertUser, initDB } from "../../utils/db";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const currencies = [
  { label: "Rupee", symbol: "₹" },
  { label: "Dollar", symbol: "$" },
  { label: "Euro", symbol: "€" },
  { label: "Pound", symbol: "£" },
];

export default function Onboarding() {
  const router = useRouter();
  const { refreshUser } = useTheme();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("₹");
  const [isFocused, setIsFocused] = useState(false);

  const handleContinue = () => {
    if (!name.trim()) return;
    initDB();
    insertUser(name, currency);
    refreshUser();
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Set up profile</Text>
            <Text style={styles.subtitle}>Help us tailor your financial dashboard</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>FULL NAME</Text>
            <View style={[
              styles.inputContainer, 
              isFocused && styles.inputFocused
            ]}>
              <Ionicons name="person-outline" size={20} color={isFocused ? "#22c55e" : "#94a3b8"} />
              <TextInput
                placeholder="e.g. John Doe"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={styles.input}
              />
            </View>

            <Text style={[styles.label, { marginTop: 25 }]}>PRIMARY CURRENCY</Text>
            <View style={styles.currencyGrid}>
              {currencies.map((item) => (
                <TouchableOpacity
                  key={item.symbol}
                  activeOpacity={0.7}
                  style={[
                    styles.currencyCard,
                    currency === item.symbol && styles.selectedCurrencyCard,
                  ]}
                  onPress={() => setCurrency(item.symbol)}
                >
                  <Text style={[
                    styles.currencySymbol,
                    currency === item.symbol && styles.selectedText
                  ]}>
                    {item.symbol}
                  </Text>
                  <Text style={[
                    styles.currencyLabel,
                    currency === item.symbol && styles.selectedText
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, !name.trim() && styles.buttonDisabled]} 
            onPress={handleContinue}
            disabled={!name.trim()}
          >
            <Text style={styles.buttonText}>Finish Setup</Text>
            <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  header: {
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    marginTop: 8,
  },
  form: {
    flex: 1,
    marginTop: 40,
  },
  label: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#22c55e",
  },
  inputFocused: {
    borderColor: "#22c55e",
    backgroundColor: "#ffffff",
  },
  input: {
    flex: 1,
    color: "#000000",
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  currencyCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1.5,
    borderColor: "grey",
  },
  selectedCurrencyCard: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderColor: "#22c55e",
  },
  currencySymbol: {
    fontSize: 24,
    color: "#94a3b8",
    marginBottom: 4,
  },
  currencyLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  selectedText: {
    color: "#22c55e",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#22c55e",
    flexDirection: 'row',
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: "#334155",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});