import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useGame } from "@/contexts/GameContext";
import { useReduceMotion } from "@/hooks/useReduceMotion";

function PausedBadge() {
  const c = useColors();
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity, reduceMotion]);

  return (
    <Animated.View style={[styles.pausedBadge, { borderColor: c.primary, opacity }]}>
      <Text style={{ color: c.primary, fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 1.2 }}>
        ⏸ DURAKLATILDI
      </Text>
    </Animated.View>
  );
}

export function HeaderBar({
  title,
  subtitle,
  onOpenSettings,
}: {
  title: string;
  subtitle?: string;
  onOpenSettings: () => void;
}) {
  const c = useColors();
  const { connected, voiceMuted, toggleVoice, vibrationsEnabled, toggleVibrations, state, myPlayerId } = useGame();
  const isHost = state && myPlayerId === state.hostId;
  const isPaused = state?.paused === true;

  return (
    <View
      style={[
        styles.wrap,
        {
          borderBottomColor: c.border,
          backgroundColor: c.background,
          borderLeftWidth: isHost ? 3 : 0,
          borderLeftColor: isHost ? c.primary : "transparent",
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sub, { color: c.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.right}>
        {isPaused ? <PausedBadge /> : null}
        {isHost ? (
          <>
            <View style={[styles.hostBadge, { borderColor: c.primary }]}>
              <Text style={{ color: c.primary, fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 1.5 }}>
                HOST
              </Text>
            </View>
            <Pressable
              onPress={toggleVoice}
              style={[styles.iconBtn, { borderColor: c.border }]}
            >
              <Feather
                name={voiceMuted ? "volume-x" : "volume-2"}
                size={18}
                color={voiceMuted ? c.mutedForeground : c.primary}
              />
            </Pressable>
          </>
        ) : null}
        <Pressable
          onPress={toggleVibrations}
          style={[styles.iconBtn, { borderColor: c.border }]}
        >
          <Feather
            name={vibrationsEnabled ? "smartphone" : "slash"}
            size={18}
            color={vibrationsEnabled ? c.primary : c.mutedForeground}
          />
        </Pressable>
        <Pressable
          onPress={onOpenSettings}
          style={[styles.iconBtn, { borderColor: c.border }]}
          accessibilityLabel="Ayarlar"
        >
          <Feather name="settings" size={18} color={c.mutedForeground} />
        </Pressable>
        <View
          style={[
            styles.dot,
            { backgroundColor: connected ? "#1ECBE1" : "#C8102E" },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    letterSpacing: 0.5,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hostBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  pausedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
