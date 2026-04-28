<<<<<<< Updated upstream
import { StyleSheet, Text, View } from "react-native";
=======
/**
 * Module: Workout Screen
 * Date: 2026-04-17
 * Programmer: Group 4
 *
 * Description:
 *   Provides a simple workout session screen with selectable exercises,
 *   animated preview GIFs, and a stopwatch timer.
 *
 * Important data structures:
 *   - workouts: array of exercise definitions with targets and tips
 *   - seconds/isRunning: timer state for the workout session
 *
 * Algorithm note:
 *   The timer uses a standard setInterval approach for second-by-second
 *   updates and a looping animated pulse for visual feedback while running.
 */
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
>>>>>>> Stashed changes
import colors from "../../constants/colors";

export default function Workout() {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Workout</Text>

      <Text style={[styles.subtitle, { color: colors.text }]}>
        Your personalized workouts will appear here next semester.
      </Text>

      <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.cardTitle, { color: colors.primaryDark }]}>
          Coming Soon
        </Text>
        <Text style={[styles.cardText, { color: colors.text }]}>
          - Exercise library{"\n"}
          - Workout tutorials{"\n"}
          - Personalized recommendations
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 20,
  },
  card: {
    padding: 20,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
