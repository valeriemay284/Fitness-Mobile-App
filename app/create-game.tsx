import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API_BASE_URL from "../constants/api";


export default function CreateGame() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateGame = async () => {
    if (!title || !sport || !maxPlayers || !date || !time) {
    Alert.alert("Error", "Please fill in all fields");
    return;
  }

  const jsDate = new Date(`${date}T${time}`);
  if (isNaN(jsDate.getTime())) {
    Alert.alert("Error", "Invalid date/time format (YYYY-MM-DD & HH:MM)");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${API_BASE_URL}/api/games/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        sport,
        maxPlayers: parseInt(maxPlayers, 10),
        gameTime: jsDate.toISOString(),
      }),
    });

    const data = await res.json().catch(() => null);

    if (res.ok) {
      router.replace("/game-screen?newGame=true");
    } else {
      Alert.alert("Error", data?.message || "Failed to create game");
    }
  } catch (err) {
    Alert.alert("Error", "Network error creating game");
  } finally {
    setLoading(false);
  }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create a New Game</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Sport"
        value={sport}
        onChangeText={setSport}
      />
      <TextInput
        style={styles.input}
        placeholder="Max Players"
        value={maxPlayers}
        onChangeText={setMaxPlayers}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />
      <TextInput
        style={styles.input}
        placeholder="Time (HH:MM)"
        value={time}
        onChangeText={setTime}
      />
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleCreateGame}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Creating..." : "Create Game"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 12 },
  button: { backgroundColor: "#1976D2", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
