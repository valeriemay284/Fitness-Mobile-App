//This folder contains the screens that should appear in the bottom tab bar
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import colors from "../../constants/colors";

export default function TabLayout() {
  return (
    // The bottom tab navigator for the app
    <Tabs
      screenOptions={{
        headerShown: false, // hide header for all tabs
        tabBarActiveTintColor: colors.primary, // active icon/text color

        // styling for the bottom tab bar
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 12,
        },

        // label under each icon
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >

      {/* Home tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Workout tab */}
      <Tabs.Screen
        name="workout"
        options={{
          title: "Workout",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Calories tab */}
      <Tabs.Screen
        name="calories"
        options={{
          title: "Calories",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Library tab */}
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Settings tab */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
