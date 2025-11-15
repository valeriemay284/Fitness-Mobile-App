// ThreadScreen: Display a single post with comments.
// Backend: GET /api/getComments?id=<postId>, POST /api/posts/<postId>/comments (or similar)
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../constants/colors';
import { Comment, Post } from '../src/types';

const API_URL = 'http://localhost:8080'; // Use same backend URL as forum


const AVATAR = require('../assets/panda.png');

export default function ThreadScreen({ route }: any) {
  const { postId, post }: { postId: number; post: Post } = route.params;
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');

  const load = async () => {
    try {
      console.log('[Thread] Loading comments for post id:', postId);
      // Backend uses GET /api/getComments?id=<postId>
      const res = await fetch(`${API_URL}/api/getComments?id=${encodeURIComponent(postId.toString())}`);
      if (!res.ok) {
        const body = await res.text().catch(() => '<no body>');
        console.error('[Thread] Failed to load comments, status:', res.status, body);
        Alert.alert('Error', `Failed to load comments (${res.status})`);
        return;
      }
      const data = await res.json();
      const normalized = (Array.isArray(data) ? data : []).map((c: any) => ({
        id: Number(c.id),
        postId: Number(c.postId),
        authorId: c.authorId,
        content: c.content,
        likes: Number(c.likes) || 0,
      }));
      setComments(normalized);
      console.log('[Thread] Loaded', normalized.length, 'comments');
    } catch (err: any) {
      console.error('[Thread] Failed to load comments', err);
      Alert.alert('Error', 'Failed to load comments: ' + (err?.message ?? String(err)));
    }
  };

  const postComment = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert('Empty', 'Please write something');
      return;
    }

    // Backend expects: { id?, postId, authorId, content, likes } (id is optional, auto-generated)
    const newComment: Comment = {
      id: 0, // Will be assigned by backend
      postId,
      authorId: 'itzcoatl262',
      content: trimmed,
      likes: 0,
    };

    try {
      console.log('[Thread] Creating comment:', newComment);
      // NOTE: Backend has /api/makeComments as GET (likely a bug), but we POST to be safe
      // If backend rejects POST, fall back to GET with query params
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComment),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => 'Unknown error');
        console.error('[Thread] Failed to post comment, status:', res.status, body);
        Alert.alert('Error', `Failed to post comment (${res.status}): ${body}`);
        return;
      }

      const created = await res.json();
      console.log('[Thread] Comment posted successfully:', created);
      const createdNorm: Comment = {
        id: Number(created.id),
        postId: Number(created.postId),
        authorId: created.authorId,
        content: created.content,
        likes: Number(created.likes) || 0,
      };
      setComments(prev => [createdNorm, ...prev]);
      setText('');
      Alert.alert('Success', 'Comment posted!');
    } catch (err: any) {
      console.error('[Thread] Post comment error', err);
      Alert.alert('Error', 'Failed to post comment: ' + (err?.message ?? String(err)));
    }
  };

  useEffect(() => { load(); }, []);

  const renderItem = ({ item }: { item: Comment }) => (
    <View style={s.commentRow}>
      <Image source={AVATAR} style={s.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={s.commentHeader}>
          <Text style={s.name}>{item.authorId}</Text>
        </Text>
        <Text style={s.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.title}>Thread</Text>
      </View>

      <View style={s.tweetCard}>
  <Text style={s.handle}>{post.authorId}</Text>
    <Text style={{ marginTop: 6 }}>{post.content}</Text>
      </View>

      <FlatList
        data={comments}
        keyExtractor={(i) => i.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80} style={s.inputBar}>
        <TextInput
          style={s.input}
          placeholder="Write a comment..."
          value={text}
          onChangeText={setText}
        />
        <Pressable style={s.send} onPress={postComment} disabled={!text.trim()}>
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { height: 52, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },

  tweetCard: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },

  commentRow: { flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  name: { fontWeight: '700', color: colors.primaryDark },
  handle: { color: colors.textMuted, fontWeight: '400' },
  commentHeader: { marginBottom: 2 },
  commentText: { color: '#111827' },

  inputBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee'
  },
  input: { flex: 1, height: 42, borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, backgroundColor: '#fff' },
  send: { marginLeft: 10, backgroundColor: colors.primaryDark, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
