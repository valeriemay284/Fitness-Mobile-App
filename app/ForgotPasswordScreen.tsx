import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import ResetPasswordForm from "../components/ResetPasswordForm";
import SendCodeForm from "../components/SendCodeForm";
import colors from "../constants/colors";
import formStyles from "../constants/formStyles";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();

  const [id, setId] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.screen}>

          {/* 🔝 HERO SECTION (same as login) */}
          <View style={styles.heroWrap}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Account Help</Text>
            </View>

            <Text style={styles.heroTitle}>Forgot your password?</Text>

            <Text style={styles.heroSubtitle}>
              Enter your username and we’ll send you a code to reset your password.
            </Text>

            <Image
              source={require("../assets/panda-run.png")}
              style={styles.panda}
              resizeMode="contain"
            />
          </View>

          {/* 🔽 CARD SECTION */}
          <View
            style={[
              formStyles.card,
              styles.card,
              { paddingBottom: 20 + insets.bottom },
            ]}
          >
            {/* back button */}
            <Text
              style={styles.back}
              onPress={() => router.back()}
            >
              ← Back to Login
            </Text>

            <Text style={styles.cardTitle}>Reset Password</Text>

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

            {loading && (
              <Text style={styles.loading}>Loading...</Text>
            )}
          </View>

          {/* bottom safe area fill */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: insets.bottom,
              backgroundColor: "#F7F6E7",
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#DDECC8",
  },

  screen: {
    flex: 1,
    backgroundColor: "#DDECC8",
  },

  heroWrap: {
    backgroundColor: "#DDECC8",
    alignItems: "center",
    height: 280,
    paddingHorizontal: 24,
    paddingTop: 30,
  },

  heroBadge: {
    backgroundColor: "rgba(66,86,79,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 14,
  },

  heroBadgeText: {
    color: "#42564F",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2F4F3E",
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 14,
    color: "#4B6354",
    textAlign: "center",
    maxWidth: 290,
    marginBottom: 8,
  },

  panda: {
    width: 140,
    height: 140,
    marginTop: -10,
  },

  card: {
    backgroundColor: "#F7F6E7",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2F4F3E",
    marginBottom: 10,
  },

  back: {
    color: "#42564F",
    fontWeight: "700",
    marginBottom: 12,
  },

  loading: {
    textAlign: "center",
    marginTop: 10,
    color: "#6B7280",
  },
});