import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import colors from "../constants/colors";

type Props = {
  size?: number;
  progress?: number; // progress value between 0 and 1
  label?: string;
  sub?: string;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ProgressRing({
  size = 80,
  progress = 0.5,
  label = "",
  sub = "",
}: Props) {
  const strokeWidth = 8;

  // radius accounts for strokeWidth so the circle fits inside the view
  const radius = (size - strokeWidth) / 2;

  // center coordinates of the circle
  const cx = size / 2;
  const cy = size / 2;

  // full circumference for a complete circle
  const circumference = 2 * Math.PI * radius;

  // shared value for animated progress
  const progressValue = useSharedValue(0);

  useEffect(() => {
    // clamp progress so it stays between 0 and 1
    const p = Math.max(0, Math.min(1, progress));

    // animate from current value to new value
    progressValue.value = withTiming(p, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, progressValue]);

  const animatedProps = useAnimatedProps(() => {
    // strokeDashoffset determines how much of the circle is visible
    // decreasing this value makes the arc draw forward
    return {
      strokeDashoffset: circumference * (1 - progressValue.value),
    } as any;
  }, [circumference]);

  return (
    <View style={styles.center}>
      <Svg width={size} height={size}>
        <Defs>
          {/* gradient used to color the progress arc */}
          <LinearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.primaryDark} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* static background circle */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* animated arc that rotates -90 degrees so it starts at the top */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${cx} ${cy})`}
          fill="transparent"
        />
      </Svg>

      {/* center label area */}
      <View style={styles.labelWrap}>
        <Text style={styles.sub}>{sub}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  labelWrap: { position: "absolute", alignItems: "center" },
  sub: { color: colors.text, fontWeight: "800", fontSize: 18 },
  label: { color: "rgba(0,0,0,0.4)", fontSize: 12, marginTop: 4 },
});
