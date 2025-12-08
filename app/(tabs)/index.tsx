import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router"; // ADDED 12/8
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../components/AuthContext";
import ProgressRing from "../../components/ProgressRing";
import WeeklyChart from "../../components/WeeklyChart";
import colors from "../../constants/colors";

const { width } = Dimensions.get("window");

export default function HomeDashboard() {
  // get the logged-in user from AuthContext
  const { user, signOut } = useAuth() as any; //  signOut added 12/8
  const router = useRouter(); //  ADDED 12/8

  // format today's date as "Friday, November 15"
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // animated value used for the streak rotation animation
  const streakAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // loop an animation that oscillates from 0 → 1 → 0
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(streakAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // rotation interpolation for the streak pill
  const scale = streakAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* top banner with gradient background */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={styles.headerGradient}
      >
        {/* left: greeting/date — right: avatar + sign out */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name || "Friend"} </Text>
            <Text style={styles.date}>{today}</Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <Image
              source={require("../../assets/panda.png")}
              style={styles.avatar}
            />

            {/* SIGN OUT BUTTON */}
            <Pressable
              onPress={() => {
                signOut();               // Clear auth
                router.replace("/login"); // Redirect to login screen
              }}
              style={styles.signOutBtn}
            >
              <Text style={styles.signOutTxt}>Sign Out</Text>
            </Pressable>
          </View>
        </View>

        {/* animated streak section */}
        <View style={styles.streakRow}>
          <Animated.View
            style={[
              styles.streakPill,
              {
                transform: [
                  {
                    // pill rotates continuously
                    rotate: streakAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.streakLabel}>day streak</Text>
          </Animated.View>

          {/* small stats displayed next to the streak */}
          <View style={styles.smallStats}>
            <Text style={styles.smallValue}>+3</Text>
            <Text style={styles.smallLabel}>workouts</Text>
          </View>
        </View>
      </LinearGradient>

      {/* main dashboard content below banner */}
      <View style={styles.content}>
        {/* three progress rings */}
        <View style={styles.ringsRow}>
          <ProgressRing size={92} progress={0.45} label="Daily" sub="45%" />
          <ProgressRing size={92} progress={0.6} label="Goal" sub="60%" />
          <ProgressRing size={92} progress={0.3} label="Move" sub="30%" />
        </View>

        {/* weekly bar chart card */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>This Week</Text>
          <WeeklyChart style={{ marginTop: 8 }} />
        </View>

        {/* quick actions */}
        <View style={styles.toolsCard}>
          <Text style={styles.cardTitle}>Quick Access</Text>

          <View style={styles.toolsRow}>
            <Pressable style={styles.toolBtn}>
              <Text style={styles.toolText}>Start Workout</Text>
            </Pressable>

            {/* GO TO CALORIES */}
            <Pressable
              style={styles.toolBtn}
              onPress={() => router.push("/(tabs)/calories")}
            >
              <Text style={styles.toolText}>Log Calories</Text>
            </Pressable>

            {/* GO TO LIBRARY */}
            <Pressable
              style={styles.toolBtn}
              onPress={() => router.push("/(tabs)/library")}
            >
              <Text style={styles.toolText}>View Library</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // root container
  safe: { flex: 1, backgroundColor: colors.background },

  // header gradient section
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  // greeting + avatar row
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greeting: { color: "#fff", fontSize: 26, fontWeight: "800" },
  date: { color: "rgba(255,255,255,0.85)", marginTop: 4 },

  avatar: { width: 64, height: 64 },

  // sign out button (small)
  signOutBtn: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 8,
  },
  signOutTxt: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // streak section row layout
  streakRow: {
    flexDirection: "row",
    marginTop: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },

  streakPill: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },

  streakLabel: { color: "rgba(255,255,255,0.9)", fontSize: 12 },

  smallStats: { alignItems: "flex-end" },
  smallValue: { color: "#fff", fontWeight: "800" },
  smallLabel: { color: "rgba(255,255,255,0.9)", fontSize: 12 },

  content: { padding: 20 },

  ringsRow: { flexDirection: "row", justifyContent: "space-between" },

  chartCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    elevation: 3,
  },

  cardTitle: { fontWeight: "800", fontSize: 16 },

  toolsCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
  },

  toolsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  toolBtn: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.cardBgLight,
    alignItems: "center",
  },

  toolText: { fontWeight: "700" },
});
