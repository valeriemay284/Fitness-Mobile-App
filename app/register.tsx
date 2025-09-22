/*import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterPage() {
    // email validation i.e something@something.com
    const isEmail = (s) => /.+@.+\..+/.test(String(s).toLowerCase());

    // state for each field
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    /* validation 
    const emailOk = isEmail(email.trim());
    const passOk = password.length >= 6;
    const matchOk = password === confirm && confirm.length > 0;

    // form is valid if all checks pass
    const formValid = emailOk && passOk && matchOk;

    const onSignUp = () => {
        console.log('Signup successful', {email, password});
    };

    const onLogIn = () => console.log('Go to Log In'); */

    /*return (
        <SafeAreaView style = {StyleSheet.safe}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={colors.primaryDark}>

                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    )
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
    container: {
        flex: 1,
        backgroundColor: '#42564F',
        justifyContent: 'center',
        alignItems: 'center',
    },

    signupBtn: {
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

signupBtnDisabled: { opacity: 0.5 },
  signupText: { fontSize: 16, fontWeight: '700', color: colors.primaryDark },

  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  loginText: { color: colors.textMuted },
  loginLink: { color: colors.primaryDark, fontWeight: '700' },

}) */




