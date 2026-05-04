// @ts-nocheck

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../components/AuthContext";
import ProgressRing from "../../components/ProgressRing";
import colors from "../../constants/colors";

const { width } = Dimensions.get("window");
const BANNER_WIDTH = width - 40;

const GROUP_CHALLENGE_GOAL = 100000;
const GROUP_TOTAL_KEY = "group_challenge_total_steps_demo";
const GROUP_LAST_UPDATED_KEY = "group_challenge_last_updated_demo";

const weeklyDemoData = [
  { day: "Mon", workouts: 1, calories: 430, steps: 6240, scans: 2, progress: 0.55 },
  { day: "Tue", workouts: 0, calories: 210, steps: 3820, scans: 1, progress: 0.35 },
  { day: "Wed", workouts: 1, calories: 510, steps: 7200, scans: 3, progress: 0.7 },
  { day: "Thu", workouts: 0, calories: 180, steps: 2950, scans: 1, progress: 0.28 },
  { day: "Fri", workouts: 1, calories: 620, steps: 8100, scans: 4, progress: 0.82 },
  { day: "Sat", workouts: 2, calories: 750, steps: 10150, scans: 5, progress: 1 },
  { day: "Sun", workouts: 0, calories: 300, steps: 4600, scans: 2, progress: 0.45 },
];

