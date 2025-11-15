import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from "expo-router";
import React from 'react';
import { Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#C0EB6A', '#FFFFFF']}        // start (green) -> end (white)
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <Text>ADMIN DEV VIEW:</Text>
        <Link href="/login">Login Page</Link>
        <Link href="/register"> register page </Link>
        <Link href="/user_info">user info</Link>
        <Link href="/forum">Forum</Link>
        <Link href="/Thread">Thread</Link>

        <Pressable onPress={() => router.push('/my_profile' as any)} style={{ padding: 6 }}>
          <Text style={{ color: '#2B8AEB' }}>My Profile</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
