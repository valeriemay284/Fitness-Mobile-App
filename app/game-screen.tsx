import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API_BASE_URL from "../constants/api";

const styles = StyleSheet.create({
  container: {
     flex: 1,
     padding: 20,
     backgroundColor: "#fff"
  },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  centerText: { textAlign: "center", marginTop: 40 },
  createButton: {
    alignSelf: "center",
    backgroundColor: "#1976D2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  createButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  card: { backgroundColor: "#f2f2f2", padding: 15, borderRadius: 10, marginBottom: 15 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
});

interface Game {
  gameId: number;
  title: string;
  sport: string;
  gameTime: string;
  maxPlayers?: number;
  participants?: string[];
}

export default function GameScreen() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/games/sport/All`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch games");
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGames();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.centerText}>Loading games...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.centerText, { color: "red" }]}>
          Error: {error}
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Game }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text>Sport: {item.sport}</Text>
      <Text>Time: {new Date(item.gameTime).toLocaleString()}</Text>
      <Text>Max Players: {item.maxPlayers ?? "N/A"}</Text>
      <Text>Players: {item.participants?.length ?? 0}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Games</Text>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push("/create-game")}
      >
        <Text style={styles.createButtonText}>+ Create Game</Text>
      </TouchableOpacity>

      {games.length === 0 ? (
        <Text style={styles.centerText}>No games found.</Text>
      ) : (
        <View>
          {games.map((item) => (
            <View key={item.gameId} style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text>Sport: {item.sport}</Text>
              <Text>Time: {new Date(item.gameTime).toLocaleString()}</Text>
              <Text>Max Players: {item.maxPlayers ?? "N/A"}</Text>
              <Text>Players: {item.participants?.length ?? 0}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
