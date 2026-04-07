import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"; 
import { View, Text, Platform } from "react-native";
import { useEffect, useState } from "react";
import { getUser } from "../../utils/db";

export default function TabsLayout() {
  const [name, setName] = useState("");

  useEffect(() => {
    const user = getUser();
    if (user && user.length > 0) {
      setName(user[0].name);
    }
  }, []);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: "#0f172a",
          height: Platform.OS === "ios" ? 110 : 90,
        },
        headerTitleAlign: "center",
        headerTintColor: "#fff",

        // 🔹 MONEY MANAGER LOGO & GREETING
        headerLeft: () => (
          <View style={{ marginLeft: 20, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ 
              backgroundColor: "#1e293b", 
              padding: 6, 
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#334155"
            }}>
              <MaterialCommunityIcons name="wallet-outline" size={24} color="#2ECC71" />
            </View>
            <View style={{ marginLeft: 10 }}>
               <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "500" }}>Hello,</Text>
               <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}>{name || "User"}</Text>
            </View>
          </View>
        ),

        headerTitle: () => {
          const titles: Record<string, string> = {
            index: "Dashboard", // Changed 'Home' to 'Dashboard' for a finance feel
            analytics: "Insights",
            offers: "Special Deals",
            profile: "Profile",
          };

          return (
            <Text style={{ 
              fontSize: 17, 
              fontWeight: "700", 
              color: "#ffffff",
              letterSpacing: 0.5 
            }}>
              {titles[route.name] || "Manager"}
            </Text>
          );
        },

        // 🔥 FLOATING TAB BAR
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 30 : 20,
          left: 20,
          right: 20,
          backgroundColor: "#0e1219", 
          borderRadius: 25,
          height: 65,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === "ios" ? 0 : 5,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
        },

        tabBarActiveTintColor: "#2ECC71",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: -5,
          marginBottom: 10,
        },
      })}
    >
      {/* ... rest of your Tabs.Screen components remain the same ... */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      {/* Keep other screens as they were */}
      <Tabs.Screen name="analytics" options={{ title: "Analytics", tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={22} color={color} />)}} />
      <Tabs.Screen name="offers" options={{ title: "Offers", tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? "gift" : "gift-outline"} size={22} color={color} />)}} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />)}} />
    </Tabs>
  );
}