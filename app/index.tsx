import * as Haptics from "expo-haptics";
import { Link, router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  // Create an animation reference for the panda's lifting motion
  const liftAnim = useRef(new Animated.Value(0)).current;

  // Create an animation reference for fading in text
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Array of panda-inspired motivational phrases
  const pandaPhrases = [
    "Train smart. Rest well. Panda strong.",
    "Stay calm. Stay focused. Stay panda-powered.",
    "Small moves. Big growth.",
  ];

  // Keep track of the currently displayed phrase
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    // Loop the panda up-and-down movement animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(liftAnim, {
          toValue: -15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(liftAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in the text when the screen loads
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Change motivational phrase every 3 seconds
    const interval = setInterval(() => {
      setPhraseIndex((prevIndex) => (prevIndex + 1) % pandaPhrases.length);
    }, 5000);

    // Clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  // Trigger haptic feedback when pressing a button
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated panda lifting effect */}
      <Animated.Image
        source={require("../assets/panda.png")} // Image path
        style={[styles.panda, { transform: [{ translateY: liftAnim }] }]}
        resizeMode="contain"
      />

      {/* App title */}
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        PandaFit
      </Animated.Text>

      {/* Rotating motivational text */}
      <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
        {pandaPhrases[phraseIndex]}
      </Animated.Text>

      {/* Navigation buttons */}
      <View style={styles.buttons}>
        <Link href="/register" style={styles.btn} onPress={handlePress}>
          Get Started
        </Link>

        <Link
          href="/login"
          style={[styles.btn, styles.secondary]}
          onPress={handlePress}
        >
          Already Registered?
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main layout container
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F6E7",
  },
  // Panda image size and position
  panda: {
    width: 200,
    height: 200,
  },
  // Main title styling
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#42564F",
    marginTop: 20,
  },
  // Subtitle for motivational phrases
  subtitle: {
    color: "#6B7280",
    fontSize: 16,
    marginBottom: 40,
    marginTop: 10,
  },
  // Button container
  buttons: {
    width: "80%",
    alignItems: "center",
  },
  // Primary button style
  btn: {
    backgroundColor: "#C0EB6A",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginVertical: 10,
    fontWeight: "600",
    color: "#42564F",
    textAlign: "center",
    width: "100%",
  },
  // Secondary button with lighter background
  secondary: {
    backgroundColor: "#DfDDC5",
  },
});
