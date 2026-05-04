import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../../config';
import colors from '../../constants/colors';
import { Post } from '../../src/types.js';

type Member = {
  id: number;
  username: string;
  name?: string;
  description?: string;
};

const AVATAR = require('../../assets/panda.png');
const API_URL = API_BASE;

export default function ForumScreen() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [compose, setCompose] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [lastFetchStatus, setLastFetchStatus] = useState<string | null>(null);
  const [lastFetchError, setLastFetchError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'posts' | 'search'>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const url = `${API_URL}/api/getPosts`;
      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        const body = await res.text().catch(() => '<no body>');
        setLastFetchStatus(`failed: ${res.status}`);
        setLastFetchError(String(body));
        Alert.alert('Error', `Failed to load posts (${res.status})`);
        return;
      }

      const data = await res.json();

      const normalized = (Array.isArray(data) ? data : []).map((p: any) => ({
        id: Number(p.id),
        authorId: p.authorId,
        content: p.content,
        likes: Number(p.likes) || 0,
        comments: 0,
      }));

      setPosts(normalized);
      setLastFetchStatus('ok');
      setLastFetchError(null);
    } catch (err: any) {
      setLastFetchStatus('error');
      setLastFetchError(err?.message ?? String(err));
      Alert.alert('Error', 'Failed to load posts: ' + (err?.message ?? String(err)));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Empty', 'Please enter a username to search');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/searchMembers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: searchQuery.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
        setShowDropdown(true);
      } else {
        const errBody = await res.text().catch(() => 'Unknown error');
        Alert.alert('Error', `Search failed (${res.status}): ${errBody}`);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Search failed: ' + (err?.message ?? String(err)));
    }
  };

  const handleSelectMember = async (username: string) => {
    try {
      const res = await fetch(`${API_URL}/api/getSpecificMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (res.ok) {
        const memberData = await res.json();

        setShowDropdown(false);
        setSearchQuery('');
        setSearchResults([]);

        router.push({
          pathname: '/member-profile',
          params: {
            memberData: JSON.stringify(memberData),
          },
        });
      } else {
        Alert.alert('Error', 'Failed to load member profile');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to fetch member: ' + (err?.message ?? String(err)));
    }
  };

  const handlePost = async () => {
    const trimmed = compose.trim();

    if (!trimmed) {
      Alert.alert('Empty', 'Please write something');
      return;
    }

    const newPost = {
      authorId: 'itzcoatl262',
      content: trimmed,
      likes: 0,
      comments: 0,
    };

    try {
      setIsPosting(true);

      const res = await fetch(`${API_URL}/api/makePost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });

      if (res.ok) {
        const created = await res.json();

        const createdNorm: Post = {
          id: Number(created.id),
          authorId: created.authorId,
          content: created.content,
          likes: Number(created.likes) || 0,
          comments: 0,
        };

        setPosts((prev) => [createdNorm, ...prev]);
        setCompose('');
        Alert.alert('Success', 'Post created!');
      } else {
        const errBody = await res.text().catch(() => 'Unknown error');
        Alert.alert('Error', `Failed to create post (${res.status}): ${errBody}`);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to create post: ' + (err?.message ?? String(err)));
    } finally {
      setIsPosting(false);
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
                  const res = await fetch(
                    `${API_URL}/api/deletePost?id=${encodeURIComponent(item.id.toString())}`,
                    { method: 'POST' }
                  );

                  if (res.ok) {
                    setPosts((prev) => prev.filter((t) => t.id !== item.id));
                    Alert.alert('Success', 'Post deleted');
                  } else {
                    Alert.alert('Error', `Failed to delete post (${res.status})`);
                  }
                } catch (err: any) {
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
              setLikedIds((prev) => {
                const next = new Set(prev);

                if (next.has(item.id)) {
                  next.delete(item.id);
                  setPosts((t) =>
                    t.map((x) =>
                      x.id === item.id
                        ? { ...x, likes: Math.max(0, (x.likes ?? 0) - 1), comments: 0 }
                        : { ...x, comments: 0 }
                    )
                  );
                } else {
                  next.add(item.id);
                  setPosts((t) =>
                    t.map((x) =>
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
                Alert.alert('Error', 'Sharing not available on this device');
              }
            }}
          >
            <Ionicons name="share-social-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Posts
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Find Users
          </Text>
        </Pressable>
      </View>

      {activeTab === 'posts' ? (
        <>
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

          {lastFetchStatus && (
            <View style={styles.statusBox}>
              <Text style={{ color: colors.textMuted }}>Last fetch: {lastFetchStatus}</Text>

              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                URL: {API_URL}/api/getPosts
              </Text>

              {lastFetchError ? (
                <View style={{ marginTop: 6, alignItems: 'center' }}>
                  <Text style={{ color: colors.accent, fontSize: 11 }}>
                    Error: {String(lastFetchError)}
                  </Text>

                  <Pressable onPress={loadPosts} style={styles.retryButton}>
                    <Text style={{ color: colors.cardBg, fontSize: 12 }}>Retry</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}

          <FlatList
            data={posts}
            keyExtractor={(i) => i.id.toString()}
            renderItem={renderPost}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No posts yet</Text>
            }
          />
        </>
      ) : (
        <View style={styles.searchContainer}>
          <Text style={styles.searchTitle}>Find Users</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search username"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            onSubmitEditing={handleSearch}
          />

          <Pressable style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>

          {showDropdown && searchResults.length > 0 ? (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdown}>
                {searchResults.map((item) => (
                  <Pressable
                    key={item.username}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectMember(item.username)}
                  >
                    <Text style={styles.dropdownItemText}>@{item.username}</Text>
                    {item.name ? (
                      <Text style={styles.dropdownItemSubtext}>{item.name}</Text>
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {showDropdown && searchResults.length === 0 ? (
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownEmpty}>User not found</Text>
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBgLight,
    backgroundColor: colors.cardBg,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  activeTab: {
    borderBottomColor: colors.primaryDark,
  },

  tabText: {
    color: colors.textMuted,
    fontWeight: '600',
  },

  activeTabText: {
    color: colors.primaryDark,
  },

  composeBox: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBgLight,
    backgroundColor: colors.cardBg,
  },

  composeInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBgLight,
    paddingHorizontal: 10,
    backgroundColor: colors.cardBg,
    marginRight: 8,
  },

  postButton: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  statusBox: {
    padding: 8,
    backgroundColor: colors.cardBgLight,
    alignItems: 'center',
  },

  retryButton: {
    marginTop: 6,
    padding: 6,
    backgroundColor: colors.primaryDark,
    borderRadius: 6,
  },

  tweetCard: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBgLight,
    backgroundColor: colors.background,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },

  tweetBody: {
    flex: 1,
  },

  tweetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  name: {
    fontWeight: '700',
    color: colors.primaryDark,
    marginRight: 8,
  },

  tweetText: {
    marginTop: 6,
    color: colors.text,
    lineHeight: 20,
  },

  tweetActions: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
    paddingRight: 40,
  },

  action: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionText: {
    color: colors.textMuted,
    marginLeft: 8,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.textMuted,
  },

  searchContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },

  searchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.text,
  },

  searchInput: {
    borderWidth: 1,
    borderColor: colors.cardBgLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: colors.cardBg,
    color: colors.text,
  },

  searchButton: {
    backgroundColor: colors.primaryDark,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },

  searchButtonText: {
    color: colors.cardBg,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  dropdownContainer: {
    marginBottom: 15,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBgLight,
    borderRadius: 8,
    maxHeight: 250,
  },

  dropdown: {
    maxHeight: 250,
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBgLight,
  },

  dropdownItemText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.primaryDark,
  },

  dropdownItemSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: colors.text,
  },

  dropdownEmpty: {
    padding: 15,
    textAlign: 'center',
    color: colors.textMuted,
  },
});