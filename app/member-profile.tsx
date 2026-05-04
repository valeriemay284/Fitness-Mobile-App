import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { API_BASE } from '../config';
import colors from '../constants/colors';

export default function MemberProfile() {
  const { memberData } = useLocalSearchParams();

  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const username = await AsyncStorage.getItem('username');
      setCurrentUsername(username);
    };

    loadUser();
  }, []);

  const member = memberData ? JSON.parse(memberData as string) : null;

  if (!member) {
    return (
      <View style={styles.container}>
        <Text>No member found</Text>
      </View>
    );
  }

  const handleFollow = async () => {
    if (!currentUsername) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    if (currentUsername === member.username) {
      Alert.alert('Error', 'You cannot follow yourself');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isFollowing ? '/api/unfollow' : '/api/follow';

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUsername,
          followeeUsername: member.username,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      setIsFollowing(!isFollowing);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Follow failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.username}>@{member.username}</Text>

      {member.name ? <Text style={styles.text}>Name: {member.name}</Text> : null}
      {member.age > 0 ? <Text style={styles.text}>Age: {member.age}</Text> : null}
      {member.height > 0 ? <Text style={styles.text}>Height: {member.height}</Text> : null}
      {member.weight > 0 ? <Text style={styles.text}>Weight: {member.weight}</Text> : null}

      {member.description ? (
        <Text style={styles.text}>Description: {member.description}</Text>
      ) : null}

      <Pressable
        style={styles.followButton}
        onPress={handleFollow}
        disabled={isLoading}
      >
        <Text style={styles.followText}>
          {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  username: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
    color: colors.text,
  },
  followButton: {
    marginTop: 20,
    backgroundColor: colors.primaryDark,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  followText: {
    color: colors.cardBg,
    fontWeight: 'bold',
  },
});