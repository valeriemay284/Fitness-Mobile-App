/* import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterPage() {
    // state for each field
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // validation 
    const emailOk = isEmail(email.trim());
    const passOk = password.length >= 6;
    const matchOk = password === confirm && confirm.length > 0;

    // form is valid is all checks pass
    const formValid = emailOk && passOk && matchOk;

    // TODO: user enters password twice. both entries must match

    const onSignUp = () => {
        console.log('Signup successful', {email, password});
    };
    // const onLogIn() => console.log('Go to Log In');

    return (
        <SafeAreaView></SafeAreaView>
    )



} */