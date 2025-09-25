import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import colors from '../constants/colors';
import formStyles from '../constants/formStyles';
import { Button } from '@react-navigation/elements';

export default function RegisterPage() {
    /* email validation: i.e something@something.com */
    const isEmail = (s) => /.+@.+\..+/.test(String(s).toLowerCase());

    /* state for each field */ 
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    // sign up: name email
    // create login: password username

    const onRegister = () => {
        const[name, setName] = useState('');
        const[email, setEmail] = useState('');
    }

    const onCreateLogin = () => {
        const [password, setPassword] = useState('');
        const [user, setUser] = useState('');
    }

    const 

    const [serverMessage, setServerMessage] = useState('');
    
    /* email & password validation */
    const emailOk = isEmail(email.trim());
    const passOk = password.length >= 6;
    const matchOk = password === confirm && confirm.length > 0;

    /* form is valid if all checks pass */
    const formValid = emailOk && passOk && matchOk;

    /* submit handler + send to backend*/
    const REGISTER_URL = 'http://10.41.223.239:8080/api/signup';
    
    const onSignUp = async () => {
        if (!formValid) return;

        try {
            const response = await fetch(REGISTER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const data = await response.json();
            console.log("Backend response:", data);

            // assume backend sends back a .message field

            if (!response.ok && data?.message) {
                setServerMessage(data.message);
            } else if (response.ok) {
                setServerMessage("User registereed successfully");
            }
        } catch (err) {
            console.error("Register error:", err);
        }
    };
    
    const onLogIn = () => console.log('Go to Login'); 

    /* TODO visible error messages */
    
    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View>

                        <View>
                            <Text>Welcome!</Text>
                        </View>

                        <View>
                            <TextInput
                                placeholder="Name"
                                placeholderTextColor={colors.textMuted}
                                autoCapitalize="none"
                                value={name}
                                onChangeText={setName} />
                        </View>

                        <View>
                            {/* email */}
                            <TextInput
                                placeholder="Email address"
                                placeholderTextColor={colors.textMuted}
                                autoCapitalize="none"
                                autoComplete="email"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                                returnKeyType="next"
                            />
                        </View>

                    <Button onPress={onRegister}>sign up</Button>
                    <Button onPress={onCreateLogin}>create login</Button>

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




