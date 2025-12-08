import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../../config'; // centralized API base URL in src/config.ts
import colors from '../../constants/colors';
import { Post } from '../../src/types.js';



// Forum screen connects to Spring backend for posts.
// Users can create, delete, like, and share posts.
// Backend: GET /api/getPosts, POST /api/makePost, POST /api/deletePost?id=<id>

const AVATAR = require('../../assets/panda.png');
const API_URL = API_BASE; // centralized API base

export default function ForumScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [compose, setCompose] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [lastFetchStatus, setLastFetchStatus] = useState<string | null>(null);
  const [lastFetchError, setLastFetchError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      console.log('[Forum] Loading posts from', API_URL);
      const url = `${API_URL}/api/getPosts`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        const body = await res.text().catch(() => '<no body>');
        console.error('[Forum] Failed to load posts, status:', res.status, body);
        setLastFetchStatus(`failed: ${res.status}`);
        setLastFetchError(String(body));
        Alert.alert('Error', `Failed to load posts (${res.status})`);
        return;
      }
      const data = await res.json();
      // Normalize: ensure id is numeric, comments always 0 on client
      const normalized = (Array.isArray(data) ? data : []).map((p: any) => ({
        id: Number(p.id),
        authorId: p.authorId,
        content: p.content,
        likes: Number(p.likes) || 0,
        comments: 0, // Always 0 on client
      }));
      setPosts(normalized);
      setLastFetchStatus('ok');
      setLastFetchError(null);
      console.log('[Forum] Loaded', normalized.length, 'posts');
    } catch (err: any) {
      console.error('[Forum] Failed to load posts', err);
      setLastFetchStatus('error');
      setLastFetchError(err?.message ?? String(err));
      Alert.alert('Error', 'Failed to load posts: ' + (err?.message ?? String(err)));
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.tweetCard}>
      <Image source={AVATAR} style={styles.avatar} />
      <View style={styles.tweetBody}>
        <View style={styles.tweetHeader}>
          <Text style={styles.name}>{item.authorId}</Text>
          {item.authorId === 'itzcoatl262' && (
            <Pressable
              style={{ marginLeft: 'auto' }}
              onPress={async () => {
                try {
                  console.log('[Forum] Deleting post id:', item.id);
                  const res = await fetch(`${API_URL}/api/deletePost?id=${encodeURIComponent(item.id.toString())}`, {
                    method: 'POST',
                  });
                  if (res.ok) {
                    setPosts((prev: Post[]) => prev.filter((t: Post) => t.id !== item.id));
                    Alert.alert('Success', 'Post deleted');
                    console.log('[Forum] Post deleted successfully');
                  } else {
                    const body = await res.text().catch(() => 'Unknown error');
                    console.error('[Forum] Delete failed:', res.status, body);
                    Alert.alert('Error', `Failed to delete post (${res.status})`);
                  }
                } catch (err: any) {
                  console.error('[Forum] Delete error', err);
                  Alert.alert('Error', 'Failed to delete post: ' + (err?.message ?? String(err)));
                }
              }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
          <Text style={styles.tweetText}>{item.content}</Text>
        <View style={styles.tweetActions}>
          <Pressable
            style={styles.action}
            onPress={() => {
              // Toggle like locally
              setLikedIds(prev => {
                const next = new Set(prev);
                if (next.has(item.id)) {
                  next.delete(item.id);
                  setPosts((t: Post[]) =>
                    t.map((x: Post) =>
                      x.id === item.id
                        ? { ...x, likes: Math.max(0, (x.likes ?? 0) - 1), comments: 0 }
                        : { ...x, comments: 0 }
                    )
                  );
                } else {
                  next.add(item.id);
                  setPosts((t: Post[]) =>
                    t.map((x: Post) =>
                      x.id === item.id
                        ? { ...x, likes: (x.likes ?? 0) + 1, comments: 0 }
                        : { ...x, comments: 0 }
                    )
                  );
                }
                return next;
              });
            }}
          >
            <Ionicons
              name={likedIds.has(item.id) ? 'heart' : 'heart-outline'}
              size={18}
              color={likedIds.has(item.id) ? colors.accent : colors.textMuted}
            />
            <Text style={styles.actionText}>{item.likes ?? 0}</Text>
          </Pressable>
          <Pressable
            style={styles.action}
            onPress={async () => {
              const message = `${item.authorId} posted: "${item.content ?? ''}"`;
              if (await Sharing.isAvailableAsync()) {
                const uri = (FileSystem as any).documentDirectory + 'post.txt';
                await FileSystem.writeAsStringAsync(uri, message);
                await Sharing.shareAsync(uri);
              } else {
                alert('Sharing not available on this device');
              }
            }}
          >
            <Ionicons name="share-social-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  // Handle creating a new post with connectivity check and proper error handling
  const handlePost = async () => {
    const trimmed = compose.trim();
    if (!trimmed) {
      Alert.alert('Empty', 'Please write something');
      return;
    }

    // Backend expects: { authorId, content, likes, comments } (all fields required)
    const newPost = {
      authorId: 'itzcoatl262',
      content: trimmed,
      likes: 0,
      comments: 0,
    };

    try {
      setIsPosting(true);
      console.log('[Forum] Creating post:', newPost);
      const res = await fetch(`${API_URL}/api/makePost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });

      if (res.ok) {
        const created = await res.json();
        console.log('[Forum] Post created successfully:', created);
        // Normalize the created post
        const createdNorm: Post = {
          id: Number(created.id),
          authorId: created.authorId,
          content: created.content,
          likes: Number(created.likes) || 0,
          comments: 0, // Always 0 on client
        };
        setPosts(prev => [createdNorm, ...prev]);
        setCompose('');
        Alert.alert('Success', 'Post created!');
      } else {
        const errBody = await res.text().catch(() => 'Unknown error');
        console.error('[Forum] Failed to create post, status:', res.status, errBody);
        Alert.alert('Error', `Failed to create post (${res.status}): ${errBody}`);
      }
    } catch (err: any) {
      console.error('[Forum] Post error', err);
      Alert.alert('Error', 'Failed to create post: ' + (err?.message ?? String(err)));
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Compose bar */}
      <View style={styles.composeBox}>
        <TextInput
          value={compose}
          onChangeText={setCompose}
          placeholder="What's happening?"
          style={styles.composeInput}
          placeholderTextColor={colors.textMuted}
        />
        <Pressable
          style={styles.postButton}
          onPress={handlePost}
          disabled={isPosting || !compose.trim()}
        >
          <Text style={{ color: colors.cardBg, fontWeight: '700' }}>
            {isPosting ? 'Posting...' : 'Post'}
          </Text>
        </Pressable>
      </View>

      

      {/* Fetch status panel */}
      {lastFetchStatus && (
        <View style={{ padding: 8, backgroundColor: colors.cardBgLight, alignItems: 'center' }}>
          <Text style={{ color: colors.textMuted }}>
            Last fetch: {lastFetchStatus}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            URL: {API_URL}/api/getPosts
          </Text>
          {lastFetchError ? (
            <View style={{ marginTop: 6, alignItems: 'center' }}>
              <Text style={{ color: colors.accent, fontSize: 11 }}>
                Error: {String(lastFetchError)}
              </Text>
              <Pressable
                onPress={loadPosts}
                style={{
                  marginTop: 6,
                  padding: 6,
                  backgroundColor: colors.primaryDark,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: colors.cardBg, fontSize: 12 }}>Retry</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}

      {/* Posts feed */}
      <FlatList
        data={posts}
        keyExtractor={(i) => i.id.toString()}
        renderItem={renderPost}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textMuted }}>
            No posts yet
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tweetCard: { flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.cardBgLight, backgroundColor: colors.background },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  tweetBody: { flex: 1 },
  tweetHeader: { flexDirection: 'row', alignItems: 'center' },
  name: { fontWeight: '700', color: colors.primaryDark, marginRight: 8 },
  handle: { color: colors.textMuted, marginLeft: 6 },
  tweetText: { marginTop: 6, color: colors.text, lineHeight: 20 },
  tweetActions: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between', paddingRight: 40 },
  action: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: colors.textMuted, marginLeft: 8 },
  composeBox: { flexDirection: 'row', padding: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.cardBgLight, backgroundColor: colors.cardBg },
  composeInput: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: colors.cardBgLight, paddingHorizontal: 10, backgroundColor: colors.cardBg, marginRight: 8 },
  postButton: { backgroundColor: colors.primaryDark, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
});