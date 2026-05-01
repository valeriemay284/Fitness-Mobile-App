// @ts-nocheck
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type Mode = "scan" | "manual" | "plan" | "library";

const COLORS = {
  bg: "#DDECC8",
  card: "#F7F6E7",
  primary: "#42564F",
  text: "#2F4F3E",
  muted: "#6B7280",
};

export default function CaloriesPage() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("scan");
  const [loadingMessage, setLoadingMessage] = useState("Fetching product info...");

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [calories, setCalories] = useState("");
  const [carbs, setCarbs] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");

  const [username, setUsername] = useState("");
  const [bmr, setBmr] = useState<number | null>(null);
  const [tdee, setTdee] = useState<number | null>(null);

  const [foodHistory, setFoodHistory] = useState<any[]>([]);

  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const loadFoods = async () => {
    try {
      const data = await AsyncStorage.getItem("library");
      setFoodHistory(data ? JSON.parse(data) : []);
    } catch {}
  };

  const saveFood = async (food: any) => {
    const existing = await AsyncStorage.getItem("library");
    const foods = existing ? JSON.parse(existing) : [];
    foods.unshift(food);
    await AsyncStorage.setItem("library", JSON.stringify(foods));
    setFoodHistory(foods);
  };

  const removeLibraryItem = async (index: number) => {
    const updated = [...foodHistory];
    updated.splice(index, 1);
    await AsyncStorage.setItem("library", JSON.stringify(updated));
    setFoodHistory(updated);
  };

  const clearLibrary = async () => {
    Alert.alert("Clear Library", "Delete all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("library");
          setFoodHistory([]);
        },
      },
    ]);
  };

  const safeNum = (v: any) => (typeof v === "number" ? v.toFixed(1) : "-");

  const renderTab = (label: string, value: Mode) => {
    const active = mode === value;

    return (
      <Pressable
        onPress={() => {
          setMode(value);
          if (value === "scan") {
            setScanning(true);
            setScanned(false);
          }
          if (value === "library") loadFoods();
        }}
        style={[
          styles.tab,
          {
            backgroundColor: active ? COLORS.primary : "transparent",
          },
        ]}
      >
        <Text style={[styles.tabText, { color: active ? "#fff" : COLORS.primary }]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  if (!permission) return <Text>Loading...</Text>;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.screen}>
        {/* HERO */}
        <View style={styles.hero}>
          <Text style={styles.title}>Calories Tracker</Text>
          <Image source={require("../../assets/panda.png")} style={styles.panda} />
        </View>

        {/* CARD */}
        <View style={styles.card}>
          {/* Tabs */}
          <View style={styles.tabRow}>
            {renderTab("Scan", "scan")}
            {renderTab("Manual", "manual")}
            {renderTab("Plan", "plan")}
            {renderTab("Library", "library")}
          </View>

          {/* SCAN */}
          {mode === "scan" && (
            <View>
              {!scanning ? (
                <Pressable
                  style={styles.button}
                  onPress={() => setScanning(true)}
                >
                  <Text style={styles.buttonText}>Open Scanner</Text>
                </Pressable>
              ) : (
                <View>
                  <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : () => {}}
                  />

                  <Pressable style={styles.button} onPress={() => setScanning(false)}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* MANUAL */}
          {mode === "manual" && (
            <ScrollView>
              {["Food name", "Brand", "Calories", "Carbs", "Protein", "Fat"].map(
                (ph, i) => (
                  <TextInput
                    key={i}
                    style={styles.input}
                    placeholder={ph}
                    placeholderTextColor={COLORS.muted}
                  />
                )
              )}

              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Save Food</Text>
              </Pressable>
            </ScrollView>
          )}

          {/* PLAN */}
          {mode === "plan" && (
            <ScrollView>
              <TextInput style={styles.input} placeholder="Username" />
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Fetch Info</Text>
              </Pressable>

              {(bmr || tdee) && (
                <View style={styles.infoCard}>
                  <Text style={styles.info}>BMR: {bmr ?? "-"}</Text>
                  <Text style={styles.info}>TDEE: {tdee ?? "-"}</Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* LIBRARY */}
          {mode === "library" && (
            <ScrollView>
              {foodHistory.map((item, i) => (
                <View key={i} style={styles.foodCard}>
                  <Text style={styles.foodTitle}>{item.name}</Text>
                  <Text style={styles.foodSub}>{item.brand}</Text>
                  <Text style={styles.foodMeta}>
                    Cal {safeNum(item.calories)} | P {safeNum(item.protein)} | C {safeNum(item.carbs)} | F {safeNum(item.fat)}
                  </Text>

                  <Pressable style={styles.deleteBtn} onPress={() => removeLibraryItem(i)}>
                    <Text style={styles.buttonText}>Delete</Text>
                  </Pressable>
                </View>
              ))}

              <Pressable style={styles.deleteBtn} onPress={clearLibrary}>
                <Text style={styles.buttonText}>Clear All</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>

        {loading && <ActivityIndicator size="large" />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#DDECC8" },
  screen: { flex: 1 },

  hero: {
    alignItems: "center",
    paddingTop: 30,
    height: 200,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
  },

  panda: {
    width: 140,
    height: 140,
  },

  card: {
    flex: 1,
    backgroundColor: "#F7F6E7",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 16,
  },

  tabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  tab: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
  },

  tabText: { fontWeight: "700", fontSize: 12 },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8D9",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  button: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

  camera: {
    height: 300,
    borderRadius: 12,
  },

  infoCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },

  info: {
    fontWeight: "600",
    color: COLORS.text,
  },

  foodCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  foodTitle: { fontWeight: "800", color: COLORS.text },
  foodSub: { color: COLORS.muted },
  foodMeta: { fontSize: 12, marginTop: 4 },

  deleteBtn: {
    backgroundColor: "#d9534f",
    padding: 8,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },
});