import { View, Text, StyleSheet } from "react-native";

export default function Calories() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Calories Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 22,
    fontWeight: "600",
  },
});
