import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { api } from '../config';
import colors from "../constants/colors";
import formStyles from "../constants/formStyles";

// Props for the ResetPasswordForm
interface ResetPasswordFormProps {
  id: string;                  // User ID/email
  setLoading: (loading: boolean) => void; // Top-level loading control
}

// Component to reset password using backend
export default function ResetPasswordForm({ id, setLoading }: ResetPasswordFormProps) {
  const [code, setCode] = useState("");            // Verification code (optional for backend)
  const [newPassword, setNewPassword] = useState(""); // New password input
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const BACKEND_URL = api('/api');

  // Function to send new password to backend
  const resetPassword = async () => {
    if (!newPassword) {
      Alert.alert("Error", "Please enter your new password.");
      return;
    }

    setLoading(true); // Show loading spinner
    try {
      // Backend expects { id, hash } — code is not required for current backend
      const response = await fetch(`${BACKEND_URL}/changePassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, hash: newPassword }), // send password as 'hash'
      });

      if (response.ok) {
        Alert.alert("Success", "Password reset successful!", [
          { text: "OK", onPress: () => router.push("/login") }, // Go back to login screen
        ]);
      } else {
        const text = await response.text();
        Alert.alert("Error", text || "Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Network error. Try again.");
    } finally {
      setLoading(false); // Hide spinner
    }
  };

  return (
    <View>
      {/* Verification code input (optional backend currently ignores this) */}
      <TextInput
        style={formStyles.input}
        placeholder="Enter Verification Code"
        placeholderTextColor={colors.textMuted}
        value={code}
        onChangeText={setCode}
      />

      {/* New password input with show/hide toggle */}
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
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color={colors.textMuted}
          />
        </Pressable>
      </View>

      {/* Reset password button */}
      <Pressable style={formStyles.button} onPress={resetPassword}>
        <Text style={formStyles.button}>Reset Password</Text>
      </Pressable>
    </View>
  );
}
