/**
 * LibraryScreen
 *
 * Displays the list of food items previously saved to AsyncStorage from
 * the ScanResult screen. Users can remove individual entries or clear the
 * entire library, and can navigate back to the Calories scanner to add more.
 *
 * Flow:
 * - On mount, loads the "library" array from AsyncStorage.
 * - Shows an empty state with a quick link to scan when there are no items.
 * - Renders each saved item with basic nutrition info and a Remove button.
 * - Offers a destructive Clear Library action.
 */

import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert,} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import colors from "../constants/colors";
import formStyles from "../constants/formStyles";


export default function LibraryScreen() {
  const [library, setLibrary] = useState<any[]>([]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Load saved items from AsyncStorage when component mounts
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const data = await AsyncStorage.getItem("library");
        if (data) setLibrary(JSON.parse(data));
      } catch (err) {
        console.error("Error loading library:", err);
      }
    };
    loadLibrary();
  }, []);

  // Clear all items from library
  const clearLibrary = async () => {
    Alert.alert("Clear Library", "Are you sure you want to delete all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, clear",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("library");
          setLibrary([]);
        },
      },
    ]);
  };

  // Remove a single item from library
  const removeItem = async (index: number) => {
    const updated = [...library];
    updated.splice(index, 1);
    await AsyncStorage.setItem("library", JSON.stringify(updated));
    setLibrary(updated);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.screen,
          { paddingBottom: 20 + insets.bottom },
        ]}
      >
        {/* Header */}
        <View style={styles.heroWrap}>
          <Text style={formStyles.welcome}>Your Library</Text>
          <Image
            source={require("../assets/panda.png")}
            style={styles.panda}
            resizeMode="contain"
          />
        </View>

        {/* Library Content */}
        <View style={formStyles.card}>
          {library.length === 0 ? (
            // Empty library message
            <View style={styles.emptyWrap}>
              <Text style={formStyles.mutedText}>
                No saved items yet. Scan something to add it!
              </Text>
              <Pressable
                onPress={() => router.push("/calories")}
                style={formStyles.button}
              >
                <Text style={formStyles.buttonText}>Go Scan</Text>
              </Pressable>
            </View>
          ) : (
            // Display saved items
            <>
              {library.map((item, i) => (
                <View key={i} style={styles.itemCard}>
                  <Text style={styles.itemName}>
                    {item.name || "Unnamed Item"}
                  </Text>
                  <Text style={styles.itemBrand}>
                    {item.brand || "Unknown Brand"}
                  </Text>
                  <Text style={styles.itemNutrition}>
                    Calories: {safeNum(item.calories)} | Protein:{" "}
                    {safeNum(item.protein)}g | Carbs: {safeNum(item.carbs)}g |
                    Fat: {safeNum(item.fat)}g
                  </Text>
                  <Pressable
                    onPress={() => removeItem(i)}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Safely format numbers for display
function safeNum(v: any) {
  return typeof v === "number" ? v : "-";
}

// Styling
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
  itemCard: {
    marginVertical: 10,
    backgroundColor: colors.cardBgLight,
    borderRadius: 10,
    padding: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  itemBrand: {
    color: colors.textMuted,
    marginBottom: 6,
  },
  itemNutrition: {
    fontSize: 14,
    color: colors.text,
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
});
