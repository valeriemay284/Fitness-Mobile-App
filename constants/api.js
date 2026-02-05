import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import API_BASE_URL from "../constants/api";
export const API_URL = 'http://localhost:8080/api';

export default function CreateGame() {
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  const createGame = async () => {
    if (!title.trim() || !sport.trim() || !maxPlayers.trim()) {
      Alert.alert("Validation", "Please fill in all fields.");
      return;
    }

    const eventDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes()
    );

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          sport,
          maxPlayers: parseInt(maxPlayers, 10),
          gameTime: eventDateTime.toISOString(),
          eventDate: date.toISOString().split("T")[0],
        }),
      });

      if (res.ok) {
        Alert.alert("Success", "Game created!", [
          {
            text: "OK",
            onPress: () => router.push("/GameScreen"), // ✅ this works with expo-router
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to create game.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Network error.");
    }
  };

  return (
    <View style={styles.container}>
      <Text>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} />
      <Text>Sport</Text>
      <TextInput value={sport} onChangeText={setSport} style={styles.input} />
      <Text>Max Players</Text>
      <TextInput value={maxPlayers} onChangeText={setMaxPlayers} style={styles.input} keyboardType="numeric" />

      <TouchableOpacity onPress={createGame} style={styles.button}>
        <Text style={styles.btnText}>Create Game</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginVertical: 10, borderRadius: 5 },
  button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 5, alignItems: "center" },
  btnText: { color: "white", fontWeight: "bold" },
});