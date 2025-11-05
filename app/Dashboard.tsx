import React from "react";
import { View, Text, StyleSheet, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import colors from "../constants/colors";
import formStyles from "../constants/formStyles";
import { useAuth } from "./AuthContext";

type RoutePath = "/profile" | "/workout" | "/calories" | "/settings" | "/library";

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, clearUser } = useAuth() as any;

  const menuItems: { title: string; icon: any; route: RoutePath }[] = [
    { title: "Profile", icon: "person-circle-outline", route: "/profile" },
    { title: "Workout", icon: "barbell-outline", route: "/workout" },
    { title: "Calories", icon: "flame-outline", route: "/calories" },
    { title: "Settings", icon: "settings-outline", route: "/settings" },
    { title: "Library", icon: "book-outline", route: "/library" },
  ];

  // Logout logic
  const handleLogout = async () => {
    try {
      await clearUser();
      router.replace("/login")
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      // Logout button in top-right corner 
      <Pressable onPress={handleLogout}
        style={[styles.logoutBtn,
          { top: insets.top + 8 },  
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Log out">
          <Ionicons name="log-out-outline" size={22} color="#fff"/>
          <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <ScrollView contentContainerStyle={[styles.screen, { paddingBottom: 20 + insets.bottom }]}>
        {/* Header Section with Mascot */}
        <View style={styles.heroWrap}>
          <Text style={formStyles.welcome}>Dashboard</Text>
          <Image
            source={require("../assets/panda.png")}
            style={styles.panda}
            resizeMode="contain"
          />
        </View>

        {/* Main Card Section */}
        <View style={[formStyles.card, styles.cardContainer]}>
          <Text style={styles.sectionTitle}>Your Tools</Text>

          <View style={styles.grid}>
            {menuItems.map((item, index) => (
              <Pressable
                key={index}
                onPress={() => router.push(item.route)}
                style={({ pressed }) => [
                  styles.cardButton,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Ionicons name={item.icon} size={38} color={colors.primaryDark} />
                <Text style={styles.cardText}>{item.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryDark },
  screen: { flexGrow: 1, backgroundColor: colors.primaryDark },

  heroWrap: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 220,
  },
  panda: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginBottom: -40,
  },

  cardContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    width: "100%",
  },

  cardButton: {
    width: "40%",
    backgroundColor: colors.cardBgLight,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  cardText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 16,
    marginTop: 6,
  },

  logoutBtn: {
    position: "absolute", 
    right: 12, 
    zIndex: 10, 
    flexDirection: "row",
    alignItems: "center", 
    gap: 6, 
    backgroundColor: "rgba(255,255,255,0.15)", 
    borderRadius: 999, 
    paddingHorizontal: 12, 
    paddingVertical: 8
  }, 

  logoutText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
