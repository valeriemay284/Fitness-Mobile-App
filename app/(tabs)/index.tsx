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

// constants
const { width } = Dimensions.get("window");

const GROUP_CHALLENGE_GOAL = 100000;
const GROUP_TOTAL_KEY = "group_challenge_total_steps_demo";
const GROUP_LAST_UPDATED_KEY = "group_challenge_last_updated_demo";

const LEVELS = [
  { name: "Rookie",      minXp: 0 },
  { name: "Consistent",  minXp: 200 },
  { name: "Pro",         minXp: 1500 },
  { name: "Legend",      minXp: 6000 },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


export default function HomeDashboard() {
  const { user, signOut } = useAuth();
  const username = user?.name || "guest";
  const router = useRouter();
  const { streak, refreshStreak } = useStreak(username);

  const [weeklyData, setWeeklyData]             = useState([]);
  const [tdee, setTdee]                         = useState(2000);
  const [liveSteps, setLiveSteps]               = useState(0);
  const [groupTotalSteps, setGroupTotalSteps]   = useState(0);
  const [groupLastUpdated, setGroupLastUpdated] = useState("--");
  const [selectedDayIndex, setSelectedDayIndex] = useState(6);
  const [xp, setXp]                             = useState(0);

  // ─── Single source of truth for today's steps ────────────────────────────
  // liveSteps comes from the pedometer (resets to 0 on mount until the sensor
  // fires). storedTodaySteps comes from weeklyData once loaded. We always take
  // the larger value so a late-loading weeklyData never clobbers a live count.
  const storedTodaySteps = weeklyData[6]?.steps || 0;
  const todaySteps = Math.max(storedTodaySteps, liveSteps);

  // Patch today's slot so everything downstream (rings, bars, stat grid) is
  // driven by todaySteps — no component reads liveSteps directly.
  const displayWeeklyData = weeklyData.map((day, i) => {
    if (i !== 6) return day;
    return { ...day, steps: todaySteps };
  });

  const selectedDay = displayWeeklyData[selectedDayIndex] || {};

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Animation refs
  const streakAnim       = useRef(new Animated.Value(0)).current;
  const animatedBars     = useRef<Animated.Value[]>([]);
  const animatedProgress = useRef(new Animated.Value(0)).current;

  // 1. STREAK ICON — pulse scale loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(streakAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // 2. PEDOMETER
  // watchStepCount only counts steps since the app session opened — it resets
  // every time the app restarts. Instead we use getStepCountAsync to read the
  // true day total (midnight → now) on mount, then re-query on every watcher
  // tick so the displayed number is always the full day count.
  useEffect(() => {
    let sub;

    const fetchDayTotal = async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      try {
        const result = await Pedometer.getStepCountAsync(start, new Date());
        if (result?.steps != null) setLiveSteps(result.steps);
      } catch (e) {
        console.log("getStepCountAsync error", e);
      }
    };

    const startPedometer = async () => {
      const available = await Pedometer.isAvailableAsync();
      if (!available) return;

      // Seed with today's total immediately on mount
      await fetchDayTotal();

      // On every new step event, re-query the full day range instead of
      // trusting the session-delta in res.steps
      sub = Pedometer.watchStepCount(() => fetchDayTotal());
    };

    startPedometer();
    return () => sub && sub.remove();
  }, []);

  // 3. SAVE STEPS — only persist when pedometer has actually fired (> 0).
  //    getStepCountAsync gives the true day total so no max() guard needed.
  useEffect(() => {
    const saveSteps = async () => {
      if (!user?.name || liveSteps === 0) return;
      const todayKey = new Date().toISOString().split("T")[0];
      const existing = await AsyncStorage.getItem(`steps_${username}`);
      const parsed   = existing ? JSON.parse(existing) : {};
      parsed[todayKey] = liveSteps;
      await AsyncStorage.setItem(`steps_${username}`, JSON.stringify(parsed));
    };
    saveSteps();
  }, [liveSteps]);


  // 4. GROUP CHALLENGE polling
  useEffect(() => {
    let cancelled = false;
  
    const load = async () => {
      if (!cancelled) await loadGroupChallengeBannerData();
    };
  
    load();
  
    const interval = setInterval(load, 300_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadGroupChallengeBannerData]);

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

  // 6. BAR CHART ANIMATION — uses displayWeeklyData so bars reflect live steps
  useEffect(() => {
    animatedBars.current = displayWeeklyData.map(() => new Animated.Value(0));
    Animated.parallel(
      displayWeeklyData.map((item, i) =>
        Animated.spring(animatedBars.current[i], {
          toValue: item.progress,
          friction: 6,
          tension: 80,
          useNativeDriver: false,
        })
      )
    ).start();
  }, [weeklyData, todaySteps]);

  // DATA LOADERS
  const loadXP = async () => {
    try {
      const storedXp = await AsyncStorage.getItem("challenge_current_xp");
      if (storedXp) setXp(Number(storedXp));
    } catch (e) {
      console.log("XP load error", e);
    }
  };

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

  const loadWeeklyData = async () => {
    try {
      const [logs, targets, stepsData, workoutsData] = await Promise.all([
        AsyncStorage.getItem(`dailyLogs_${username}`),
        AsyncStorage.getItem("calorieTargets"),
        AsyncStorage.getItem(`steps_${username}`),
        AsyncStorage.getItem("workouts_user"),
      ]);

      const groupData = await AsyncStorage.getItem(
        "group_challenge_total_steps_backend_cache"
      );
      if (groupData) setGroupTotalSteps(Number(groupData));

      const parsedLogs     = logs         ? JSON.parse(logs)        : {};
      const parsedTargets  = targets      ? JSON.parse(targets)      : {};
      const parsedSteps    = stepsData    ? JSON.parse(stepsData)    : {};
      const parsedWorkouts = workoutsData ? JSON.parse(workoutsData) : {};

      const tdeeVal = parsedTargets?.tdee || 0;
      setTdee(tdeeVal);

      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d   = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];

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
  const levelIndex = LEVELS.findIndex((level, i) => {
    const next = LEVELS[i + 1];
    if (!next) return xp >= level.minXp;
    return xp >= level.minXp && xp < next.minXp;
  });
  const safeIndex    = levelIndex === -1 ? 0 : levelIndex;
  const currentLevel = LEVELS[safeIndex];
  const nextLevel    = LEVELS[safeIndex + 1] || currentLevel;
  const xpProgress   =
    currentLevel.name === "Legend"
      ? 1
      : (xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp || 1);

  const groupProgressPercent = Math.min(groupTotalSteps / GROUP_CHALLENGE_GOAL, 1);

  // RENDER
  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header — matches login's #DDECC8 green palette ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name || "Friend"} 👋</Text>
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

        {/* streak pill + workout count */}
        <View style={styles.streakRow}>
          <Animated.View
            style={[
              styles.streakPill,
              {
                transform: [
                  {
                    scale: streakAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.08],
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
      </View>

      {/* ── Cream scroll body — matches login card colour #F7F6E7 ── */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.contentContainer}
      >

        {/* Progress rings */}
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
          {/* Steps ring uses live-merged value from displayWeeklyData */}
          <ProgressRing
            size={92}
            progress={Math.min((selectedDay.steps || 0) / 10000, 1)}
            label="Steps"
            sub={`${selectedDay.steps || 0}`}
            onPress={() => router.push("/group_challenges")}
          />
        </View>

        {/* XP level bar */}
        <View style={styles.xpCard}>
          <Text style={styles.xpTitle}>{`${currentLevel.name} · ${xp} XP`}</Text>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${Math.min(xpProgress * 100, 100)}%` }]} />
          </View>
          <Text style={styles.xpSub}>
            {currentLevel.name === "Legend"
              ? "Max level reached"
              : `${nextLevel.minXp - xp} XP to ${nextLevel.name}`}
          </Text>
        </View>

        {/* Daily challenge cards */}
        <View style={styles.challengeSection}>
          <Text style={styles.sectionTitle}>Daily Challenges</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannerScrollContent}
          >
            {/* 10K Steps — reads from displayWeeklyData so it's always live */}
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
                      {
                        width: `${Math.min(
                          (displayWeeklyData[6]?.steps || 0) / 10000 * 100,
                          100
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.bannerBadgeText}>
                  {displayWeeklyData[6]?.steps || 0} / 10,000
                </Text>
              </View>
            </Pressable>

            {/* Calorie Goal */}
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
                          tdee > 0
                            ? (displayWeeklyData[6]?.calories || 0) / tdee * 100
                            : 0,
                          100
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.bannerBadgeText}>
                  {displayWeeklyData[6]?.calories || 0} / {tdee}
                </Text>
              </View>
            </Pressable>

            {/* Food Logging */}
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
                      {
                        width: `${Math.min(
                          ((displayWeeklyData[6]?.scans || 0) / 3) * 100,
                          100
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.bannerBadgeText}>
                  {displayWeeklyData[6]?.scans || 0} / 3 meals
                </Text>
              </View>
            </Pressable>
          </ScrollView>
        </View>

        {/* Weekly bar chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>This Week</Text>

          <View style={styles.weekChart}>
            {displayWeeklyData.map((item, index) => (
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
        </View>

        {/* Selected day stat grid */}
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

        {/* Quick access */}
        <View style={styles.toolsCard}>
          <Text style={styles.cardTitle}>Quick Access</Text>

          <View style={styles.toolsGrid}>
            <Pressable
              style={styles.toolBtn}
              onPress={() => router.push("/(tabs)/calories")}
            >
              <Ionicons name="barcode-outline" size={22} color="#42564F" />
              <Text style={styles.toolText}>Calories</Text>
            </Pressable>

            <Pressable
              style={styles.toolBtn}
              onPress={() => router.push("/(tabs)/workout")}
            >
              <Ionicons name="barbell-outline" size={22} color="#42564F" />
              <Text style={styles.toolText}>Workout</Text>
            </Pressable>

            <Pressable
              style={styles.toolBtn}
              onPress={() => router.push("/group_challenges")}
            >
              <Ionicons name="walk-outline" size={22} color="#42564F" />
              <Text style={styles.toolText}>Steps</Text>
            </Pressable>

            <Pressable
              style={styles.toolBtn}
              onPress={() => router.push("/challenges")}
            >
              <Ionicons name="trophy-outline" size={22} color="#42564F" />
              <Text style={styles.toolText}>Challenges</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}


// ── STYLES ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#DDECC8", // matches login screen hero bg
  },

  // ── Header — same green as login hero ──────────────────────────────────────
  header: {
    backgroundColor: "#DDECC8",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greeting: {
    color: "#2F4F3E",
    fontSize: 26,
    fontWeight: "800",
  },

  date: {
    color: "#4B6354",
    marginTop: 4,
    fontSize: 14,
  },

  avatar: {
    width: 64,
    height: 64,
  },

  signOutBtn: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(66,86,79,0.1)", // matches login heroBadge
    borderRadius: 8,
  },

  signOutTxt: {
    color: "#42564F",
    fontSize: 12,
    fontWeight: "700",
  },

  streakRow: {
    flexDirection: "row",
    marginTop: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },

  streakPill: {
    backgroundColor: "rgba(66,86,79,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },

  streakLabel: {
    color: "#2F4F3E",
    fontSize: 13,
    fontWeight: "700",
  },

  smallStats: {
    alignItems: "flex-end",
  },

  smallValue: {
    color: "#2F4F3E",
    fontWeight: "800",
    fontSize: 16,
  },

  smallLabel: {
    color: "#4B6354",
    fontSize: 12,
  },

  // ── Scroll body — cream card bg, rounded top corners like login ─────────────
  scrollBody: {
    flex: 1,
    backgroundColor: "#F7F6E7",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  ringsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },

  // ── XP card ────────────────────────────────────────────────────────────────
  xpCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#E2E8D9",
  },

  xpTitle: {
    fontWeight: "800",
    color: "#2F4F3E",
    marginBottom: 6,
  },

  xpBar: {
    height: 8,
    backgroundColor: "#E2E8D9",
    borderRadius: 999,
    overflow: "hidden",
  },

  xpFill: {
    height: "100%",
    backgroundColor: "#42564F",
    borderRadius: 999,
  },

  xpSub: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
  },

  // ── Challenge cards ────────────────────────────────────────────────────────
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
    width: width * 0.62,
    marginRight: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#DDECC8", // matches header / login hero
    borderWidth: 1,
    borderColor: "#C8DFB2",
  },

  bannerTextWrap: {
    flex: 1,
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

  progressBarTrack: {
    marginTop: 10,
    marginBottom: 6,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(66,86,79,0.12)",
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#42564F",
  },

  bannerBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2F4F3E",
  },

  // ── Weekly bar chart ───────────────────────────────────────────────────────
  chartCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8D9",
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
    backgroundColor: "#E2E8D9",
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
    fontWeight: "600",
  },

  dayLabelActive: {
    color: "#42564F",
    fontWeight: "800",
  },

  // ── Selected day stats ─────────────────────────────────────────────────────
  dayStatsCard: {
    marginTop: 16,
    backgroundColor: "#DDECC8",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C8DFB2",
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
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8D9",
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

  // ── Quick access ───────────────────────────────────────────────────────────
  toolsCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8D9",
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
    borderRadius: 14,
    backgroundColor: "#F7F6E7",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8D9",
  },

  toolText: {
    fontWeight: "700",
    color: "#2F4F3E",
    textAlign: "center",
  },
});
