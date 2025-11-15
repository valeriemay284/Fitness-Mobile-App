// MyProfileEditScreen.tsx
// create an edit profile screen similar to my_profile.tsx but with editable fields
// installed image picker to be used to upload a photo

import React, { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { useProfile } from './ProfileContext';

// ADD
// Image utilities
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
// This screen reads and writes the shared profile via ProfileContext. The
// edit screen allows picking an avatar (using expo-image-picker), optionally
// uploading it (mocked), and saving name/about fields back into the context.

const AVATAR = require('../assets/images/pfp.png');
const GYM_BG = require('../assets/images/panda.png');

export default function MyProfileEditScreen() {
  const [name, setName] = useState('Your Name');
  const [aboutMe, setAboutMe] = useState(
    'Hai my name is John Doe and I love coding mobile and web apps. I am always excited to learn new technologies and improve my skills!'
  );

  // Added: local avatar preview state
  const [avatarUri, setAvatarUri] = useState<string | null>(null); // null initially
  const [saving, setSaving] = useState(false); // to manage saving state
  const { setProfile } = useProfile();
  const router = useRouter();

  // Added: pick image (web + native)
  const pickAvatar = async () => {
    // On native we request permission; on web this returns "granted" automatically
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted' && Platform.OS !== 'web') {
      Alert.alert('Permission required', 'Please allow photo library access.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // allow user to crop
      aspect: [1, 1], // square
      quality: 1,
    });
    if (res.canceled) return;

    const asset = res.assets[0];

    // Normalize to 512x512 JPEG for consistent avatars. We manipulate the
    // image locally so we have a stable URI to display while the (optional)
    // upload runs in the background.
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    setAvatarUri(manipulated.uri);
  };

  // Added: upload to server (mock)
  const uploadAvatar = async (uri: string) => {
    // Upload flow (mock): build a FormData payload and POST to a local
    // endpoint. If you don't have a server, this will fail at runtime; in
    // that case the app will still show the locally-manipulated avatar URI.
    const fileName = `pfp-${Date.now()}.jpg`;
    const fd = new FormData();

    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      // On web we can append a File/Blob directly
      fd.append('pfp', blob, fileName as any);
    } else {
      // React Native form data for files uses an object with uri/name/type
      fd.append('pfp', { uri, name: fileName, type: 'image/jpeg' } as any);
    }

    const resp = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: fd,
    });
    if (!resp.ok) {
      throw new Error(`Upload failed: ${resp.status}`);
    }
    const json = await resp.json();
    return json.url as string; // hosted URL from your server (expected)
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      let avatarUrl: string | undefined;

      // if a new avatar was selected, upload it first (optional). We take
      // care to fall back to the local manipulated uri if upload isn't
      // available so the UI updates immediately.
      if (avatarUri) {
        try {
          avatarUrl = await uploadAvatar(avatarUri);
        } catch (e) {
          // upload failed — we'll still use the local manipulated URI
          console.warn('Avatar upload failed, using local uri', e);
        }
      }

      // Update context so profile changes are visible in other screens
      setProfile({ name, about: aboutMe, avatarUri: avatarUrl ?? avatarUri });
      // send profile payload to backend/store (mock)
      const payload = { name, aboutMe, avatarUrl };
      console.log('Profile saved:', payload);
      // await api.saveProfile(payload);

      Alert.alert('Saved!', 'Your profile was updated.');
      // navigate back to profile screen
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ImageBackground source={GYM_BG} style={styles.bg} resizeMode="contain">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          {/* wrap avatar in a button to pick a new one */}
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
            <Image source={avatarUri ? { uri: avatarUri } : AVATAR} style={styles.avatar} />
          </TouchableOpacity>

          <View style={styles.goldBox}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="rgba(255,255,255,0.7)"
            />
          </View>

          <View style={styles.goldBoxAbout}>
            <TextInput
              style={styles.aboutInput}
              value={aboutMe}
              onChangeText={setAboutMe}
              placeholder="Tell us about yourself"
              placeholderTextColor="rgba(255,255,255,0.7)"
              multiline
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSaveProfile} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
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
    paddingBottom: 0,
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
  nameInput: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
    paddingVertical: 4,
    minWidth: 200,
  },
  aboutInput: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    minWidth: 250,
    maxWidth: 300,
    height: 100,
  },
  goldBox: {
    backgroundColor: 'rgba(54, 146, 72, 0.95)',
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
    backgroundColor: 'rgba(54, 146, 72, 0.95)',
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 16,
  },
});
