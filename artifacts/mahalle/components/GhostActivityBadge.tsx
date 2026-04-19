import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface GhostActivityBadgeProps {
  count?: number;
}

export function GhostActivityBadge({ count = 0 }: GhostActivityBadgeProps) {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

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

  return (
    <Animated.View style={[styles.badge, { opacity: opacityAnim }]}>
      <Text style={styles.ghost}>👻</Text>
      {count > 0 ? (
        <View style={styles.countBubble}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      ) : (
        <View style={styles.dot} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
});
