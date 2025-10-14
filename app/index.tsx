import React from 'react';
import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import Dashboard from './(provider)/Dashboard';

export default function Index() {
  return(
    <View
      style={styles.view}
    >
      <Text>hellobello</Text>
      <Link href="/login">Login Page</Link>
      <Link href="/register"> register page </Link>
      <Link href="/user_info">user info</Link>
      <Link href='/Dashboard'>Dashboard</Link>
    </View>
  );
}

const colors = {
  primaryDark: '#42564F',
  primary: '#C0EB6A',
  background: '#F7F6E7',
  cardBg: '#DfDDC5',
  textMuted: '#6B7280',
  white: '#FFFFFF'
};

const styles = StyleSheet.create({
  view: {flex: 1,
        justifyContent: "center",
        alignItems: "center",}
})

