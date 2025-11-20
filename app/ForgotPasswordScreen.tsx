/**
 * ForgotPasswordScreen
 * 
 * Allows users to reset their password by verifying their account via email.
 * The screen alternates between sending a verification code and entering a new password
 * once the code has been received.
 * 
 * Features: 
 * - Sends a password reset code to the user's registered email
 * - Displays a reset form after the code is sent. 
 * - Provides a back link to the login screen. 
 */


import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import colors from "../constants/colors";
import SendCodeForm from "../components/SendCodeForm";
import ResetPasswordForm from "../components/ResetPasswordForm";
import { router } from "expo-router";


/**
 * ForgotPasswordScreen component
 * 
 * Handles both stages of password recovery: 
 * 1) SendCodeForm - user provides their email to receive a code. 
 * 2) ResetPasswordForm - user enters the receieved code and creates a new password.
 */
export default function ForgotPasswordScreen() {

  // State variables
  const [id, setId] = useState("");           // User email or ID
  const [codeSent, setCodeSent] = useState(false); // Tracks if code was sent
  const [loading, setLoading] = useState(false);   // Global loading indicator

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {/* Back button */}
        <Text
          style={{ color: colors.primaryDark, fontWeight: "600", marginBottom: 20 }}
          onPress={() => router.back()}
        >
          ← Back to Login
        </Text>

        {/* Screen title */}
        <Text style={styles.title}>Forgot Password</Text>

        {/* Conditional rendering: SendCodeForm or ResetPasswordForm */}
        {!codeSent ? (
          <SendCodeForm
            id={id}
            setId={setId}
            onCodeSent={() => setCodeSent(true)}
            setLoading={setLoading}
          />
        ) : (
          <ResetPasswordForm
            id={id}
            setLoading={setLoading}
          />
        )}

        {/* Optional global loading indicator */}
        {loading && (
          <Text style={{ textAlign: "center", marginTop: 10, color: colors.textMuted }}>
            Loading...
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}


/**
 * Style definitions for the ForgotPasswordScreen layout and components.
 */
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
