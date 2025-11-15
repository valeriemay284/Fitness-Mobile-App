import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../constants/colors';
import formStyles from '../constants/formStyles';

export default function RegisterScreen() {
    /* email validation: i.e something@something.com */
    const isEmail = (s: string) => /.+@.+\..+/.test(String(s).toLowerCase());

    /* state for each field */ 
    const insets = useSafeAreaInsets();
    const [username, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirm, setConfirm] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const [serverMessage, setServerMessage] = useState('');
    
    /* email & password validation */
    const emailOk = isEmail(email.trim());
    const passOk = password.length >= 6;
    const matchOk = password === confirm && confirm.length > 0;

    /* form is valid if all checks pass */
    const formValid = emailOk && passOk && matchOk;

    /* submit handler + send to backend*/
    const REGISTER_URL = 'http://10.41.222.236:8080/api/createlogin';
    
    const onSignUp = async () => {
        if (!formValid) return;

        try {
            const response = await fetch(REGISTER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), id: email.trim(), password }),
            });

            const text = await response.text();
            console.log("Backend response:", text);
            let data: any = text;
            try { data = JSON.parse(text); } catch {}

            // assume backend may send back a .message field
            if (!response.ok && data?.message) {
                setServerMessage(data.message);
            } else if (response.ok) {
                setServerMessage("User registered successfully");
            }
        } catch (err) {
            console.error("Register error:", err);
        }
    };
    
    const onLogIn = () => console.log('Go to Login'); 

    /* TODO visible error messages */
    
    return(
        <SafeAreaView style={styles.safe} edges={['top']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.screen}>
                    <Text style={formStyles.welcome}>Welcome!</Text>
                </View>

                <View style={[formStyles.card, { paddingBottom: 250 + insets.bottom }]}>
                    {/* username field */}
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

                    {/* email field */}
                    <View style={formStyles.inputWrap}>
                        <Ionicons name="mail-outline" size={18} style={styles.inputIcon} />
                        <TextInput
                        style={formStyles.input}
                        placeholder='Email address'
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize='none'
                        autoComplete='email'
                        keyboardType='email-address'
                        value={email}
                        onChangeText={setEmail}
                        returnKeyType='next'
                        textContentType='username'
                        />
                    </View>

                    {/* create password field */}
                    <View style={formStyles.inputWrap}>
                        <Ionicons name="lock-closed-outline" size={18} style={styles.inputIcon} />
                        <TextInput
                        style={formStyles.input}
                        placeholder='Password'
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        returnKeyType='next'
                        textContentType='password'
                        />
                        <Pressable accessibilityRole="button" onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} hitSlop={8}>
                            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} />
                        </Pressable>
                    </View>

                    {/* confirm password field */}
                    <View style={formStyles.inputWrap}>
                        <Ionicons name="lock-closed-outline" size={18} style={styles.inputIcon} />
                        <TextInput
                        style={formStyles.input}
                        placeholder='Confirm password'
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry={!showConfirm}
                        value={confirm}
                        onChangeText={setConfirm}
                        returnKeyType='next'
                        textContentType='password'
                        />
                        <Pressable accessibilityRole='button' onPress={()=> setShowConfirm(v => !v)} style={styles.eyeBtn} hitSlop={8}>
                            <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={20} />
                        </Pressable>
                    </View>

                    {/* create account button */}
                    <Pressable onPress={onSignUp}
                    disabled={!formValid}
                    style={({ pressed }) => [formStyles.button, !formValid && formStyles.buttonDisabled, pressed && { transform: [{ scale: 0.995}]}]}>
                        <Text style={formStyles.buttonText}>Create account</Text>
                    </Pressable>

                    {/* login link */} 
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

    )
        
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.primaryDark },
    screen: { flex: 1, backgroundColor: colors.primaryDark },
    
    inputIcon: { position: 'absolute', left: 14, top: 16, opacity: 0.8 },
    eyeBtn: { position: 'absolute', right: 14, top: 14 },
    
    loginLink: { color: colors.primaryDark, fontWeight: '700' },

}) 




