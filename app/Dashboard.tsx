import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, IconButton, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";

export default function Dashboard() {
  const router = useRouter();
  const theme = useTheme(); //  gets the theme from PaperProvider

  return (
    <View style={styles.container}>
      {/* Profile */}
      <Card style={styles.card} onPress={() => router.push("/profile")}>
        <Card.Content style={styles.cardContent}>
          <IconButton icon="account" size={40} iconColor={theme.colors.primary} />
          <Text variant="titleMedium">Profile</Text>
        </Card.Content>
      </Card>

      {/* Workout */}
      <Card style={styles.card} onPress={() => router.push("/workout")}>
        <Card.Content style={styles.cardContent}>
          <IconButton icon="dumbbell" size={40} iconColor={theme.colors.primary} />
          <Text variant="titleMedium">Workout</Text>
        </Card.Content>
      </Card>

      {/* Calories */}
      <Card style={styles.card} onPress={() => router.push("/calories")}>
        <Card.Content style={styles.cardContent}>
          <IconButton icon="fire" size={40} iconColor={theme.colors.primary} />
          <Text variant="titleMedium">Calories</Text>
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.card} onPress={() => router.push("/settings")}>
        <Card.Content style={styles.cardContent}>
          <IconButton icon="cog" size={40} iconColor={theme.colors.primary} />
          <Text variant="titleMedium">Settings</Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 10,
  },
  card: {
    width: "40%",
    margin: 10,
    borderRadius: 12,
    elevation: 3,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
  },
});
