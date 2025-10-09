import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../constants/colors";
import formStyles from "../constants/formStyles";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
  // State variables
  const [id, setId] = useState("");                 // User email or ID
  const [codeSent, setCodeSent] = useState(false);  // Tracks if code has been sent
  const [code, setCode] = useState("");             // Verification code input
  const [newPassword, setNewPassword] = useState(""); // New password input
  const [showPassword, setShowPassword] = useState(false); // Toggle for password visibility
  const [loading, setLoading] = useState(false);   // Loading indicator for buttons

  // Backend URL (update for your network)
  const BACKEND_URL = "http://10.41.212.138:8080/api";

  // Send recovery code to backend
  const sendCode = async () => {
    if (!id) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    setLoading(true); // Show loading spinner
    try {
      const response = await fetch(`${BACKEND_URL}/sendCode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }), // Backend expects {id}
      });

      if (response.ok) {
        const returnedCode = await response.json(); // For testing, backend sends code
        console.log("Verification code:", returnedCode); // Log code
        setCodeSent(true); // Show code/password input form
        Alert.alert("Code Sent", "Check your email for the verification code.");
      } else if (response.status === 404) {
        Alert.alert("Error", "User not found.");
      } else {
        Alert.alert("Error", "Unable to send code. Try again.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Reset password using code
  const resetPassword = async () => {
    if (!code || !newPassword) {
      Alert.alert("Error", "Enter both code and new password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/changePassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, code, newPassword }), // Backend expects {id, code, newPassword}
      });

      if (response.ok) {
        Alert.alert("Success", "Password reset successful!", [
          { text: "OK", onPress: () => router.push("/login") },
        ]);
      } else {
        const text = await response.text();
        Alert.alert("Error", text || "Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {!codeSent ? (
          // Step 1: Enter email/ID and send code
          <>
            <Pressable onPress={() => router.back()} style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.primaryDark, fontWeight: "600" }}>← Back to Login</Text>
            </Pressable>

            <Text style={styles.title}>Forgot Password</Text>

            <TextInput
              style={formStyles.input}
              placeholder="Enter Email or ID"
              placeholderTextColor={colors.textMuted}
              value={id}
              onChangeText={setId}
            />

            <Pressable style={formStyles.button} onPress={sendCode} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={formStyles.buttonText}>Send Code</Text>}
            </Pressable>
          </>
        ) : (
          // Step 2: Enter code and new password
          <>
            <Text style={styles.title}>Reset Password</Text>

            <TextInput
              style={formStyles.input}
              placeholder="Enter Verification Code"
              placeholderTextColor={colors.textMuted}
              value={code}
              onChangeText={setCode}
            />

            <View style={{ position: "relative" }}>
              <TextInput
                style={formStyles.input}
                placeholder="Enter New Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 10, top: 12 }}
              >
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <Pressable style={formStyles.button} onPress={resetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={formStyles.buttonText}>Reset Password</Text>}
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// -----------------------------
// Styles
// -----------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primaryDark,
    marginBottom: 20,
    textAlign: "center",
  },
});
