import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Button 
        title="Go to Profile" 
        onPress={() => router.push("/profile")} 
      />
      <Button 
        title="Back to Login" 
        onPress={() => router.push("/")} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
});
