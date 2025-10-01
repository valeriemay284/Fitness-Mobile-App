import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../constants/colors';
import formStyles from '../constants/formStyles';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const isValid = email.trim().length > 0 && password.length >= 6;

  const LOGIN_URL = 'http://:8080/api/login';

  const onLogin = async() => {
    try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log("Backend response:", data);

    if(!response.ok) {   
      console.error("Login failed");
    } else {
      console.log("Login successful");
    }
  }catch (err) {
    console.error("Login error:", err);
  }
};

  const onForgot = () => console.log('Forgot Password');
  
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
                  textContentType="username"
                />
              </View>

              {/* password */}
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

              {/* forgot password */}
              <Pressable onPress={onForgot} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </Pressable>

              {/* login button */}
              <Pressable onPress={onLogin} 
              disabled={!isValid} 
              style={({ pressed }) => [formStyles.button, !isValid && formStyles.buttonDisabled, pressed && { transform: [{ scale: 0.995 }] } ]}> 
                <Text style={formStyles.buttonText}>Login</Text> 
              </Pressable>

              {/* sign up link */}
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