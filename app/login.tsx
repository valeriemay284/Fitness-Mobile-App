// @ts-nocheck
/**
 * LoginScreen
 * 
 * Screen for user authentication. Allows users to log in with a username
 * and password, displays messages for success or failure, and routes to
 * the Dashboard screen on successful login.
 * 
 * Includes a "Forgot Password" link and a toggle to show or hide the password. 
 */

import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../components/AuthContext';

import colors from '../constants/colors';
import formStyles from '../constants/formStyles';

/**
 * LoginScreen component: handles user sign-in and navigation after authentication
 * 
 * Features: 
 * - Username and password input fields
 * - Password visibility toggle
 * - "Forgot Password" redirection
 * - Server validation and response handling
 * - Persistent login using AuthContext
 * - Navigation to Dashboard upon success
 */

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { setUser } = useAuth() as any; 

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI feedback
  const [serverMessage, setServerMessage] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  // Form validation rule: username not empty, password >= 6 characters
  const isValid = username.trim().length > 0 && password.length >= 6;

  const LOGIN_URL = 'http://10.41.211.252:8080/api/login';

  const onLogin = async() => {
    if (!isValid || isSubmitting) return; 
    setSubmitting(true)

    try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password: password }),
    });

    let data = {};
    try { data = await response.json(); } catch {}

    if(!response.ok) {   
      setServerMessage((data && data.message) || "Login failed. Please check your credentials.");
      return; 
    }

    setServerMessage("Login successful!");

    const user = {
      id: String(data.id ?? ""), 
      name: String(data.name ?? ""),
      username: String(data.username ?? username.trim()), 
      height: data.height != null ? Number(data.height) : null,
      weight: data.weight != null ? Number(data.weight) : null,
      sex: String(data.sex ?? ''),
    };

    await setUser(user); 
    router.replace('/Dashboard'); 
  } catch (err) {
    console.error("Login error:", err); 
    setServerMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
  } finally {
    setSubmitting(false); 
  }
};

/**
 * Navigates to the "Forgot Password" screen.
 */

const onForgot = () => router.push("ForgotPasswordScreen"as any);

return (
    <SafeAreaView style={styles.safe} edges={['top']}>      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Container paints the background behind the rounded card */}
        <View style={styles.screen}>

            {/* header with panda mascot */}
            <View style={styles.heroWrap}>
              <Text style={formStyles.welcome}>Welcome Back!</Text>
              <Image
                source={require('../assets/panda.png')}
                style={styles.panda}
                resizeMode="contain"
              />
            </View>

            {/* Bottom sheet-style card with rounded TOP corners */}
            <View style={[formStyles.card, { paddingBottom: 20 + insets.bottom }]}>

              {/* Username */}
              <View style={formStyles.inputWrap}>
                <Ionicons name="mail-outline" size={18} style={styles.inputIcon} />
                <TextInput
                  style={formStyles.input}
                  placeholder="Username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoComplete="username"
                  value={username}
                  onChangeText={setUsername}
                  returnKeyType="next"
                  textContentType="username"
                />
              </View>

              {/* Password */}
              <View style={[formStyles.inputWrap, { marginTop: 14 }]}>
                <Ionicons name="lock-closed-outline" size={18} style={styles.inputIcon} />
                <TextInput
                style={formStyles.input}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                textContentType="password"
                />
                <Pressable accessibilityRole="button" onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} />
                </Pressable>
              </View>

              {/* Forgot password */}
              <Pressable onPress={onForgot} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </Pressable>

              {/* Login button */}
              <Pressable onPress={onLogin} 
              disabled={!isValid} 
              style={({ pressed }) => [formStyles.button, !isValid && formStyles.buttonDisabled, pressed && { transform: [{ scale: 0.995 }] } ]}> 
                <Text style={formStyles.buttonText}>Login</Text> 
              </Pressable>

              {/* Sign up link */}
              <Link href="/register" asChild>
              <Pressable>
                <View style={formStyles.rowCenter}>
                  <Text style={formStyles.mutedText}>Don't have an account? </Text>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </View>
              </Pressable>
              </Link>
              
              </View>
        <View
        pointerEvents="none" 
        style={{ 
          position: 'absolute', 
          left: 0, 
          right: 0, 
          bottom: 0, 
          height: insets.bottom, 
          backgroundColor: colors.cardBg, }} 
          />
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Style defintions for LoginScreen layout and components
 */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryDark },
  screen: { flex: 1, backgroundColor: colors.primaryDark },

  heroWrap: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 220,
  },
  panda: {
    width: 170,
    height: 170,
    alignSelf: 'center',
    marginBottom: -40, 
  },

  inputIcon: { position: 'absolute', left: 14, top: 16, opacity: 0.8 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },

  forgot: { color: colors.primaryDark, fontWeight: '600' },
  signupLink: { color: colors.primaryDark, fontWeight: '700' },
});