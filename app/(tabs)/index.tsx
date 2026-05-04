// @ts-nocheck
// HomeDashboard — Main screen users see after login.
// Shows daily stats, weekly chart, challenges, XP level, and quick nav.

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { Pedometer } from "expo-sensors";
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
import { useStreak } from "../../components/useStreak";
import colors from "../../constants/colors";

//constants
const { width } = Dimensions.get("window");
const BANNER_WIDTH = width - 40;

const GROUP_CHALLENGE_GOAL = 100000;          // Total steps goal for group challenge
const GROUP_TOTAL_KEY = "group_challenge_total_steps_demo";
const GROUP_LAST_UPDATED_KEY = "group_challenge_last_updated_demo";

// level definitions 
// each level has a name and the minimum XP needed to reach it
const LEVELS = [
  { name: "Rookie",     minXp: 0 },
  { name: "Consistent", minXp: 200 },
  { name: "Pro",        minXp: 1500 },
  { name: "Legend",     minXp: 6000 },
];

// day abbreviations indexed by getDay() (0 = Sunday)
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


export default function HomeDashboard() {
  const { user, signOut } = useAuth();
  const username = user?.name || "guest";
  const router = useRouter();
  const { streak, refreshStreak } = useStreak(username);
  // State 
  const [weeklyData, setWeeklyData]             = useState([]);   // Array of 7 days of stats
  const [tdee, setTdee]                         = useState(2000); // User's daily calorie target
  const [liveSteps, setLiveSteps]               = useState(0);    // Real-time step count from pedometer
  const [groupTotalSteps, setGroupTotalSteps]   = useState(0);    // Group challenge running total
  const [groupLastUpdated, setGroupLastUpdated] = useState("--");
  const [selectedDayIndex, setSelectedDayIndex] = useState(6);    // 6 = today (last in the 7-day array)
  const [xp, setXp]                             = useState(0);    // User's total XP points

  // convenience: the currently selected day's data object
  const selectedDay = weeklyData[selectedDayIndex] || {};

  // today's date as a readable string for the header
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Animation refs 
  const streakAnim       = useRef(new Animated.Value(0)).current; // Drives the rotating streak icon
  const animatedBars     = useRef<Animated.Value[]>([]);          // One value per bar in the week chart
  const animatedProgress = useRef(new Animated.Value(0)).current; // Drives the calorie ring fill

  // 1. STREAK ICON — loops a 360° rotation forever
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(streakAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 2. PEDOMETER — listens for live step count while screen is mounted
  useEffect(() => {
    let sub;

    const startPedometer = async () => {
      const available = await Pedometer.isAvailableAsync();
      if (!available) return;

      sub = Pedometer.watchStepCount((res) => {
        setLiveSteps(res.steps);
      });
    };

    startPedometer();
    return () => sub && sub.remove(); // clean up listener on unmount
  }, []);

  // 3. SAVE STEPS — whenever liveSteps changes, persist today's count to AsyncStorage
  useEffect(() => {
    const saveSteps = async () => {
      if (!user?.name) return;

      const todayKey = new Date().toISOString().split("T")[0]; // e.g. "2025-05-01"

      const existing = await AsyncStorage.getItem(`steps_${username}`);
      const parsed   = existing ? JSON.parse(existing) : {};

      parsed[todayKey] = liveSteps;

      await AsyncStorage.setItem(`steps_${username}`, JSON.stringify(parsed));
    };

    saveSteps();
  }, [liveSteps]);

  // 4. GROUP CHALLENGE — load banner data on mount, then refresh every 5 minutes
  useEffect(() => {
    loadGroupChallengeBannerData();
    const interval = setInterval(loadGroupChallengeBannerData, 300_000);
    return () => clearInterval(interval);
  }, []);

  // 5. CALORIE RING ANIMATION — smoothly animates the ring when progress changes
  const todayCalories = selectedDay.calories || 0;
  const progress = tdee > 0 ? Math.min(todayCalories / tdee, 1) : 0;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // 6. BAR CHART ANIMATION — springs each bar to its height when weeklyData loads
  useEffect(() => {
    //create one Animated.Value per day, all starting at 0
    animatedBars.current = weeklyData.map(() => new Animated.Value(0));

    Animated.parallel(
      weeklyData.map((item, i) =>
        Animated.spring(animatedBars.current[i], {
          toValue: item.progress,
          friction: 6,
          tension: 80,
          useNativeDriver: false,
        })
      )
    ).start();
  }, [weeklyData]);

  // DATA LOADERS
  // load the user's XP total from storage
  const loadXP = async () => {
    try {
      const storedXp = await AsyncStorage.getItem("challenge_current_xp");
      if (storedXp) setXp(Number(storedXp));
    } catch (e) {
      console.log("XP load error", e);
    }
  };

  // load the group challenge step total and last-updated timestamp
  const loadGroupChallengeBannerData = async () => {
    try {
      const [storedTotal, storedLastUpdated] = await Promise.all([
        AsyncStorage.getItem(GROUP_TOTAL_KEY),
        AsyncStorage.getItem(GROUP_LAST_UPDATED_KEY),
      ]);

      if (storedTotal)       setGroupTotalSteps(Number(storedTotal));
      if (storedLastUpdated) setGroupLastUpdated(storedLastUpdated);
    } catch {}
  };

  // build the 7-day stats array from AsyncStorage logs
  const loadWeeklyData = async () => {
    try {
      const [logs, targets, stepsData, workoutsData] = await Promise.all([
        AsyncStorage.getItem(`dailyLogs_${username}`),
        AsyncStorage.getItem("calorieTargets"),
        AsyncStorage.getItem(`steps_${username}`),
        AsyncStorage.getItem("workouts_user"),
      ]);

      // also check for a backend-cached group total 
      const groupData = await AsyncStorage.getItem(
        "group_challenge_total_steps_backend_cache"
      );
      if (groupData) setGroupTotalSteps(Number(groupData));

      const parsedLogs     = logs         ? JSON.parse(logs)         : {};
      const parsedTargets  = targets      ? JSON.parse(targets)       : {};
      const parsedSteps    = stepsData    ? JSON.parse(stepsData)     : {};
      const parsedWorkouts = workoutsData ? JSON.parse(workoutsData)  : {};

      const tdeeVal = parsedTargets?.tdee || 0;
      setTdee(tdeeVal);

      // build one entry for each of the last 7 days (index 0 = 6 days ago, index 6 = today)
      const days = [];

      for (let i = 6; i >= 0; i--) {
        const d   = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0]; // "YYYY-MM-DD"

        const dayLog   = parsedLogs[key] || [];
        const calories = dayLog.reduce(
          (sum, item) => sum + (Number(item.calories) || 0),
          0
        );

        days.push({
          day:      DAY_LABELS[d.getDay()],
          calories,
          scans:    dayLog.length,
          steps:    parsedSteps[key]    || 0,
          workouts: parsedWorkouts[key] || 0,
          // progress is 0–1, clamped — used to set the bar height in the chart
          progress:
            tdeeVal > 0
              ? Math.min(Math.max(calories / tdeeVal, 0), 1)
              : 0,
        });
      }

      setWeeklyData(days);
    } catch (e) {
      console.log(e);
    }
  };

  // reload data every time the screen comes into focus (e.g. returning from another tab)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.name) {
        loadWeeklyData();
        loadXP();
        refreshStreak();
      }
    }, [user])
  );

  // XP LEVEL CALCULATION
  //figures out which level the user is at and how far to the next one
  const levelIndex = LEVELS.findIndex((level, i) => {
    const next = LEVELS[i + 1];
    if (!next) return xp >= level.minXp;       // already at max level
    return xp >= level.minXp && xp < next.minXp;
  });

  const safeIndex    = levelIndex === -1 ? 0 : levelIndex;
  const currentLevel = LEVELS[safeIndex];
  const nextLevel    = LEVELS[safeIndex + 1] || currentLevel; // falls back to current at max level

  // 0–1 fraction of progress toward the next level
  const xpProgress =
    currentLevel.name === "Legend"
      ? 1
      : (xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp || 1);

  // how far along the shared 100k-step group challenge is (0–1)
  const groupProgressPercent = Math.min(groupTotalSteps / GROUP_CHALLENGE_GOAL, 1);

  // RENDER
  return (
    <SafeAreaView style={styles.safe}>

      {/*  Header gradient with greeting, avatar, and streak pill  */}
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
              onPress={() => { signOut(); router.replace("/login"); }}
              style={styles.signOutBtn}
            >
              <Text style={styles.signOutTxt}>Sign Out</Text>
            </Pressable>
          </View>
        </View>

        {/* Streak pill (rotates) + today's workout count */}
        <View style={styles.streakRow}>
          <Animated.View
            style={[
              styles.streakPill,
              {
                transform: [
                  {
                    scale: streakAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.streakLabel}>
  🔥 {streak > 0 ? `${streak} day streak` : "Start your streak"}
</Text>
          </Animated.View>

          <View style={styles.smallStats}>
            <Text style={styles.smallValue}>{selectedDay.workouts || 0}</Text>
            <Text style={styles.smallLabel}>workouts</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.contentContainer}>

        {/*  progress rings: Calories · Scans · Steps  */}
        <View style={styles.ringsRow}>
          <ProgressRing
            size={92}
            progress={animatedProgress}
            label="Calories"
            sub={`${selectedDay.calories || 0} cal`}
          />
          <ProgressRing
            size={92}
            progress={Math.min((selectedDay.scans || 0) / 3, 1)}
            label="Scans"
            sub={`${selectedDay.scans || 0}`}
          />
          <ProgressRing
            size={92}
            progress={Math.min((selectedDay.steps || 0) / 10000, 1)}
            label="Steps"
            sub={`${selectedDay.steps || 0}`}
            onPress={() => router.push("/group_challenges")}
          />
        </View>

        {/* XP level progress bar */}
        <View style={styles.xpCard}>
          <Text style={styles.xpTitle}>{`${currentLevel.name} • ${xp} XP`}</Text>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${Math.min(xpProgress * 100, 100)}%` }]} />
          </View>
          <Text style={styles.xpSub}>
            {currentLevel.name === "Legend"
              ? "Max level reached"
              : `${nextLevel.minXp - xp} XP to ${nextLevel.name}`}
          </Text>
        </View>

        {/*  daily challenge cards (horizontal scroll)  */}
        <View style={styles.challengeSection}>
          <Text style={styles.sectionTitle}>Daily Challenges</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannerScrollContent}
          >
            {/* challenge 1: 10K Steps */}
            <Pressable
              style={styles.challengeCard}
              onPress={() => router.push("/group_challenges")}
            >
              <View style={styles.bannerTextWrap}>
                <Text style={styles.challengeCardTitle}>10K Steps</Text>
                <Text style={styles.challengeCardSubtitle}>Walk 10,000 steps today</Text>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min((selectedDay.steps || 0) / 10000 * 100, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.bannerBadgeText}>{selectedDay.steps || 0} / 10,000</Text>
              </View>
            </Pressable>

            {/* challenge 2: Calorie Goal */}
            <Pressable
              style={styles.challengeCard}
              onPress={() => router.push("/(tabs)/calories")}
            >
              <View style={styles.bannerTextWrap}>
                <Text style={styles.challengeCardTitle}>Calorie Goal</Text>
                <Text style={styles.challengeCardSubtitle}>Stay within your target</Text>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(
                          tdee > 0 ? (selectedDay.calories || 0) / tdee * 100 : 0,
                          100
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.bannerBadgeText}>
                  {selectedDay.calories || 0} / {tdee}
                </Text>
              </View>
            </Pressable>

            {/* challenge 3: Food Logging */}
            <Pressable
              style={styles.challengeCard}
              onPress={() => router.push("/(tabs)/calories")}
            >
              <View style={styles.bannerTextWrap}>
                <Text style={styles.challengeCardTitle}>Food Logging</Text>
                <Text style={styles.challengeCardSubtitle}>Log at least 3 meals</Text>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(((selectedDay.scans || 0) / 3) * 100, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.bannerBadgeText}>{selectedDay.scans || 0} / 3 meals</Text>
              </View>
            </Pressable>
          </ScrollView>
        </View>

        {/*  weekly bar chart — tap a bar to select that day  */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>This Week</Text>

          <View style={styles.weekChart}>
            {weeklyData.map((item, index) => (
              <Pressable
                key={index}
                style={styles.dayBarWrap}
                onPress={() => setSelectedDayIndex(index)}
              >
                <View style={styles.barTrack}>
                  <Animated.View
                    style={[
                      styles.dayBar,
                      {
                        height: animatedBars.current[index]
                          ? animatedBars.current[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0%", "100%"],
                            })
                          : "0%",
                      },
                      selectedDayIndex === index && {
                        backgroundColor: "#42564F",
                        shadowColor: "#000",
                        shadowOpacity: 0.2,
                        shadowRadius: 6,
                        elevation: 4,
                        transform: [{ scale: 1.1 }], // 🔥 makes it grow
                      },
                    ]}
                  />
                </View>
                <Text style={styles.dayLabel}>{item.day}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/*  stat grid for the selected day  */}
        <View style={styles.dayStatsCard}>
          <Text style={styles.dayStatsTitle}>{selectedDay.day || "Today"}'s Stats</Text>

          <View style={styles.dayStatsGrid}>
            <View style={styles.dayStatBox}>
              <Text style={styles.dayStatValue}>{selectedDay.calories || 0}</Text>
              <Text style={styles.dayStatLabel}>Calories</Text>
            </View>
            <View style={styles.dayStatBox}>
              <Text style={styles.dayStatValue}>{selectedDay.scans || 0}</Text>
              <Text style={styles.dayStatLabel}>Food Scans</Text>
            </View>
            <View style={styles.dayStatBox}>
              <Text style={styles.dayStatValue}>{selectedDay.steps || 0}</Text>
              <Text style={styles.dayStatLabel}>Steps</Text>
            </View>
            <View style={styles.dayStatBox}>
              <Text style={styles.dayStatValue}>{selectedDay.workouts || 0}</Text>
              <Text style={styles.dayStatLabel}>Workouts</Text>
            </View>
          </View>
        </View>

        {/*  Quick-access buttons to main tabs  */}
        <View style={styles.toolsCard}>
          <Text style={styles.cardTitle}>Quick Access</Text>

          <View style={styles.toolsGrid}>
            <Pressable style={styles.toolBtn} onPress={() => router.push("/(tabs)/calories")}>
              <Ionicons name="barcode-outline" size={22} color="#42564F" />
              <Text style={styles.toolText}>Calories</Text>
            </Pressable>

            <Pressable style={styles.toolBtn} onPress={() => router.push("/(tabs)/workout")}>
              <Ionicons name="barbell-outline" size={22} color="#42564F" />
              <Text style={styles.toolText}>Workout</Text>
            </Pressable>

            <Pressable style={styles.toolBtn} onPress={() => router.push("/group_challenges")}>
              <Ionicons name="walk-outline" size={22} color="#42564F" />
              <Text style={styles.toolText}>Steps</Text>
            </Pressable>

            <Pressable style={styles.toolBtn} onPress={() => router.push("/challenges")}>
              <Ionicons name="trophy-outline" size={22} color="#42564F" />
              <Text style={styles.toolText}>Challenges</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}


// STYLES

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // green gradient header at the top
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

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  ringsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  //  Challenge cards 
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

  bannerBadgeText: {
    fontSize: 12,
    fontWeight: "700",
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

  //  Weekly bar chart 
  chartCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    elevation: 3,
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
    backgroundColor: "#42564F", // darker green for the selected day's bar
  },

  dayLabel: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
  },

  //  Selected day stat grid ─
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

  //  quick access buttons 
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

  //  XP level bar 
  xpCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginTop: 14,
  },

  xpTitle: {
    fontWeight: "800",
    color: "#2F4F3E",
    marginBottom: 6,
  },

  xpBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },

  xpFill: {
    height: "100%",
    backgroundColor: "#6B8A82",
  },

  xpSub: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
  },
});