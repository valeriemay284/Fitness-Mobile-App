import { Stack, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
  });

  // keep splash until fonts load
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return <Stack />;
}
