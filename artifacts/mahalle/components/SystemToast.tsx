import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/contexts/GameContext";

export default function SystemToast() {
  const insets = useSafeAreaInsets();
  const { systemToast, dismissToast } = useGame();
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!systemToast) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -80,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => dismissToast());
    }, 4000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [systemToast?.id]);

  if (!systemToast) return null;

  const hasTapAction = typeof systemToast.onPress === "function";

  const handlePress = () => {
    if (hasTapAction) {
      systemToast.onPress!();
      if (timerRef.current) clearTimeout(timerRef.current);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -80, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => dismissToast());
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        hasTapAction && styles.containerTappable,
        {
          top: insets.top + 8,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        onPress={hasTapAction ? handlePress : undefined}
        style={styles.body}
        android_ripple={hasTapAction ? { color: "#9B7FD430" } : undefined}
      >
        <Feather name={(systemToast.icon as any) ?? "award"} size={16} color="#F5C842" style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.text} numberOfLines={2}>
            {systemToast.message}
          </Text>
          {hasTapAction && (
            <Text style={styles.tapHint}>Paneli açmak için dokun</Text>
          )}
        </View>
      </Pressable>
      <Pressable onPress={dismissToast} hitSlop={10} style={styles.closeBtn}>
        <Feather name="x" size={14} color="#9B7FD4" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A0B3B",
    borderWidth: 1,
    borderColor: "#F5C84255",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
  },
  containerTappable: {
    borderColor: "#F5C842AA",
  },
  body: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    color: "#F0EAF8",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
  },
  tapHint: {
    color: "#9B7FD4",
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    marginLeft: 8,
  },
});
