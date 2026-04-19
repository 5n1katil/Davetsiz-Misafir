import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useGame } from "@/contexts/GameContext";

export function HeaderBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const c = useColors();
  const { connected, voiceMuted, toggleVoice, state, myPlayerId } = useGame();
  const isHost = state && myPlayerId === state.hostId;

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
