/**
 * Module: Root Layout
 * Date: 2026-04-17
 * Programmer: Group 4
 *
 * Description:
 *   Initializes the app shell and provides the AuthProvider to the
 *   navigation stack. It also loads custom fonts and manages the splash
 *   screen visibility until fonts are ready.
 *
 * Important data structures:
 *   - loaded: boolean state from useFonts indicating font readiness
 *
 * Algorithm note:
 *   The useEffect hook hides the splash screen only after font loading
 *   completes, preventing a blank screen or layout shift during startup.
 */
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { AuthProvider } from "../components/AuthContext";
import AiChatBubble from "../components/AiChatBubble";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  // Stack here just manages routing
  return(
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <AiChatBubble />
    </AuthProvider>
  );
}
