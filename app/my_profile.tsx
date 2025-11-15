import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from './ProfileContext';

// Profile screen
// Reads the current profile from ProfileContext and displays it. When the
// user taps "Edit My Profile" it navigates to the edit screen where changes
// will be written back into the same context.

const AVATAR = require('../assets/images/pfp.png');
const GYM_BG = require('../assets/images/panda.png');

export default function MyProfileScreen() {
    const router = useRouter();
    const { profile } = useProfile();
    // pull fields from the shared profile context so updates here reflect
    // changes saved from the edit screen without additional wiring.
    const name = profile.name;
    const aboutMe = profile.about;
    const avatarUri = profile.avatarUri;

    const handleEditProfile = () => {
        // navigate to edit screen
        router.push('/my_profile_edit');
    };

    return (
        <ImageBackground source={GYM_BG} style={styles.bg} resizeMode="contain">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.header}>
                    <Image source={avatarUri ? { uri: avatarUri } : AVATAR} style={styles.avatar} />
                    <View style={styles.goldBox}>
                        <Text style={styles.name}>{name}</Text>
                    </View>
                    <View style={styles.goldBoxAbout}>
                        <Text style={styles.about}>{aboutMe}</Text>
                    </View>
                    <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
                        <Text style={styles.buttonText}>Edit My Profile</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 0, // fixed safe paddingBottom
    },
    bg: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
    },
    about: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    goldBox: {
        backgroundColor: 'rgba(54, 146, 72, 0.95)', // green-ishw
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    goldBoxAbout: {
        backgroundColor: 'rgba(54, 146, 72, 0.95)', // green-ish
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    // overlay to improve contrast over background
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent'
    },
    // add subtle shadow for boxes
    boxShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    button: {
        backgroundColor: 'rgba(54, 146, 72, 0.95)', // green-ish
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    buttonText: {
        color: '#111',
        fontSize: 16,
        fontWeight: '600',
    },
    // pandaImage removed — background uses ImageBackground
});
