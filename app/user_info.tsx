import React from "react";
import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import colors from '../constants/colors';
import formStyles from '../constants/formStyles';

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
                    <View>
                        <TextInput
                        /* style =*/ 
                        placeholder="Age"
                        value={age}
                        onChangeText={setAge}
                        returnKeyType="next"/>
                
                    </View>
                </View>
                
                {/* height field*/}
                <View>
                    <TextInput
                    placeholder="Height"
                    />
                </View>

                {/* weight field*/}
                <View>
                    <TextInput
                    placeholder="Weight"
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