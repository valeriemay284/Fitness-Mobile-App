import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "../constants/colors";

// sample weekly data values (0 to 1 scale)
const sample = [0.3, 0.6, 0.55, 0.8, 0.45, 0.7, 0.5];

export default function WeeklyChart({ style }: any) {
  // find the highest value in the data
  // used to scale all bars proportionally
  const max = Math.max(...sample);

  return (
    // outer horizontal container that holds all bars
    <View style={[styles.row, style]}>
      {sample.map((v, i) => {
        // scale each bar height relative to the max value
        const height = 60 * (v / max);

        return (
          // each bar + its label
          <View key={i} style={styles.colWrap}>
            {/* bar with dynamic height */}
            <View style={[styles.bar, { height }]} />

            {/* day label under bar */}
            <Text style={styles.label}>
              {["S","M","T","W","T","F","S"][i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // layout bars side by side at the bottom
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  // wrapper for a single bar + label
  colWrap: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },

  // the bar itself
  bar: {
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: 6,
  },

  // small label for day letters
  label: {
    fontSize: 11,
    marginTop: 6,
    color: "#444",
  },
});
