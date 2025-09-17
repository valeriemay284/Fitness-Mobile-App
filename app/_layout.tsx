import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ title: "Login" }} 
      />
      <Stack.Screen 
        name="dashboard" 
        options={{ title: "Dashboard" }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ title: "Profile" }} 
      />
    </Stack>
  );
}
