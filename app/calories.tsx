import React, { useState } from "react";
import { Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";

export default function CaloriesPage() {
  // state to hold input calories
  const [calories, setCalories] = useState("");
  const [savedCalories, setSavedCalories] = useState("");

  // handle saving calories
  const handleSave = () => {
    if (calories.trim() === "") return; // don't save empty input
    setSavedCalories(calories); // store the input
    setCalories(""); // clear input
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>
        Enter Calories
      </Text>

      {/* Calories input */}
      <TextInput
        label="Calories"
        value={calories}
        onChangeText={setCalories}
        keyboardType="numeric" // numeric keyboard
        style={{ marginBottom: 15 }}
      />

      {/* Save button */}
      <Button mode="contained" onPress={handleSave}>
        Save
      </Button>

      {/* Show saved calories */}
      {savedCalories ? (
        <Text style={{ marginTop: 20, fontSize: 16 }}>
          You logged: {savedCalories} calories
        </Text>
      ) : null}
    </View>
  );
}
