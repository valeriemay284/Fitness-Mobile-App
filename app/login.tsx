import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const isValid = email.trim().length > 0 && password.length >= 6;

  const onLogin = async() => {
    try {
    const response = await fetch("http://:8080/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log("Backend response:", data);
  } catch (err) {
    console.error("Login error:", err);
  }
};

  const onForgot = () => {
    console.log('Forgot Password');
  };
  
  const onSignUp = () => {
    console.log('Go to Sign Up');
  };


  

  return (
    <SafeAreaView style={styles.safe}>      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Container paints the background behind the rounded card */}
        <View style={styles.topBgContainer}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} keyboardShouldPersistTaps="handled">

            

            {/* Brand header with panda mascot */}
            <View style={styles.heroWrap}>
              <Text style={styles.welcome}>Welcome Back!</Text>

              <Image
                source={require('../assets/panda.png')}
                style={styles.panda}
                resizeMode="contain"
              />
            </View>

            {/* Bottom sheet-style card with rounded TOP corners */}
            <View style={styles.card}>
              {/* Email */}
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                  textContentType="username"
                />
              </View>

              {/* Password */}
              <View style={[styles.inputWrap, { marginTop: 14 }]}>
                <Ionicons name="lock-closed-outline" size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                  textContentType="password"
                />
                <Pressable accessibilityRole="button" onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} />
                </Pressable>
              </View>

              {/* Forgot password */}
              <Pressable onPress={onForgot} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </Pressable>

              {/* Login button */}
              <Pressable onPress={onLogin} style={({ pressed }) => [styles.loginBtn, styles.loginBtnDisabled, pressed && { transform: [{ scale: 0.995 }] } ]}>
                <Text style={styles.loginText}>Login</Text>
              </Pressable>

              {/* Sign up link */}
              <View style={styles.signupRow}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <Pressable onPress={onSignUp}>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </Pressable>
              </View>
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const colors = {
  primaryDark: '#42564F',
  primary: '#C0EB6A',
  background: '#F7F6E7',
  cardBg: '#DFDDC5',
  accent: '#C0EB6A',
  textMuted: '#6B7280',
};

const styles = StyleSheet.create({
  // Paint the whole screen green first so rounded corners sit on green
  safe: { flex: 1, backgroundColor: colors.primaryDark },
  topBgContainer: { flex: 1, backgroundColor: colors.primaryDark },

  welcome: {
    fontFamily: 'Poppins',
    fontSize: 30,
    fontWeight: '600',
    color: '#FFFFFF', 
    marginBottom: -10,
    textAlign: 'center',
  },

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
    marginBottom: -40, // overlaps the next section slightly
  },

  // Bottom sheet card fills the rest; rounded TOP corners
  card: {
    flexGrow: 2,
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 55,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  inputWrap: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E3E6EB',
    backgroundColor: '#FDFDFE',
    borderRadius: 14,
    paddingHorizontal: 44,
    height: 52,
    justifyContent: 'center',
  },
  inputIcon: { position: 'absolute', left: 14, top: 16, opacity: 0.8 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  input: { fontSize: 16, color: '#111827' },

  forgot: { color: colors.primaryDark, fontWeight: '600' },

  loginBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginText: { fontSize: 16, fontWeight: '700', color: colors.primaryDark },

  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  signupText: { color: colors.textMuted },
  signupLink: { color: colors.primaryDark, fontWeight: '700' },
});