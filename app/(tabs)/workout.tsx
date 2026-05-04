import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// types
type MuscleGroup = "All" | "Chest" | "Legs" | "Core" | "Arms";

const muscleGroups: MuscleGroup[] = ["All", "Chest", "Legs", "Core", "Arms"];

const workouts = [
  {
    id: "pushup",
    name: "Push-Up",
    target: "Chest, shoulders, triceps",
    group: "Chest",
    difficulty: "Beginner",
    equipment: "Bodyweight",
    sets: "3 sets × 12 reps",
    demo: require("../../assets/workouts/pushup.gif"),
    tip: "Keep your body in a straight line and avoid letting your hips sag.",
  },
  {
    id: "benchpress",
    name: "Bench Press",
    target: "Chest, shoulders, triceps",
    group: "Chest",
    difficulty: "Intermediate",
    equipment: "Barbell",
    sets: "4 sets × 8 reps",
    demo: require("../../assets/workouts/benchpress.gif"),
    tip: "Keep your feet planted and lower the bar with control.",
  },
  {
    id: "squat",
    name: "Squat",
    target: "Legs, glutes, core",
    group: "Legs",
    difficulty: "Beginner",
    equipment: "Bodyweight",
    sets: "3 sets × 15 reps",
    demo: require("../../assets/workouts/squat.gif"),
    tip: "Keep your chest up and drive through your heels.",
  },
];

export default function Workout() {
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup>("All");
  const [selectedWorkout, setSelectedWorkout] = useState(workouts[0]);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const filteredWorkouts =
    selectedGroup === "All"
      ? workouts
      : workouts.filter((w) => w.group === selectedGroup);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m < 10 ? "0" : ""}${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const startWorkout = async () => {
    setSeconds(0);
    setIsRunning(true);

    const today = new Date().toISOString().split("T")[0];
    const key = "workouts_user";

    const existing = await AsyncStorage.getItem(key);
    const parsed = existing ? JSON.parse(existing) : {};
    parsed[today] = (parsed[today] || 0) + 1;

    await AsyncStorage.setItem(key, JSON.stringify(parsed));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#DDECC8" }}>
      
      {/* HERO */}
      <View style={styles.hero}>
        <Text style={styles.heroBadge}>WORKOUT</Text>
        <Text style={styles.heroTitle}>Let’s train 💪</Text>
        <Text style={styles.heroSub}>
          Pick an exercise and track your progress
        </Text>
      </View>

      {/* MAIN CARD */}
      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* TIMER */}
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>
              {selectedWorkout.name} Timer
            </Text>

            <Animated.Text
              style={[styles.timerText, { transform: [{ scale: pulseAnim }] }]}
            >
              {formatTime(seconds)}
            </Animated.Text>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setIsRunning(!isRunning)}
              >
                <Text style={styles.btnText}>
                  {isRunning ? "Pause" : "Start"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  setIsRunning(false);
                  setSeconds(0);
                }}
              >
                <Text style={styles.secondaryText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FILTER */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {muscleGroups.map((g) => {
              const active = g === selectedGroup;
              return (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? "#42564F" : "#fff" },
                  ]}
                  onPress={() => setSelectedGroup(g)}
                >
                  <Text style={{ color: active ? "#fff" : "#2F4F3E" }}>
                    {g}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* LIST */}
          {filteredWorkouts.map((w) => {
            const selected = w.id === selectedWorkout.id;
            return (
              <TouchableOpacity
                key={w.id}
                style={[
                  styles.workout,
                  { backgroundColor: selected ? "#42564F" : "#fff" },
                ]}
                onPress={() => setSelectedWorkout(w)}
              >
                <Text
                  style={{
                    fontWeight: "800",
                    color: selected ? "#fff" : "#2F4F3E",
                  }}
                >
                  {w.name}
                </Text>
                <Text
                  style={{
                    color: selected ? "#eee" : "#4B6354",
                  }}
                >
                  {w.target}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* DETAIL */}
          <View style={styles.detail}>
            <Text style={styles.detailTitle}>
              {selectedWorkout.name}
            </Text>

            <Image source={selectedWorkout.demo} style={styles.img} />

            <TouchableOpacity style={styles.primaryBtn} onPress={startWorkout}>
              <Text style={styles.btnText}>Start Workout</Text>
            </TouchableOpacity>

            <Text style={styles.tip}>{selectedWorkout.tip}</Text>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 10,
  },
  heroBadge: {
    backgroundColor: "rgba(66,86,79,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontWeight: "800",
    color: "#42564F",
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2F4F3E",
  },
  heroSub: {
    color: "#4B6354",
    fontSize: 14,
  },

  card: {
    flex: 1,
    backgroundColor: "#F7F6E7",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },

  timerCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  timerLabel: {
    fontWeight: "800",
    color: "#42564F",
  },
  timerText: {
    fontSize: 42,
    fontWeight: "900",
    marginVertical: 10,
    color: "#2F4F3E",
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: "#42564F",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: "#E2E8D9",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryText: {
    fontWeight: "800",
    color: "#2F4F3E",
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 15,
  },

  workout: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
  },

  detail: {
    marginTop: 20,
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2F4F3E",
    marginBottom: 10,
  },

  img: {
    width: "100%",
    height: 200,
    marginBottom: 12,
  },

  tip: {
    marginTop: 10,
    color: "#4B6354",
  },
});