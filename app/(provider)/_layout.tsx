import { PaperProvider } from "react-native-paper";
import { Stack } from "expo-router";

export default function ProviderLayout() {
  return (
    <PaperProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
//(provider) folder is a grouped route in Expo Router.

//All pages inside (provider) now have access to PaperProvider context, so useTheme() in Dashboard will work.

//You cannot wrap the root Stack in PaperProvider in the app root _layout.ts