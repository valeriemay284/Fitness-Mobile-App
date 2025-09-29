import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import colors from '../constants/colors';
import formStyles from "@/constants/formStyles";

export default function UserInfoScreen() {
    /* state for each field*/
    const [age, setAge] = useState('');
    const [heightFeet, setHeightFeet] = useState('');
    const [heightInches, setHeightInches] = useState('');
    const [weight, setWeight] = useState('');
    const [sex, setSex] = useState('');

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView style = {{ flex : 1}}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View>
                    <Text style={styles.title}>title here</Text>
                    {/* age field*/}
                    <View style={formStyles.inputWrap}>
                        <TextInput
                        style={formStyles.input}
                        placeholder="Age"
                        placeholderTextColor={colors.textMuted}
                        value={age}
                        onChangeText={setAge}
                        returnKeyType="next"/>
                
                    </View>
                </View>

                {/* height field*/}
                <View style={formStyles.inputWrap}>
                    <TextInput
                    style={formStyles.input}
                    placeholder="Height"
                    placeholderTextColor={colors.textMuted}
                    />
                </View>

                {/* weight field*/}
                <View style={formStyles.inputWrap}>
                    <TextInput
                    style={formStyles.input}
                    placeholder="Weight"
                    placeholderTextColor={colors.textMuted}
                    />
                </View>
            
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.cardBg }, 
        title: { 
            color: colors.primaryDark, 
            fontSize: 20, 
            fontWeight:'800', 
            textAlign: 'center', 
            marginBottom: 8,
        },
    });