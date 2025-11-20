/**
 * ScanResultScreen
 *
 * Displays nutrition details for a product passed from the CaloriesPage.
 * Allows the user to save the item locally (AsyncStorage) as part of a
 * personal food library, and provides navigation back to the scanner.
 *
 * Flow:
 * - Receives a serialized `product` payload via route params.
 * - Parses and renders product name, brand, and macro nutrients.
 * - Offers "Add to Library" to persist the item on-device.
 * - Includes a "Back to Scan" action to return to the previous screen.
 */

import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Image, Alert,} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../constants/colors";
import formStyles from "../constants/formStyles";

export default function ScanResultScreen() {
  const { product } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  /**
   * Decodes and parses product data from the route parameter.
   * Returns `null` if parsing fails or no payload is provided.
   */
  const productData = useMemo(() => {
    try {
      const productStr = Array.isArray(product) ? product[0] : product;
      return productStr ? JSON.parse(decodeURIComponent(productStr)) : null;
    } catch {
      return null;
    }
  }, [product]);
  /*        
    A simple key-value storage system (like a dictionary or map) 
    that saves data permanently on the phone — even after the app is closed or restarted.
  */
  // Save the current product to AsyncStorage (user's library)
  const onAddToLibrary = async () => {
    if (!productData) return;

    try {
      setSaving(true);
      const existing = await AsyncStorage.getItem("library");
      const library = existing ? JSON.parse(existing) : [];

      // Add new product to the saved list
      library.push(productData);

      await AsyncStorage.setItem("library", JSON.stringify(library));
      Alert.alert("Added!", "Item saved to your library.");
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert("Error", "Could not save item.");
    } finally {
      setSaving(false);
    }
  };

  // If no product data exists, show a fallback message
  if (!productData) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <Text style={styles.title}>No product data</Text>
          <Text style={formStyles.mutedText}>
            Scan a barcode to see details
          </Text>
          <Pressable onPress={() => router.back()} style={formStyles.button}>
            <Text style={formStyles.buttonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Main content screen showing product details
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.screen,
          { paddingBottom: 20 + insets.bottom },
        ]}
      >
        {/* Header with panda image */}
        <View style={styles.heroWrap}>
          <Text style={formStyles.welcome}>Scan Result</Text>
          <Image
            source={require("../assets/panda.png")}
            style={styles.panda}
            resizeMode="contain"
          />
        </View>

        {/* Product details card */}
        <View style={formStyles.card}>
          <Text style={styles.brandText}>
            {productData.brand || "Unknown Brand"}
          </Text>
          <Text style={styles.nameText}>
            {productData.name || "Unnamed Item"}
          </Text>

          {/* Nutrition info section */}
          <View style={styles.nutritionBox}>
            <Text style={styles.sectionHeader}>Nutrition (per serving)</Text>
            <Text style={styles.row}>
              Calories: {safeNum(productData?.calories)}
            </Text>
            <Text style={styles.row}>
              Carbs: {safeNum(productData?.carbs)}
            </Text>
            <Text style={styles.row}>
              Protein: {safeNum(productData?.protein)}
            </Text>
            <Text style={styles.row}>
              Fat: {safeNum(productData?.fat)}
            </Text>
          </View>

          {/* Add to library button */}
          <Pressable
            onPress={onAddToLibrary}
            disabled={saving}
            style={({ pressed }) => [
              formStyles.button,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={formStyles.buttonText}>
              {saving ? "Saving..." : "Add to Library"}
            </Text>
          </Pressable>

          {/* Go back button */}
          <Pressable onPress={() => router.back()} style={{ marginTop: 8 }}>
            <Text style={styles.backText}>Back to Scan</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Safely renders a numeric value or a placeholder when not available.
 * Returns "-" for non-numeric inputs.
 */
function safeNum(v: any) {
  return typeof v === "number" ? v : "-";
}

/**
 * Style definitions for ScanResultScreen layout and components.
 */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primaryDark,
  },
  screen: {
    flexGrow: 1,
    backgroundColor: colors.primaryDark,
  },
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
  brandText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "600",
    textAlign: "center",
  },
  nameText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginVertical: 4,
  },
  nutritionBox: {
    marginVertical: 16,
    backgroundColor: colors.cardBgLight,
    padding: 12,
    borderRadius: 10,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  row: {
    fontSize: 15,
    marginVertical: 2,
  },
  backText: {
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
