import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../components/AuthContext";
import ProgressRing from "../../components/ProgressRing";
import WeeklyChart from "../../components/WeeklyChart";
import colors from "../../constants/colors";

const { width } = Dimensions.get("window");

export default function HomeDashboard() {
  // get the logged-in user from AuthContext
  const { user } = useAuth() as any;

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
        {/* left: greeting and date — right: panda avatar */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name || "Friend"} </Text>
            <Text style={styles.date}>{today}</Text>
          </View>

          <Image
            source={require("../../assets/panda.png")}
            style={styles.avatar}
          />
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

            <Pressable style={styles.toolBtn}>
              <Text style={styles.toolText}>Log Calories</Text>
            </Pressable>

            <Pressable style={styles.toolBtn}>
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

  // greeting text
  greeting: { color: "#fff", fontSize: 26, fontWeight: "800" },

  // date under greeting
  date: { color: "rgba(255,255,255,0.85)", marginTop: 4 },

  // panda image
  avatar: { width: 64, height: 64 },

  // streak section row layout
  streakRow: {
    flexDirection: "row",
    marginTop: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },

  // animated pill showing streak
  streakPill: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },

  streakNumber: { color: "#fff", fontSize: 18, fontWeight: "800" },
  streakLabel: { color: "rgba(255,255,255,0.9)", fontSize: 12 },

  // right side small stats
  smallStats: { alignItems: "flex-end" },
  smallValue: { color: "#fff", fontWeight: "800" },
  smallLabel: { color: "rgba(255,255,255,0.9)", fontSize: 12 },

  // content section under header
  content: { padding: 20 },

  // ring layout
  ringsRow: { flexDirection: "row", justifyContent: "space-between" },

  // weekly chart card styling
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

  // quick tools card
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

  // button for each quick action
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
