// @ts-nocheck

/**
 * RegisterScreen
 * 
 * Screen for creating a new account. Collects username, email, password,
 * and confirm password. Validates inputs, calls the backend to create the
 * login record, and on success forwards the user to the User Info Screen
 * to complete their profile.
 */

import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '../constants/colors';
import formStyles from '../constants/formStyles';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();

  // Form fields
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const router = useRouter();

  /** Simple email checker */
  const isEmail = (s) => /.+@.+\..+/.test(String(s).toLowerCase());

  /**
   * Password-strength validation flags
   */
  let hasUppercase = false;
  let hasNumber = false;
  let hasSpecial = false;

  const specials = `!@#$%^&*()_+-=[]{};':"\\|,.<>/?`;

  for (let char of password) {
    if (char >= 'A' && char <= 'Z') hasUppercase = true;
    if (!isNaN(char)) hasNumber = true;
    if (specials.includes(char)) hasSpecial = true;
  }

  /**
   * Button enabled as long as user filled all fields
   */
  const formValid =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirm.length > 0;

  const REGISTER_URL = 'http://10.41.81.30:8080/api/createlogin';

  /**
   * Attempts to register a new account with the provided credentials. 
   */
  const onSignUp = async () => {
    if (!formValid) return;
    setSubmitting(true);
    setServerMessage("");

    // ---- Email check ----
    if (!isEmail(email.trim())) {
      setServerMessage("Invalid email address.");
      setSubmitting(false);
      return;
    }

    // ---- Combined password-error builder ----
    let pwErrors = [];

    if (password.length < 6)
      pwErrors.push("• at least 6 characters");
    if (!hasUppercase)
      pwErrors.push("• at least one uppercase letter");
    if (!hasNumber)
      pwErrors.push("• at least one number");
    if (!hasSpecial)
      pwErrors.push("• at least one special character");

    if (pwErrors.length > 0) {
      setServerMessage("Password must include:\n" + pwErrors.join("\n"));
      setSubmitting(false);
      return;
    }

    // ---- Confirm password ----
    if (password !== confirm) {
      setServerMessage("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    // ---- Backend call ----
    try {
      const response = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          id: email.trim().toLowerCase(),
          password
        }),
      });

      // Backend returns *text*, not JSON
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

      // ---- Success ----
      setServerMessage("User registered successfully!");
      router.replace({
        pathname: "/user_info",
        params: {
          id: email.trim().toLowerCase(),
          username: username.trim()
        }
      });

    } catch (err) {
      setServerMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      console.error("Register error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <View style={styles.screen}>
          <Text style={formStyles.welcome}>Welcome!</Text>
        </View>

        <View style={[formStyles.card, { paddingBottom: 250 + insets.bottom }]}>

          {/* Username */}
          <View style={formStyles.inputWrap}>
            <Ionicons name="person" size={18} style={styles.inputIcon} />
            <TextInput
              style={formStyles.input}
              placeholder="Username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              value={username}
              onChangeText={setUserName}
              returnKeyType="next"
            />
          </View>

          {/* Email */}
          <View style={formStyles.inputWrap}>
            <Ionicons name="mail-outline" size={18} style={styles.inputIcon} />
            <TextInput
              style={formStyles.input}
              placeholder="Email address"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              textContentType="emailAddress"
            />
          </View>

          {/* Password */}
          <View style={formStyles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} style={styles.inputIcon} />
            <TextInput
              style={formStyles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              returnKeyType="next"
              textContentType="password"
            />
            <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} hitSlop={8}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} />
            </Pressable>
          </View>

          {/* Confirm Password */}
          <View style={formStyles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} style={styles.inputIcon} />
            <TextInput
              style={formStyles.input}
              placeholder="Confirm password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={setConfirm}
              returnKeyType="done"
              textContentType="password"
            />
            <Pressable onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn} hitSlop={8}>
              <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={20} />
            </Pressable>
          </View>

          {/* Cute Error Message */}
          {serverMessage ? (
            <Text style={{
              color: 'red',
              textAlign: 'center',
              marginTop: 10,
              marginBottom: -5,
              fontWeight: '600'
            }}>
              {serverMessage}
            </Text>
          ) : null}

          {/* Create Account Button */}
          <Pressable
            onPress={onSignUp}
            disabled={!formValid}
            style={({ pressed }) => [
              formStyles.button,
              !formValid && formStyles.buttonDisabled,
              pressed && { transform: [{ scale: 0.995 }] }
            ]}
          >
            <Text style={formStyles.buttonText}>Create account</Text>
          </Pressable>

          {/* Login Link */}
          <Link href="/login" asChild>
            <Pressable>
              <View style={formStyles.rowCenter}>
                <Text style={formStyles.mutedText}>Already have an account? </Text>
                <Text style={styles.loginLink}>Login</Text>
              </View>
            </Pressable>
          </Link>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Style defintions for the RegisterScreen layout and controls. 
 */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryDark },
  screen: { flex: 1, backgroundColor: colors.primaryDark },
  inputIcon: { position: 'absolute', left: 14, top: 16, opacity: 0.8 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  loginLink: { color: colors.primaryDark, fontWeight: '700' },
});