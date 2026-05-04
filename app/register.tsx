// @ts-nocheck

import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import colors from "../constants/colors";
import formStyles from "../constants/formStyles";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();

  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  const router = useRouter();

  const isEmail = (s) => /.+@.+\..+/.test(String(s).toLowerCase());

  let hasUppercase = false;
  let hasNumber = false;
  let hasSpecial = false;

  const specials = `!@#$%^&*()_+-=[]{};':"\\|,.<>/?`;

  for (let char of password) {
    if (char >= "A" && char <= "Z") hasUppercase = true;
    if (!isNaN(char)) hasNumber = true;
    if (specials.includes(char)) hasSpecial = true;
  }

  const formValid =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirm.length > 0;

  const REGISTER_URL = "http://:8080/api/createlogin";

  const onSignUp = async () => {
    if (!formValid) return;
    setSubmitting(true);
    setServerMessage("");

    if (!isEmail(email.trim())) {
      setServerMessage("Invalid email address.");
      setSubmitting(false);
      return;
    }

    let pwErrors = [];

    if (password.length < 6) pwErrors.push("• at least 6 characters");
    if (!hasUppercase) pwErrors.push("• at least one uppercase letter");
    if (!hasNumber) pwErrors.push("• at least one number");
    if (!hasSpecial) pwErrors.push("• at least one special character");

    if (pwErrors.length > 0) {
      setServerMessage("Password must include:\n" + pwErrors.join("\n"));
      setSubmitting(false);
      return;
    }

    if (password !== confirm) {
      setServerMessage("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          id: email.trim().toLowerCase(),
          password,
        }),
      });

      const errorText = await response.text();
      const msg = errorText.toLowerCase();

      if (!response.ok) {
        if (msg.includes("username")) {
          setServerMessage("Username is already taken.");
          setSubmitting(false);
          return;
        }

        if (msg.includes("id") || msg.includes("email")) {
          setServerMessage("Email is already registered. Please sign in.");
          setSubmitting(false);
          return;
        }

        setServerMessage(errorText || "Registration failed.");
        setSubmitting(false);
        return;
      }

      setServerMessage("User registered successfully!");
      router.replace({
        pathname: "/user_info",
        params: {
          id: email.trim().toLowerCase(),
          username: username.trim(),
        },
      });
    } catch (err) {
      setServerMessage(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      console.error("Register error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.screen}>
          <View style={styles.heroWrap}>
            <View style={styles.heroBlobLeft} />
            <View style={styles.heroBlobRight} />

            <Image
              source={require("../assets/panda-welcome.png")}
              style={styles.panda}
              resizeMode="contain"
            />

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Welcome!</Text>
            </View>

            <Text style={styles.heroTitle}>Create Account</Text>
            <Text style={styles.heroSubtitle}>
              Start tracking workouts, challenges, and group goals.
            </Text>
          </View>

          <View
            style={[
              formStyles.card,
              styles.card,
              { paddingBottom: 24 + insets.bottom },
            ]}
          >
            <Text style={styles.cardTitle}>Sign Up</Text>
            <Text style={styles.cardSubtitle}>
              Create your login to continue.
            </Text>

            <View style={[formStyles.inputWrap, styles.inputWrapCustom]}>
              <Ionicons
                name="person-outline"
                size={18}
                color="#42564F"
                style={styles.inputIcon}
              />
              <TextInput
                style={formStyles.input}
                placeholder="Username"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
                value={username}
                onChangeText={setUserName}
                returnKeyType="next"
              />
            </View>

            <View
              style={[formStyles.inputWrap, styles.inputWrapCustom, styles.mt12]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color="#42564F"
                style={styles.inputIcon}
              />
              <TextInput
                style={formStyles.input}
                placeholder="Email address"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                textContentType="emailAddress"
              />
            </View>

            <View
              style={[formStyles.inputWrap, styles.inputWrapCustom, styles.mt12]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#42564F"
                style={styles.inputIcon}
              />
              <TextInput
                style={formStyles.input}
                placeholder="Password"
                placeholderTextColor="#6B7280"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="next"
                textContentType="password"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#42564F"
                />
              </Pressable>
            </View>

            <View
              style={[formStyles.inputWrap, styles.inputWrapCustom, styles.mt12]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#42564F"
                style={styles.inputIcon}
              />
              <TextInput
                style={formStyles.input}
                placeholder="Confirm password"
                placeholderTextColor="#6B7280"
                secureTextEntry={!showConfirm}
                value={confirm}
                onChangeText={setConfirm}
                returnKeyType="done"
                textContentType="password"
              />
              <Pressable
                onPress={() => setShowConfirm((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                <Ionicons
                  name={showConfirm ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#42564F"
                />
              </Pressable>
            </View>

            {serverMessage ? (
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>{serverMessage}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={onSignUp}
              disabled={!formValid || isSubmitting}
              style={({ pressed }) => [
                formStyles.button,
                styles.submitButton,
                (!formValid || isSubmitting) && formStyles.buttonDisabled,
                pressed && { transform: [{ scale: 0.995 }] },
              ]}
            >
              <Text style={formStyles.buttonText}>
                {isSubmitting ? "Creating account..." : "Create account"}
              </Text>
            </Pressable>

            <Link href="/login" asChild>
              <Pressable>
                <View style={formStyles.rowCenter}>
                  <Text style={formStyles.mutedText}>
                    Already have an account?{" "}
                  </Text>
                  <Text style={styles.loginLink}>Login</Text>
                </View>
              </Pressable>
            </Link>
          </View>
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
    justifyContent: "flex-change",
    height: 230,
    paddingTop: 6,
    paddingHorizontal: 24,
    position: "relative",
    overflow: "hidden",
  },

  panda: {
    position: "absolute",
    right: 115,
    bottom: -35,
    width: 150,
    height: 150,
    opacity: 0.95,
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
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#2F4F3E",
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4B6354",
    textAlign: "center",
    maxWidth: 290,
  },

  card: {
    backgroundColor: "#F7F6E7",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 26,
  },

  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2F4F3E",
    marginBottom: -5,
  },

  cardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 1,
  },

  inputWrapCustom: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8D9",
    borderRadius: 16,
  },

  mt12: {
    marginTop: 1,
  },

  inputIcon: {
    position: "absolute",
    left: 14,
    top: 16,
    opacity: 0.9,
  },

  eyeBtn: {
    position: "absolute",
    right: 14,
    top: 14,
  },

  messageBox: {
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: "#F1F5EC",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E0E7D6",
  },

  messageText: {
    color: "#42564F",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },

  submitButton: {
    backgroundColor: "#42564F",
    borderRadius: 16,
    marginTop: 16,
  },

  loginLink: {
    color: "#42564F",
    fontWeight: "800",
  },
});