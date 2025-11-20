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

  /** 
   * Simple email format check
   * 
   * @param s Text to test as an email address.
   * @return True if the string resembles an email address
   */

  const isEmail = (s) => /.+@.+\..+/.test(String(s).toLowerCase());

  // Validation flags
  const emailOk = isEmail(email.trim());
  const passOk = password.length >= 6;
  const matchOk = password === confirm && confirm.length > 0;
  const formValid = emailOk && passOk && matchOk;

  const REGISTER_URL = 'http://10.41.211.252:8080/api/createlogin';

  /**
   * Attempts to register a new account with the provided credentials. 
   * 
   * Flow: 
   * 1) Validate form fields (email, password length, confirmation).
   * 2) POST credentials to the backend.
   * 3) If successful, navigate to the User Info screen, taking email and username with. 
   * 4) Otherwise, display server error message
   */
  const onSignUp = async () => {
    if (!formValid) return;
    setSubmitting(true);
    setServerMessage(""); 

    try {
      const response = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          id: email.trim().toLowerCase(), 
          password,
         }),
      });

      // parse JSON safely
      let data = {};
      try { data = await response.json(); } catch{}

      if (!response.ok) {
        setServerMessage(data && data.message || 'Registration failed');
        return
      } else {
        // Registration succeeded: proceed to profile completion
        setServerMessage('User registered successfully!');
        router.replace({
          pathname: "/user_info",
          params: {
            id: String(data.id ?? email.trim().toLowerCase()), 
            username: String(data.username ?? username.trim())
          }
        });
      }
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
          {serverMessage ? <Text style={{ color: 'red', marginTop: 8 }}>{serverMessage}</Text> : null}
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
            <Pressable accessibilityRole="button" onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} hitSlop={8}>
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
              returnKeyType="next"
              textContentType="password"
            />
            <Pressable accessibilityRole="button" onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn} hitSlop={8}>
              <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={20} />
            </Pressable>
          </View>

          {/* Create Account Button */}
          <Pressable
            onPress={onSignUp}
            disabled={!formValid}
            style={({ pressed }) => [formStyles.button, !formValid && formStyles.buttonDisabled, pressed && { transform: [{ scale: 0.995 }] }]}>
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
