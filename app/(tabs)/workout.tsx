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
import colors from "../../constants/colors";

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
      : workouts.filter((workout) => workout.group === selectedGroup);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (isRunning) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isRunning, pulseAnim]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${mins < 10 ? `0${mins}` : mins}:${
      secs < 10 ? `0${secs}` : secs
    }`;
  };

  const startSelectedWorkout = () => {
    setSeconds(0);
    setIsRunning(true);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <View style={styles.container}>
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.text }]}>Workout</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Pick a muscle group, choose an exercise, and track your session.
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.timerCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.timerLabel, { color: colors.primaryDark }]}>
              {selectedWorkout.name} Timer
            </Text>

            <Animated.Text
              style={[
                styles.timerText,
                {
                  color: colors.text,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              {formatTime(seconds)}
            </Animated.Text>

            <View style={styles.timerButtonRow}>
              <TouchableOpacity
                style={[
                  styles.timerButton,
                  { backgroundColor: colors.primaryDark },
                ]}
                onPress={() => setIsRunning((prev) => !prev)}
                activeOpacity={0.85}
              >
                <Text style={styles.timerButtonText}>
                  {isRunning ? "Pause" : "Start"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.timerButton,
                  { backgroundColor: colors.cardBgLight || "#dfe6d8" },
                ]}
                onPress={() => {
                  setIsRunning(false);
                  setSeconds(0);
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.resetButtonText, { color: colors.text }]}>
                  Reset
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            Target Muscle
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {muscleGroups.map((group) => {
              const active = selectedGroup === group;

              return (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active
                        ? colors.primaryDark
                        : colors.cardBg,
                    },
                  ]}
                  onPress={() => {
                    setSelectedGroup(group);

                    const firstMatch =
                      group === "All"
                        ? workouts[0]
                        : workouts.find((workout) => workout.group === group);

                    if (firstMatch) setSelectedWorkout(firstMatch);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? "#fff" : colors.text },
                    ]}
                  >
                    {group}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.listContainer}>
            {filteredWorkouts.map((workout) => {
              const isSelected = selectedWorkout.id === workout.id;

              return (
                <TouchableOpacity
                  key={workout.id}
                  style={[
                    styles.workoutButton,
                    {
                      backgroundColor: isSelected
                        ? colors.primaryDark
                        : colors.cardBg,
                    },
                  ]}
                  onPress={() => setSelectedWorkout(workout)}
                  activeOpacity={0.85}
                >
                  <View style={styles.workoutTopRow}>
                    <Text
                      style={[
                        styles.workoutButtonText,
                        { color: isSelected ? "#fff" : colors.text },
                      ]}
                    >
                      {workout.name}
                    </Text>

                    <Text
                      style={[
                        styles.badge,
                        {
                          backgroundColor: isSelected ? "#ffffff25" : "#e9ece4",
                          color: isSelected ? "#fff" : colors.primaryDark,
                        },
                      ]}
                    >
                      {workout.difficulty}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.workoutTarget,
                      { color: isSelected ? "#eef3ee" : colors.text },
                    ]}
                  >
                    {workout.target}
                  </Text>

                  <Text
                    style={[
                      styles.workoutMeta,
                      { color: isSelected ? "#eef3ee" : colors.text },
                    ]}
                  >
                    {workout.equipment} • {workout.sets}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.cardTitle, { color: colors.primaryDark }]}>
              {selectedWorkout.name}
            </Text>

            <Text style={[styles.cardSubtitle, { color: colors.text }]}>
              Target: {selectedWorkout.target}
            </Text>

            <View style={styles.detailRow}>
              <View style={styles.detailPill}>
                <Text style={styles.detailText}>{selectedWorkout.difficulty}</Text>
              </View>
              <View style={styles.detailPill}>
                <Text style={styles.detailText}>{selectedWorkout.equipment}</Text>
              </View>
              <View style={styles.detailPill}>
                <Text style={styles.detailText}>{selectedWorkout.sets}</Text>
              </View>
            </View>

            <View style={styles.demoWrap}>
              <Image
                source={selectedWorkout.demo}
                style={styles.demo}
                resizeMode="contain"
              />
            </View>

            <TouchableOpacity
              style={[styles.startWorkoutBtn, { backgroundColor: colors.primaryDark }]}
              onPress={startSelectedWorkout}
              activeOpacity={0.85}
            >
              <Text style={styles.timerButtonText}>
                Start {selectedWorkout.name}
              </Text>
            </TouchableOpacity>

            <View style={styles.tipBlock}>
              <Text style={[styles.tipLabel, { color: colors.primaryDark }]}>
                Quick Tip
              </Text>
              <Text style={[styles.tipText, { color: colors.text }]}>
                {selectedWorkout.tip}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerBlock: {
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 24,
  },
  timerCard: {
    padding: 18,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  timerLabel: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: "900",
    marginBottom: 14,
  },
  timerButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  timerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  timerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  chipRow: {
    gap: 10,
    paddingBottom: 16,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  chipText: {
    fontWeight: "800",
  },
  listContainer: {
    marginBottom: 20,
  },
  workoutButton: {
    padding: 18,
    borderRadius: 22,
    marginBottom: 12,
  },
  workoutTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workoutButtonText: {
    fontSize: 20,
    fontWeight: "800",
  },
  badge: {
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "800",
  },
  workoutTarget: {
    fontSize: 15,
    marginTop: 8,
    opacity: 0.9,
    lineHeight: 20,
  },
  workoutMeta: {
    fontSize: 13,
    marginTop: 6,
    opacity: 0.8,
    fontWeight: "600",
  },
  card: {
    padding: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 36,
    fontWeight: "900",
  },
  cardSubtitle: {
    fontSize: 17,
    opacity: 0.82,
    lineHeight: 24,
    marginTop: 6,
  },
  detailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  detailPill: {
    backgroundColor: "#e9ece4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  detailText: {
    color: "#2f6f46",
    fontWeight: "800",
    fontSize: 12,
  },
  demoWrap: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
  },
  demo: {
    width: "100%",
    height: 240,
    backgroundColor: "#e9ece4",
  },
  startWorkoutBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  tipBlock: {
    paddingTop: 2,
  },
  tipLabel: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 15,
    lineHeight: 22,
  },
});