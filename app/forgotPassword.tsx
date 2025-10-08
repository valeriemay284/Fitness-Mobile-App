import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // Ensures content is within safe screen area (avoids notches)
import colors from "../constants/colors"; // Custom color palette
import formStyles from "../constants/formStyles"; // Shared form styles (input, button, etc.)
import { router } from "expo-router"; // Router for navigation
import { Ionicons } from "@expo/vector-icons"; // Toggle for password

export default function ForgotPasswordScreen() {
  // State variables to manage input and screen behavior
  const [id, setId] = useState(""); // User's email or ID
  const [codeSent, setCodeSent] = useState(false); // Tracks if verification code has been sent
  const [code, setCode] = useState(""); // Stores code input by user
  const [newPassword, setNewPassword] = useState(""); // Stores new password input
  const [showPassword, setShowPassword] = useState(false); // Toggle state for showing/hiding password

  // Function to send verification code to user's email
  const sendCode = async () => {
    try {
      const response = await fetch("http://172.20.10.3:8080/api/sendCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }), // Send user email to backend
      });

      if (response.ok) {
        setCodeSent(true); // Show the reset password form
        Alert.alert("Code Sent", "Please check your email for the verification code.");
      } else {
        Alert.alert("Error", "Email not found or request failed.");
      }
    } catch (err) {
      Alert.alert("Error", "Unable to send code. Check your connection.");
    }
  };

  // Function to reset password using code and new password
  const resetPassword = async () => {
    try {
      const response = await fetch("http://172.20.10.3:8080/api/changePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, code, newPassword }), // Send id, code, and new password to backend
      });

      if (response.ok) {
        Alert.alert("Success", "Password reset successful! You can now log in.", [
          { text: "OK", onPress: () => router.push("/login") } // Navigate to login screen
        ]);
      } else {
        Alert.alert("Error", "Invalid code or request failed.");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {!codeSent ? (
          // Step 1: Send verification code
          <>
            {/* Back Button */}
            <Pressable onPress={() => router.back()} style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.primaryDark, fontWeight: "600" }}>← Back to Login</Text>
            </Pressable>

            {/* Screen Title */}
            <Text style={styles.title}>Forgot Password</Text>

            {/* Input for user email */}
            <TextInput
              style={formStyles.input}
              placeholder="Enter your Email address"
              placeholderTextColor={colors.textMuted}
              value={id}
              onChangeText={setId}
            />

            {/* Button to send code */}
            <Pressable style={formStyles.button} onPress={sendCode}>
              <Text style={formStyles.buttonText}>Send Code</Text>
            </Pressable>
          </>
        ) : (
          // Step 2: Reset password using verification code
          <>
            <Text style={styles.title}>Reset Password</Text>

            {/* Input for verification code */}
            <TextInput
              style={formStyles.input}
              placeholder="Enter Code"
              placeholderTextColor={colors.textMuted}
              value={code}
              onChangeText={setCode}
            />

            {/* Input for new password with show/hide toggle */}
            <View style={{ position: "relative" }}>
              <TextInput
                style={formStyles.input}
                placeholder="Enter New Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword} // Hide password unless showPassword is true
                value={newPassword}
                onChangeText={setNewPassword}
              />

              {/* Eye icon to toggle password visibility */}
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 10, top: 12 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"} // Switch icon depending on state
                  size={24}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>

            {/* Button to reset password */}
            <Pressable style={formStyles.button} onPress={resetPassword}>
              <Text style={formStyles.buttonText}>Reset Password</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// Styles for layout and card design
const styles = StyleSheet.create({
  container: {
    flex: 1, // Full screen
    backgroundColor: colors.primaryDark, // Dark background
    justifyContent: "center", // Center content vertically
    padding: 20,
  },
  card: {
    backgroundColor: colors.cardBg, // Card background
    borderRadius: 20, // Rounded corners
    padding: 20, // Inner padding
    elevation: 4, // Shadow 
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primaryDark,
    marginBottom: 20,
    textAlign: "center", // Centered text
  },
});