export default function HomeDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [groupTotalSteps, setGroupTotalSteps] = useState(0);
  const [groupLastUpdated, setGroupLastUpdated] = useState("--");
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

  const selectedDay = weeklyDemoData[selectedDayIndex];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const streakAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  useEffect(() => {
    loadGroupChallengeBannerData();

    const interval = setInterval(() => {
      loadGroupChallengeBannerData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadGroupChallengeBannerData = async () => {
    try {
      const [storedTotal, storedLastUpdated] = await Promise.all([
        AsyncStorage.getItem(GROUP_TOTAL_KEY),
        AsyncStorage.getItem(GROUP_LAST_UPDATED_KEY),
      ]);

      if (storedTotal) setGroupTotalSteps(Number(storedTotal));
      if (storedLastUpdated) setGroupLastUpdated(storedLastUpdated);
    } catch (error) {
      console.log("Error loading group challenge banner:", error);
    }
  };

  const groupProgressPercent = Math.min(
    groupTotalSteps / GROUP_CHALLENGE_GOAL,
    1
  );

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name || "Friend"}</Text>
            <Text style={styles.date}>{today}</Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <Image
              source={require("../../assets/panda-stretch.png")}
              style={styles.avatar}
            />

            <Pressable
              onPress={() => {
                signOut();
                router.replace("/login");
              }}
              style={styles.signOutBtn}
            >
              <Text style={styles.signOutTxt}>Sign Out</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.streakRow}>
          <Animated.View
            style={[
              styles.streakPill,
              {
                transform: [
                  {
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

          <View style={styles.smallStats}>
            <Text style={styles.smallValue}>+3</Text>
            <Text style={styles.smallLabel}>workouts</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ringsRow}>
          <ProgressRing size={92} progress={0.45} label="Daily" sub="45%" />
          <ProgressRing size={92} progress={0.6} label="Goal" sub="60%" />
          <ProgressRing size={92} progress={0.3} label="Move" sub="30%" />
        </View>

        <View style={styles.challengeSection}>
          <Text style={styles.sectionTitle}>Challenges</Text>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={BANNER_WIDTH + 12}
            contentContainerStyle={styles.bannerScrollContent}
          >
            <Pressable
              style={[styles.challengeCard, { width: BANNER_WIDTH }]}
              onPress={() => router.push("/challenges")}
            >
              <View style={styles.bannerTextWrap}>
                <Text style={styles.challengeCardTitle}>Daily Challenges</Text>
                <Text style={styles.challengeCardSubtitle}>
                  Complete today’s challenges and earn XP!
                </Text>

                <View style={styles.bannerBadge}>
                  <Text style={styles.bannerBadgeText}>Personal</Text>
                </View>
              </View>

              <Text style={styles.challengeCardArrow}>›</Text>
            </Pressable>

            <Pressable
              style={[
                styles.challengeCard,
                styles.groupCard,
                { width: BANNER_WIDTH },
              ]}
              onPress={() => router.push("/group-challenge")}
            >
              <View style={styles.bannerTextWrap}>
                <Text style={styles.challengeCardTitle}>Group Challenge</Text>
                <Text style={styles.challengeCardSubtitle}>
                  Join the 100,000 step community challenge and contribute your
                  steps.
                </Text>

                <View style={styles.groupProgressRow}>
                  <Text style={styles.groupProgressText}>
                    {groupTotalSteps.toLocaleString()} /{" "}
                    {GROUP_CHALLENGE_GOAL.toLocaleString()} steps
                  </Text>
                  <Text style={styles.groupProgressPercent}>
                    {Math.round(groupProgressPercent * 100)}%
                  </Text>
                </View>

                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${groupProgressPercent * 100}%` },
                    ]}
                  />
                </View>

                <Text style={styles.groupUpdatedText}>
                  Updates every 5 min • Last: {groupLastUpdated}
                </Text>

                <View style={styles.bannerBadge}>
                  <Text style={styles.bannerBadgeText}>Community</Text>
                </View>
              </View>

              <Text style={styles.challengeCardArrow}>›</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>This Week</Text>
            <Text style={styles.chartHint}>Tap a day</Text>
          </View>

          <View style={styles.weekChart}>
            {weeklyDemoData.map((item, index) => (
              <Pressable
                key={item.day}
                style={styles.dayBarWrap}
                onPress={() => setSelectedDayIndex(index)}
              >
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.dayBar,
                      {
                        height: `${item.progress * 100}%`,
                      },
                      selectedDayIndex === index && styles.dayBarActive,
                    ]}
                  />
                </View>

                <Text
                  style={[
                    styles.dayLabel,
                    selectedDayIndex === index && styles.dayLabelActive,
                  ]}
                >
                  {item.day}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.dayStatsCard}>
            <Text style={styles.dayStatsTitle}>{selectedDay.day}'s Stats</Text>

            <View style={styles.dayStatsGrid}>
              <View style={styles.dayStatBox}>
                <Text style={styles.dayStatValue}>{selectedDay.workouts}</Text>
                <Text style={styles.dayStatLabel}>Workouts</Text>
              </View>

              <View style={styles.dayStatBox}>
                <Text style={styles.dayStatValue}>
                  {selectedDay.calories}
                </Text>
                <Text style={styles.dayStatLabel}>Calories</Text>
              </View>

              <View style={styles.dayStatBox}>
                <Text style={styles.dayStatValue}>
                  {selectedDay.steps.toLocaleString()}
                </Text>
                <Text style={styles.dayStatLabel}>Steps</Text>
              </View>

              <View style={styles.dayStatBox}>
                <Text style={styles.dayStatValue}>{selectedDay.scans}</Text>
                <Text style={styles.dayStatLabel}>Food Scans</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.toolsCard}>
          <Text style={styles.cardTitle}>Quick Access</Text>

          <View style={styles.toolsGrid}>
            <Pressable
              style={styles.toolBtn}
              onPress={() => router.push("/(tabs)/workout")}
            >
              <Ionicons name="barbell-outline" size={22} color="#42564F" />
              <Text style={styles.toolText}>Start Workout</Text>
            </Pressable>

            <Pressable
              style={styles.toolBtn}
              onPress={() => router.push("/calories")}
            >
              <Ionicons name="barcode-outline" size={22} color="#42564F" />
              <Text style={styles.toolText}>Calories</Text>
            </Pressable>

            <Pressable
              style={styles.toolBtn}
              onPress={() => router.push("/challenges")}
            >
              <Ionicons name="trophy-outline" size={22} color="#42564F" />
              <Text style={styles.toolText}>Challenges</Text>
            </Pressable>

            <Pressable
              style={styles.toolBtn}
              onPress={() => router.push("/group-challenge")}
            >
              <Ionicons name="people-outline" size={22} color="#42564F" />
              <Text style={styles.toolText}>Group Challenge</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greeting: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },

  date: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },

  avatar: {
    width: 64,
    height: 64,
  },

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

  streakLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
  },

  smallStats: {
    alignItems: "flex-end",
  },

  smallValue: {
    color: "#fff",
    fontWeight: "800",
  },

  smallLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  ringsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  challengeSection: {
    marginTop: 18,
  },

  sectionTitle: {
    fontWeight: "800",
    fontSize: 18,
    color: "#2F4F3E",
    marginBottom: 12,
  },

  bannerScrollContent: {
    paddingRight: 12,
  },

  challengeCard: {
    marginRight: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#EAF4DD",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  groupCard: {
    backgroundColor: "#DDECC8",
  },

  bannerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },

  challengeCardTitle: {
    fontWeight: "800",
    fontSize: 16,
    color: "#2F4F3E",
  },

  challengeCardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#4B6354",
    lineHeight: 18,
  },

  challengeCardArrow: {
    fontSize: 26,
    fontWeight: "400",
    color: "#2F4F3E",
  },

  bannerBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "rgba(47,79,62,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  bannerBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2F4F3E",
  },

  groupProgressRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  groupProgressText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2F4F3E",
  },

  groupProgressPercent: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2F4F3E",
  },

  progressBarTrack: {
    marginTop: 8,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)",
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#6B8A82",
  },

  groupUpdatedText: {
    marginTop: 8,
    fontSize: 12,
    color: "#4B6354",
  },

  chartCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    elevation: 3,
  },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  chartHint: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },

  cardTitle: {
    fontWeight: "800",
    fontSize: 16,
    color: "#2F4F3E",
  },

  weekChart: {
    marginTop: 18,
    height: 150,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  dayBarWrap: {
    alignItems: "center",
    width: `${100 / 7}%`,
  },

  barTrack: {
    height: 110,
    width: 18,
    borderRadius: 999,
    backgroundColor: "#EEF3EA",
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  dayBar: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: "#AFC79B",
  },

  dayBarActive: {
    backgroundColor: "#42564F",
  },

  dayLabel: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
  },

  dayLabelActive: {
    color: "#2F4F3E",
  },

  dayStatsCard: {
    marginTop: 16,
    backgroundColor: "#F7F6E7",
    borderRadius: 14,
    padding: 14,
  },

  dayStatsTitle: {
    fontWeight: "800",
    fontSize: 15,
    color: "#2F4F3E",
    marginBottom: 12,
  },

  dayStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  dayStatBox: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },

  dayStatValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#42564F",
  },

  dayStatLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },

  toolsCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
  },

  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 12,
  },

  toolBtn: {
    width: "48%",
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.cardBgLight,
    alignItems: "center",
    gap: 6,
  },

  toolText: {
    fontWeight: "700",
    color: "#2F4F3E",
    textAlign: "center",
  },
});