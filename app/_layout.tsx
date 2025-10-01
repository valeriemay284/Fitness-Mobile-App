import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { SplashScreen } from "expo-router";
import { PaperProvider } from "react-native-paper";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
  });

  // Keep splash until fonts load
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  // Wrap your Stack (navigator) in PaperProvider here
  return (
    <PaperProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
