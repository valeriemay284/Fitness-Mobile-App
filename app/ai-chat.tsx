import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../components/AuthContext";

const API_URL = "http://10.41.217.81:8080/api/talk";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function AiChatScreen() {
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your fitness assistant. Ask me anything about workouts, nutrition, or health!",
      isUser: false,
    },
  ]);

  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const listRef  = useRef<FlatList>(null);
  const { user } = useAuth() as any;

  const userProfile = (user || {}) as {
    username?: string;
    goals?: string;
    activity_level?: string;
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = input.trim();
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username:       userProfile.username       || "guest",
          goals:          userProfile.goals          || "general fitness",
          activity_level: userProfile.activity_level || "moderate",
          message:        messageToSend,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.text();
      setMessages((prev) => [
        ...prev,
        {
          id:     (Date.now() + 1).toString(),
          text:   data || "Sorry, I couldn't get a response. Please try again.",
          isUser: false,
        },
      ]);
    } catch {
      Alert.alert("Error", "Failed to connect to the server. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          id:     (Date.now() + 1).toString(),
          text:   "Sorry, I'm having trouble connecting. Please check your connection and try again.",
          isUser: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.isUser ? styles.rowUser : styles.rowAi]}>
      {!item.isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="fitness" size={14} color="#42564F" />
        </View>
      )}
      <View style={[styles.bubble, item.isUser ? styles.bubbleUser : styles.bubbleAi]}>
        <Text style={item.isUser ? styles.textUser : styles.textAi}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Header — same #DDECC8 green as login hero ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color="#2F4F3E" />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#42564F" />
          </View>
          <Text style={styles.headerText}>Fitness Assistant</Text>
        </View>

        {/* spacer to keep title centred */}
        <View style={{ width: 36 }} />
      </View>

      {/* ── Message list — cream body ── */}
      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        style={styles.listWrapper}
      />

      {/* Typing indicator */}
      {loading && (
        <View style={styles.typingRow}>
          <View style={styles.aiAvatar}>
            <Ionicons name="fitness" size={14} color="#42564F" />
          </View>
          <View style={[styles.bubble, styles.bubbleAi, styles.typingBubble]}>
            <ActivityIndicator size="small" color="#42564F" />
          </View>
        </View>
      )}

      {/* ── Input bar ── */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          placeholderTextColor="#8FA898"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          editable={!loading}
        />
        <Pressable
          onPress={sendMessage}
          disabled={!input.trim() || loading}
          style={({ pressed }) => [
            styles.sendBtn,
            (!input.trim() || loading) && styles.sendBtnDisabled,
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F7F6E7", // cream — matches dashboard body
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: "#DDECC8",  // login hero green
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(66,86,79,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(66,86,79,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    color: "#2F4F3E",
    fontSize: 17,
    fontWeight: "800",
  },

  // ── Message list ─────────────────────────────────────────────────────────────
  listWrapper: {
    flex: 1,
  },

  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },

  rowUser: {
    justifyContent: "flex-end",
  },

  rowAi: {
    justifyContent: "flex-start",
  },

  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#DDECC8",
    borderWidth: 1,
    borderColor: "#C8DFB2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },

  bubbleUser: {
    backgroundColor: "#42564F",  // dark green — matches login button
    borderBottomRightRadius: 4,
  },

  bubbleAi: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8D9",
  },

  textUser: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 21,
  },

  textAi: {
    color: "#2F4F3E",
    fontSize: 15,
    lineHeight: 21,
  },

  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },

  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // ── Input bar ─────────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8D9",
    gap: 10,
  },

  input: {
    flex: 1,
    backgroundColor: "#F7F6E7",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8D9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: "#2F4F3E",
  },

  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#42564F",
    alignItems: "center",
    justifyContent: "center",
  },

  sendBtnDisabled: {
    backgroundColor: "#C8DFB2",
  },
});