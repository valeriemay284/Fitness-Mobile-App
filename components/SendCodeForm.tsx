import React, { useState } from "react";
import { View, TextInput, Pressable, Text, Alert, ActivityIndicator } from "react-native";
import colors from "../constants/colors";
import formStyles from "../constants/formStyles";

// Props for SendCodeForm
interface SendCodeFormProps {
  id: string;                        // User ID/email from parent
  setId: (val: string) => void;      // Function to update ID in parent
  onCodeSent: () => void;            // Callback to notify parent that code was sent
  setLoading: (loading: boolean) => void; // Loading control for button
}

// Component to send verification code to backend
export default function SendCodeForm({ id, setId, onCodeSent, setLoading }: SendCodeFormProps) {
  const BACKEND_URL = "http://192.168.1.213:8080/api"; // Update to your backend IP
  const [localLoading, setLocalLoading] = useState(false);

  // Send recovery code to backend
  const sendCode = async () => {
    if (!id) {
      Alert.alert("Error", "Please enter your Email address.");
      return;
    }

    setLocalLoading(true);
    setLoading(true); // Show spinner in parent as well
    try {
      const response = await fetch(`${BACKEND_URL}/sendCode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }), // backend expects { id }
      });

      if (response.ok) {
        const returnedCode = await response.json(); // For testing, backend returns code
        console.log("Verification code:", returnedCode);
        Alert.alert("Code Sent", "Check your email for the verification code.");
        onCodeSent(); // Notify parent to show ResetPasswordForm
      } else if (response.status === 404) {
        Alert.alert("Error", "User not found.");
      } else {
        Alert.alert("Error", "Failed to send code. Try again.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Network error. Check your connection.");
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Input for user email / ID */}
      <TextInput
     style={formStyles.input}
     placeholder="Please enter your Email address."
     placeholderTextColor={colors.textMuted}
     value={id}
     onChangeText={(text) => setId(text.toLowerCase())}
     autoCapitalize="none" // prevents automatic capitalization
     keyboardType="email-address" // gives email-friendly keyboard
/>


      {/* Send code button with loading indicator */}
      <Pressable style={formStyles.button} onPress={sendCode} disabled={localLoading}>
        {localLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={formStyles.buttonText}>Send Code</Text>
        )}
      </Pressable>
    </View>
  );
}
