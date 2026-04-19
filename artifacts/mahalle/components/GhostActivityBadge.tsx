import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { haptic } from "@/lib/haptics";
import * as Haptics from "expo-haptics";

interface GhostActivityBadgeProps {
  count?: number;
}

export function GhostActivityBadge({ count = 0 }: GhostActivityBadgeProps) {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const prevCountRef = useRef(count);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0.25, duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  useEffect(() => {
    if (count > prevCountRef.current) {
      haptic(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.45,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: -4, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -2, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]),
      ]).start();
    }
    prevCountRef.current = count;
  }, [count]);

  function handlePress() {
    if (tooltipVisible) {
      setTooltipVisible(false);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      return;
    }
    setTooltipVisible(true);
    dismissTimer.current = setTimeout(() => {
      setTooltipVisible(false);
    }, 3000);
  }

  const label =
    count === 0
      ? "Hayalet mesaj yok"
      : count === 1
        ? "1 hayalet mesajı"
        : `${count} hayalet mesajı`;

  return (
    <View style={styles.wrapper}>
      {tooltipVisible ? (
        <Pressable onPress={handlePress} style={styles.tooltip}>
          <Text style={styles.tooltipText}>👻 {label}</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={handlePress} hitSlop={10}>
        <Animated.View style={[styles.badge, { opacity: opacityAnim }]}>
          <Animated.Text style={[styles.ghost, { transform: [{ translateX: shakeAnim }] }]}>👻</Animated.Text>
          {count > 0 ? (
            <Animated.View style={[styles.countBubble, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.countText}>{count}</Text>
            </Animated.View>
          ) : (
            <View style={styles.dot} />
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "flex-end",
    gap: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ghost: {
    fontSize: 12,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#9B6FFF",
  },
  countBubble: {
    backgroundColor: "#9B6FFF",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    lineHeight: 12,
  },
  tooltip: {
    backgroundColor: "#1E0D33",
    borderColor: "#9B6FFF",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tooltipText: {
    color: "#D4BBFF",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
});
