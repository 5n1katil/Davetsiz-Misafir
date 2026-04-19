import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useThemePreference } from "@/contexts/ThemeContext";

const FADE_IN_MS = 80;
const FADE_OUT_MS = 160;

export function ThemeTransitionLayer() {
  const { transitionCount, prevBg } = useThemePreference();
  const opacity = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (transitionCount === 0) return;

    if (reduceMotion) {
      return;
    }

    opacity.value = withSequence(
      withTiming(1, { duration: FADE_IN_MS }),
      withTiming(0, { duration: FADE_OUT_MS })
    );
  }, [transitionCount]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: prevBg }, animStyle]}
    />
  );
}
