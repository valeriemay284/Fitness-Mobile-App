import { PaperProvider } from "react-native-paper";
import { Stack } from "expo-router";

export default function ProviderLayout() {
  return (
    <PaperProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
