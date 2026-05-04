// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
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
import { useAuth } from "../components/AuthContext";

import formStyles from "../constants/formStyles";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { setUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  const isValid = username.trim().length > 0 && password.length >= 6;

  const LOGIN_URL = "http://192.168.1.20:8080/api/login";

  const onLogin = async () => {
    if (!isValid || isSubmitting) return;
    setSubmitting(true);
    setServerMessage("");

    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const text = await response.text();
      let data = {};

      try {
        data = JSON.parse(text);
      } catch {
        console.warn("Failed to parse server response as JSON:", text);
        setServerMessage("Login failed: invalid server response");
        return;
      }

      if (!response.ok) {
        setServerMessage(data?.message || "Login failed");
        return;
      }

      if (!data.id || !data.username) {
        console.error("Backend sent incomplete user:", data);
        setServerMessage("Login failed: invalid backend response.");
        return;
      }

      const user = {
        id: String(data.id ?? ""),
        name: String(data.name ?? ""),
        username: String(data.username ?? username.trim()),
        height: data.height != null ? Number(data.height) : null,
        weight: data.weight != null ? Number(data.weight) : null,
        sex: String(data.sex ?? ""),
        goals: String(data.description ?? ""),
        activity_level: String(data.activity_level ?? ""),
        age: data.age != null ? Number(data.age) : null,
        followerCount:
          data.followerCount != null ? Number(data.followerCount) : 0,
        followingCount:
          data.followingCount != null ? Number(data.followingCount) : 0,
      };

      console.log("Setting user:", user);
      await setUser(user);

      router.replace("/(tabs)");
    } catch (err) {
      console.error("Login error:", err);
      setServerMessage(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onForgot = () => router.push("ForgotPasswordScreen" as any);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.screen}>
          <View style={styles.heroWrap}>

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Welcome Back</Text>
            </View>

            <Text style={styles.heroTitle}>Ready to move?</Text>
            <Text style={styles.heroSubtitle}>
              Log in to continue your workouts, challenges, and group progress.
            </Text>

            <Image
              source={require("../assets/panda-run.png")}
              style={styles.panda}
              resizeMode="contain"
            />
          </View>

          <View
            style={[
              formStyles.card,
              styles.card,
              { paddingBottom: 20 + insets.bottom },
            ]}
          >
            <Text style={styles.cardTitle}>Login</Text>
            <Text style={styles.cardSubtitle}>
              Pick up right where you left off.
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
                autoComplete="username"
                value={username}
                onChangeText={setUsername}
                returnKeyType="next"
                textContentType="username"
              />
            </View>

            <View
              style={[
                formStyles.inputWrap,
                styles.inputWrapCustom,
                { marginTop: 1 },
              ]}
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
                returnKeyType="done"
                textContentType="password"
              />
              <Pressable
                accessibilityRole="button"
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

            <Pressable
              onPress={onForgot}
              style={{ alignSelf: "flex-end", marginTop: 8 }}
            >
              <Text style={styles.forgot}>Forgot Password?</Text>
            </Pressable>

            {!!serverMessage && (
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>{serverMessage}</Text>
              </View>
            )}

            <Pressable
              onPress={onLogin}
              disabled={!isValid || isSubmitting}
              style={({ pressed }) => [
                formStyles.button,
                styles.loginButton,
                (!isValid || isSubmitting) && formStyles.buttonDisabled,
                pressed && { transform: [{ scale: 0.995 }] },
              ]}
            >
              <Text style={formStyles.buttonText}>
                {isSubmitting ? "Logging in..." : "Login"}
              </Text>
            </Pressable>

            <Link href="/register" asChild>
              <Pressable>
                <View style={formStyles.rowCenter}>
                  <Text style={formStyles.mutedText}>
                    Don't have an account?{" "}
                  </Text>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </View>
              </Pressable>
            </Link>
          </View>

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
    justifyContent: "flex-start",
    height: 280,
    paddingHorizontal: 24,
    paddingTop: 30, 
    position: "relative",
    overflow: "hidden",
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
    marginBottom: 8,
  },

  panda: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginTop: -15, 
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
    marginBottom: 1,
  },

  cardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 10,
  },

  inputWrapCustom: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8D9",
    borderRadius: 16,
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

  forgot: {
    color: "#42564F",
    fontWeight: "700",
  },

  messageBox: {
    marginTop: 14,
    marginBottom: 2,
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
  },

  loginButton: {
    backgroundColor: "#42564F",
    borderRadius: 16,
    marginTop: 16,
  },

  signupLink: {
    color: "#42564F",
    fontWeight: "800",
  },
});