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

const workouts = [
  {
    id: "pushup",
    name: "Push-Up",
    target: "Chest, shoulders, triceps",
    demo: require("../../assets/workouts/pushup.gif"),
    tip: "Keep your body in a straight line and avoid letting your hips sag.",
  },
  {
    id: "benchpress",
    name: "Bench Press",
    target: "Chest, shoulders, triceps",
    demo: require("../../assets/workouts/benchpress.gif"),
    tip: "Keep your feet planted and lower the bar with control.",
  },
  {
    id: "squat",
    name: "Squat",
    target: "Legs, glutes, core",
    demo: require("../../assets/workouts/squat.gif"),
    tip: "Keep your chest up and drive through your heels.",
  },
];

export default function Workout() {
  const [selectedWorkout, setSelectedWorkout] = useState(workouts[0]);

  // timer state
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // animated value for timer pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // timer logic
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

  // animate timer while running
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
      if (animation) {
        animation.stop();
      }
    };
  }, [isRunning, pulseAnim]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    const mm = mins < 10 ? `0${mins}` : `${mins}`;
    const ss = secs < 10 ? `0${secs}` : `${secs}`;

    return `${mm}:${ss}`;
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
            Choose an exercise, watch the movement, and track your session time.
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.timerCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.timerLabel, { color: colors.primaryDark }]}>
              Workout Timer
            </Text>

            {/* animated timer text */}
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

          <View style={styles.listContainer}>
            {workouts.map((workout) => {
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
                      borderColor: isSelected
                        ? colors.primaryDark
                        : "transparent",
                    },
                  ]}
                  onPress={() => setSelectedWorkout(workout)}
                  activeOpacity={0.85}
                >
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
                      styles.workoutTarget,
                      { color: isSelected ? "#eef3ee" : colors.text },
                    ]}
                  >
                    {workout.target}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <View style={styles.cardTop}>
              <View style={styles.cardTitleWrap}>
                <Text style={[styles.cardTitle, { color: colors.primaryDark }]}>
                  {selectedWorkout.name}
                </Text>

                <Text style={[styles.cardSubtitle, { color: colors.text }]}>
                  Target: {selectedWorkout.target}
                </Text>
              </View>
            </View>

            <View style={styles.demoWrap}>
              <Image
                source={selectedWorkout.demo}
                style={styles.demo}
                resizeMode="contain"
              />
            </View>

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
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.7,
    lineHeight: 22,
  },
  timerCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  timerLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  timerText: {
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 14,
  },
  timerButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  timerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  timerButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  listContainer: {
    marginBottom: 20,
  },
  workoutButton: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
  },
  workoutButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
  workoutTarget: {
    fontSize: 14,
    marginTop: 6,
    opacity: 0.9,
    lineHeight: 20,
  },
  card: {
    padding: 20,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 24,
  },
  cardTop: {
    marginBottom: 16,
  },
  cardTitleWrap: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  cardSubtitle: {
    fontSize: 16,
    opacity: 0.82,
    lineHeight: 22,
  },
  demoWrap: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 18,
  },
  demo: {
    width: "100%",
    height: 260,
    backgroundColor: "#e9ece4",
  },
  tipBlock: {
    paddingTop: 2,
  },
  tipLabel: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 15,
    lineHeight: 22,
  },
});