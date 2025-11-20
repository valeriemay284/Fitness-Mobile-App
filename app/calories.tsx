/**
 * CaloriesPage 
 * 
 * Lets users track nutrition information by either scanning a barcode
 * using the device camera or manually entering food details (name, brand, calories, etc).
 * The scanned or entered data is sent to the ScanResult screen.
 */


import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, Image,} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import colors from "../constants/colors";
import formStyles from "../constants/formStyles";


/**
 * CaloriesPage component
 * 
 * Responsibilities: 
 * - Request and manage camera permissions. 
 * - Toggle between scanner and manual entry modes. 
 * - Handle barcode scans and fetch prouct data from OpenFoodFacts. 
 * - Push a product summary to the ScanResult screen. 
 */
export default function CaloriesPage() {
  const [permission, requestPermission] = useCameraPermissions();

  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);

// Manual entry fields
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [calories, setCalories] = useState("");
  const [carbs, setCarbs] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");

  const insets = useSafeAreaInsets();
  const router = useRouter();

  /**
   * Request camera permissions if not already available.
   */
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  /**
   * Handles a successful barcode scan.
   *
   * Flow:
   * 1) Stop scanning and show loading indicator.
   * 2) Fetch product info from OpenFoodFacts.
   * 3) If found, build a product object and navigate to ScanResult.
   * 4) Otherwise, show an alert indicating no product found.
   *
   * @param data The decoded barcode value.
   */
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanning(false);
    setLoading(true);

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

  /**
   * Submits manually entered product details to the ScanResult screen.
   * Validates that a food name is provided; other fields are optional.
   */
  const onManualSubmit = () => {
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

    router.push({
      pathname: "/ScanResult",
      params: { product: encodeURIComponent(JSON.stringify(productData)) },
    });
  };

  // Permission states 
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

  // Main UI
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.screen}>
        {/* Header with Panda */}
        <View style={styles.heroWrap}>
          <Text style={formStyles.welcome}>Calories Tracker</Text>
          <Image
            source={require("../assets/panda.png")}
            style={styles.panda}
            resizeMode="contain"
          />
        </View>

        {/* Card Body */}
        <View style={[formStyles.card, { paddingBottom: 20 + insets.bottom }]}>
          {/* Mode toggle */}
          {!manualMode ? (
            <>
              <Text style={styles.sectionTitle}>Scan Your Food</Text>

              {!scanning ? (
                <>
                  <Pressable
                    onPress={() => {
                      setScanning(true);
                      setScanned(false);
                    }}
                    style={formStyles.button}
                  >
                    <Text style={formStyles.buttonText}>Start Scanner</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setManualMode(true)}
                    style={{ marginTop: 12 }}
                  >
                    <Text style={styles.switchText}>
                      Prefer manual entry? Tap here
                    </Text>
                  </Pressable>
                </>
              ) : (
                <View style={styles.cameraWrap}>
                  <CameraView
                    facing="back"
                    style={{ flex: 1 }}
                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                    barcodeScannerSettings={{
                      barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
                    }}
                  />
                  <Pressable
                    onPress={() => setScanning(false)}
                    style={[formStyles.button, { marginTop: 10 }]}
                  >
                    <Text style={formStyles.buttonText}>Cancel</Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Enter Food Manually</Text>

              <TextInput
                placeholder="Food name"
                placeholderTextColor={colors.textMuted}
                style={formStyles.input}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                placeholder="Brand (optional)"
                placeholderTextColor={colors.textMuted}
                style={formStyles.input}
                value={brand}
                onChangeText={setBrand}
              />
              <TextInput
                placeholder="Calories"
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                style={formStyles.input}
                value={calories}
                onChangeText={setCalories}
              />
              <TextInput
                placeholder="Carbs (g)"
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                style={formStyles.input}
                value={carbs}
                onChangeText={setCarbs}
              />
              <TextInput
                placeholder="Protein (g)"
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                style={formStyles.input}
                value={protein}
                onChangeText={setProtein}
              />
              <TextInput
                placeholder="Fat (g)"
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                style={formStyles.input}
                value={fat}
                onChangeText={setFat}
              />

              <Pressable onPress={onManualSubmit} style={formStyles.button}>
                <Text style={formStyles.buttonText}>Save</Text>
              </Pressable>

              <Pressable
                onPress={() => setManualMode(false)}
                style={{ marginTop: 12 }}
              >
                <Text style={styles.switchText}>Back to Scanner</Text>
              </Pressable>
            </>
          )}

          {/* Loading Indicator */}
          {loading && (
            <View style={{ marginTop: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" />
              <Text style={formStyles.mutedText}>Fetching product info...</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * Style definitions for CaloriesPage layout and components. 
 */
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
    alignSelf: "center",
    marginBottom: -40,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  cameraWrap: {
    width: "100%",
    height: 380,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  switchText: {
    color: colors.primaryDark,
    fontWeight: "600",
    textAlign: "center",
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
