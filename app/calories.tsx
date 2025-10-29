import React, { useState, useEffect } from "react";
import { View, Text, Button, ActivityIndicator, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

/*
  This screen handles scanning barcodes using the device camera.
  When a barcode is scanned, it fetches nutrition info from the OpenFoodFacts API.
  The result (name, brand, calories, carbs, protein, fat) is encoded and passed to the ScanResultScreen using React Navigation (router.push()).
*/

export default function CaloriesPage() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Request camera permission when the screen loads
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  // Handle when a barcode is scanned
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return; // Prevent multiple scans

    setScanned(true);
    setScanning(false);
    setLoading(true);

    try {
      // Fetch product info from OpenFoodFacts API
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${data}.json`
      );
      const json = await response.json();
      setLoading(false);

      if (json.status === 1) {
        const p = json.product;

        // Store key product info
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

        // Navigate to ScanResult screen with product data
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

  // Handle no permission state
  if (!permission) {
    return <Text>Requesting camera permission...</Text>;
  }

  // Handle denied permission state
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No access to camera</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  // Main screen
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {!scanning ? (
        // Show start scanning button
        <>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Tap to start scanning
          </Text>
          <Button
            title="Start Scanner"
            onPress={() => {
              setScanning(true);
              setScanned(false);
            }}
          />
        </>
      ) : (
        // Show camera scanner
        <View
          style={{
            width: 320,
            height: 400,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <CameraView
            facing="back"
            style={{ flex: 1 }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
            }}
          />
          <Button title="Cancel" onPress={() => setScanning(false)} />
        </View>
      )}

      {/* Loading indicator */}
      {loading && (
        <View style={{ marginTop: 20 }}>
          <ActivityIndicator size="large" />
          <Text>Fetching product info...</Text>
        </View>
      )}
    </View>
  );
}
