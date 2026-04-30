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
import colors from "../../constants/colors";
import formStyles from "../../constants/formStyles";

/**
 * CaloriesPage allows users to track nutrition info.
 * They can either scan a barcode using their camera
 * or manually input food details (name, brand, calories, etc.)
 * The scanned or entered data is sent to the ScanResult screen.
 *
 * 
 * Users can view their stored BMR/TDEE from the backend
 * by entering their username.
 */

type Mode = "scan" | "manual" | "plan" | "library";

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

  //  library state used inside the Library tab
  const [foodHistory, setFoodHistory] = useState<any[]>([]);

  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  // Load saved foods
  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      //  use same storage key as library screen
      const data = await AsyncStorage.getItem("library");
      if (data) setFoodHistory(JSON.parse(data));
      else setFoodHistory([]);
    } catch (e) {
      console.log("Error loading foods");
    }
  };

  // Save food
  const saveFood = async (food: any) => {
    try {
      //  use same storage key as library screen
      const existing = await AsyncStorage.getItem("library");
      const foods = existing ? JSON.parse(existing) : [];

      foods.unshift(food);

      await AsyncStorage.setItem("library", JSON.stringify(foods));
      setFoodHistory(foods);
    } catch (e) {
      console.log("Error saving food");
    }
  };

  //  remove single item from library
  const removeLibraryItem = async (index: number) => {
    try {
      const updated = [...foodHistory];
      updated.splice(index, 1);
      await AsyncStorage.setItem("library", JSON.stringify(updated));
      setFoodHistory(updated);
    } catch (e) {
      console.log("Error removing item");
    }
  };

  //  clear all library items
  const clearLibrary = async () => {
    Alert.alert("Clear Library", "Are you sure you want to delete all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, clear",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("library");
          setFoodHistory([]);
        },
      },
    ]);
  };

  // Barcode scan handling
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanning(false);
    setLoading(true);
    setLoadingMessage("Fetching product info...");

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${data}.json`
      );
      const json = await response.json();
      setLoading(false);

      if (json.status === 1) {
        const p = json.product;

        const productData = {
          name: p.product_name || "Unknown item",
          brand: p.brands || "Unknown brand",
          calories:
            p.nutriments["energy-kcal_serving"] ||
            p.nutriments["energy-kcal_100g"] ||
            null,
          carbs: p.nutriments["carbohydrates_100g"] || null,
          protein: p.nutriments["proteins_100g"] || null,
          fat: p.nutriments["fat_100g"] || null,
        };

        // Save scanned food to library
        await saveFood(productData);

        router.push({
          pathname: "/ScanResult",
          params: { product: encodeURIComponent(JSON.stringify(productData)) },
        });
      } else {
        Alert.alert("Not Found", "No food found for this barcode.");
      }
    } catch (e) {
      setLoading(false);
      Alert.alert("Error", "Could not fetch product info.");
    }
  };

  // Manual entry handler
  const onManualSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Missing info", "Please enter at least a food name.");
      return;
    }

    const productData = {
      name: name.trim(),
      brand: brand || "Unknown brand",
      calories: Number(calories) || null,
      carbs: Number(carbs) || null,
      protein: Number(protein) || null,
      fat: Number(fat) || null,
    };

    // Save manual food to library
    await saveFood(productData);

    router.push({
      pathname: "/ScanResult",
      params: { product: encodeURIComponent(JSON.stringify(productData)) },
    });
  };

  // Demo: Fetch BMR/TDEE from backend
  const fetchCaloriesInfo = async () => {
    if (!username.trim()) {
      Alert.alert("Missing info", "Please enter your username.");
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage("Fetching your calorie targets...");

      const response = await fetch(
        `http://10.41.221.154:8080/api/getCaloriesInfo?username=${username}`
      );
      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        Alert.alert("Not found", "No calorie data found for this user.");
        return;
      }

      setBmr(Math.round(data.bmr));
      setTdee(Math.round(data.tdee));
    } catch (error) {
      setLoading(false);
      Alert.alert("Server Error", "Could not connect to backend.");
    }
  };

  const renderTab = (label: string, value: Mode) => {
    const active = mode === value;

    return (
      <Pressable
        onPress={() => {
          setMode(value);

          //  open scanner when Scan tab is pressed
          if (value === "scan") {
            setScanned(false);
            setScanning(true);
          } else {
            setScanning(false);
          }

          //  refresh library when Library tab opens
          if (value === "library") {
            loadFoods();
          }
        }}
        style={[
          styles.tabButton,
          {
            backgroundColor: active ? colors.primaryDark : colors.background,
            borderColor: colors.primaryDark,
          },
        ]}
      >
        <Text
          style={[
            styles.tabText,
            { color: active ? "#fff" : colors.primaryDark },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  //  safe number display helper
  const safeNum = (v: any) => {
    return typeof v === "number" ? v : "-";
  };

  if (!permission) return <Text>Requesting camera permission...</Text>;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>No access to camera</Text>
          <Pressable onPress={requestPermission} style={formStyles.button}>
            <Text style={formStyles.buttonText}>Grant Permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.heroWrap}>
          <Text style={formStyles.welcome}>Calories Tracker</Text>
          <Image
            source={require("../../assets/panda.png")}
            style={styles.panda}
          />
        </View>

        <View style={[formStyles.card, { paddingBottom: 20 + insets.bottom }]}>
          {/* Tabs */}
          <View style={styles.tabsRow}>
            {renderTab("Scan", "scan")}
            {renderTab("Manual", "manual")}
            {renderTab("My Plan", "plan")}
            {renderTab("Library", "library")}
          </View>

          {/* SCAN */}
          {mode === "scan" && (
            <View>
              {!scanning ? (
                <Pressable
                  style={formStyles.button}
                  onPress={() => {
                    // manual fallback button to open scanner
                    setScanned(false);
                    setScanning(true);
                  }}
                >
                  <Text style={formStyles.buttonText}>Open Scanner</Text>
                </Pressable>
              ) : (
                <View>
                  {/*  camera scanner view */}
                  <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{
                      barcodeTypes: [
                        "ean13",
                        "ean8",
                        "upc_a",
                        "upc_e",
                        "code128",
                        "code39",
                      ],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                  />

                  <Pressable
                    style={[formStyles.button, styles.cancelScanButton]}
                    onPress={() => setScanning(false)}
                  >
                    <Text style={formStyles.buttonText}>Cancel Scan</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* MANUAL */}
          {mode === "manual" && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Manual Entry</Text>

              {/*  manual food input fields */}
              <TextInput
                style={styles.input}
                placeholder="Food name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={styles.input}
                placeholder="Brand"
                placeholderTextColor={colors.textMuted}
                value={brand}
                onChangeText={setBrand}
              />

              <TextInput
                style={styles.input}
                placeholder="Calories"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />

              <TextInput
                style={styles.input}
                placeholder="Carbs (g)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={carbs}
                onChangeText={setCarbs}
              />

              <TextInput
                style={styles.input}
                placeholder="Protein (g)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={protein}
                onChangeText={setProtein}
              />

              <TextInput
                style={styles.input}
                placeholder="Fat (g)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={fat}
                onChangeText={setFat}
              />

              <Pressable onPress={onManualSubmit} style={formStyles.button}>
                <Text style={formStyles.buttonText}>Save Food</Text>
              </Pressable>
            </ScrollView>
          )}

          {/* MY PLAN */}
          {mode === "plan" && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>My Plan</Text>

              {/*  username input for BMR/TDEE fetch */}
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              <Pressable onPress={fetchCaloriesInfo} style={formStyles.button}>
                <Text style={formStyles.buttonText}>Fetch Calorie Info</Text>
              </Pressable>

              {/*  display fetched calorie info */}
              {(bmr !== null || tdee !== null) && (
                <View style={styles.planCard}>
                  <Text style={styles.planText}>
                    BMR: {bmr !== null ? bmr : "--"}
                  </Text>
                  <Text style={styles.planText}>
                    TDEE: {tdee !== null ? tdee : "--"}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* LIBRARY */}
          {mode === "library" && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>My Foods</Text>

              {foodHistory.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={{ textAlign: "center", color: colors.textMuted }}>
                    No saved items yet. Scan something to add it.
                  </Text>
                </View>
              ) : (
                <>
                  {foodHistory.map((item, index) => (
                    <View key={index} style={styles.foodCard}>
                      <Text style={styles.foodName}>
                        {item.name || "Unnamed Item"}
                      </Text>
                      <Text style={styles.foodBrand}>
                        {item.brand || "Unknown Brand"}
                      </Text>
                      <Text style={styles.foodInfo}>
                        Calories: {safeNum(item.calories)} | Protein:{" "}
                        {safeNum(item.protein)}g | Carbs: {safeNum(item.carbs)}g
                        {" | "}Fat: {safeNum(item.fat)}g
                      </Text>

                      <Pressable
                        onPress={() => removeLibraryItem(index)}
                        style={[formStyles.button, styles.removeBtn]}
                      >
                        <Text style={formStyles.buttonText}>Remove</Text>
                      </Pressable>
                    </View>
                  ))}

                  <Pressable
                    onPress={clearLibrary}
                    style={[formStyles.button, styles.clearBtn]}
                  >
                    <Text style={formStyles.buttonText}>Clear Library</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          )}
        </View>

        {loading && (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <ActivityIndicator size="large" />
            <Text style={formStyles.mutedText}>{loadingMessage}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryDark },
  screen: { flex: 1, backgroundColor: colors.primaryDark },

  heroWrap: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 220,
  },
  panda: {
    width: 150,
    height: 150,
    marginBottom: -40,
  },

  tabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    flexGrow: 1,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabText: {
    fontWeight: "700",
    fontSize: 13,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    color: colors.text,
  },

  //  input styling for manual + plan tabs
  input: {
    borderWidth: 1,
    borderColor: "#D6DCE5",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: colors.text,
  },

  //  scanner styling
  camera: {
    width: "100%",
    height: 320,
    borderRadius: 12,
    overflow: "hidden",
  },
  cancelScanButton: {
    marginTop: 12,
  },

  //  plan result card
  planCard: {
    backgroundColor: "#F4F7FB",
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  planText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 6,
    textAlign: "center",
    fontWeight: "600",
  },

  foodCard: {
    backgroundColor: "#F4F7FB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  foodName: {
    fontWeight: "700",
    fontSize: 18,
    color: colors.primaryDark,
  },
  foodBrand: {
    color: colors.textMuted,
    marginBottom: 6,
  },
  foodInfo: {
    color: colors.text,
    fontSize: 13,
  },

  removeBtn: {
    backgroundColor: "#d9534f",
    marginTop: 8,
  },
  clearBtn: {
    backgroundColor: "#c9302c",
    marginTop: 20,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primaryDark,
    marginBottom: 8,
  },
});