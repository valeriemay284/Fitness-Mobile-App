import { router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ResetPasswordForm from "../components/ResetPasswordForm";
import SendCodeForm from "../components/SendCodeForm";
import colors from "../constants/colors";

export default function ForgotPasswordScreen() {
  // Stores the user's email/ID input
  const [id, setId] = useState("");

  // Controls which step the user is on (send code → reset password)
  const [codeSent, setCodeSent] = useState(false);

  // Allows the child components to toggle a loading state
  const [loading, setLoading] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>

        {/* Navigation back to login */}
        <Text
          style={{ color: colors.primaryDark, fontWeight: "600", marginBottom: 20 }}
          onPress={() => router.back()}
        >
          ← Back to Login
        </Text>

        {/* Screen heading */}
        <Text style={styles.title}>Forgot Password</Text>

        {/* Step 1: Enter ID + Send Code 
            Step 2: Enter Code + New Password */}
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

        {/* Shows a generic loading message (optional, controlled by child forms) */}
        {loading && (
          <Text style={{ textAlign: "center", marginTop: 10, color: colors.textMuted }}>
            Loading...
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
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
