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
    <View style={[styles.wrap, { borderBottomColor: c.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sub, { color: c.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.right}>
        {isHost ? (
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
        ) : null}
        <View
          style={[
            styles.dot,
            { backgroundColor: connected ? "#4FB794" : "#E5654E" },
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
    fontSize: 18,
    letterSpacing: 0.4,
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
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
});
