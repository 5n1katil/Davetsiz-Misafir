import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";

import { Btn } from "@/components/Btn";
import { GraveyardChat } from "@/components/GraveyardChat";
import { GhostActivityBadge } from "@/components/GhostActivityBadge";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { useCountdown } from "@/hooks/useCountdown";
import { useGhostActivity } from "@/hooks/useGhostActivity";

export default function DayScreen() {
  const c = useColors();
  const { state, myPlayerId, emit } = useGame();
  const remaining = useCountdown(state?.phaseDeadline ?? null, state?.paused ?? false);
  if (!state) return null;
  const me = state.players.find((p) => p.id === myPlayerId);
  const alive = state.players.filter((p) => p.isAlive && p.isConnected);
  const need = Math.ceil(alive.length / 2);
  const isDead = !me?.isAlive;
  const ghostActive = useGhostActivity();

  const mins = Math.floor(remaining / 60);
  const secs = (remaining % 60).toString().padStart(2, "0");
  const isCritical = remaining <= 10 && remaining > 0 && !state.paused;

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const critColorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isCritical) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]),
        { iterations: -1 },
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(critColorAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(critColorAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
        ]),
      ).start();
    } else {
      shakeAnim.stopAnimation();
      shakeAnim.setValue(0);
      critColorAnim.stopAnimation();
      critColorAnim.setValue(0);
    }
  }, [isCritical]);

  const timerColor = critColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [c.primary, c.destructive],
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ backgroundColor: c.background }}
        contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: isDead ? 6 : 18 }}
      >
        <View style={[styles.timerCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="sun" size={18} color={c.primary} />
          <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 1.5, marginTop: 4 }}>
            GÜN {state.round}
          </Text>
          <Animated.Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 52,
              letterSpacing: 2,
              color: timerColor,
              transform: [{ translateX: shakeAnim }],
              fontVariant: ["tabular-nums"],
            }}
          >
            {mins}:{secs}
          </Animated.Text>
        </View>

        {state.morningEvents.length > 0 ? (
          <View style={[styles.eventCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={{ color: c.primary, fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.5 }}>
              SABAH DUYURUSU
            </Text>
            {state.morningEvents.map((e, i) => (
              <Text key={i} style={{ color: c.foreground, marginTop: 6, fontFamily: "Inter_500Medium", fontSize: 15 }}>
                {e.message}
              </Text>
            ))}
          </View>
        ) : null}

        {state.privateMessages.length > 0 ? (
          <View style={[styles.eventCard, { backgroundColor: "#0D1F3A", borderColor: "#1ECBE155" }]}>
            <Text style={{ color: "#1ECBE1", fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.5 }}>
              SANA ÖZEL BİLGİ
            </Text>
            {state.privateMessages.map((m, i) => (
              <Text key={i} style={{ color: c.foreground, marginTop: 6, fontFamily: "Inter_500Medium", fontSize: 14 }}>
                {m.msg}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={{ color: c.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1.5 }}>
            HAYATTA OLAN ({alive.length})
          </Text>
          {ghostActive ? <GhostActivityBadge /> : null}
        </View>
        <View style={[styles.playerCard, { backgroundColor: c.card, borderColor: c.border }]}>
          {state.players.map((p) => (
            <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: p.isAlive ? c.elevated : c.muted,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: p.isAlive ? 1 : 0.4,
                }}
              >
                <Text style={{ color: p.isAlive ? c.foreground : c.mutedForeground, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                  {p.nickname[0]?.toUpperCase()}
                </Text>
              </View>
              <Text
                style={{
                  color: p.isAlive ? c.foreground : c.mutedForeground,
                  flex: 1,
                  fontFamily: "Inter_500Medium",
                  textDecorationLine: p.isAlive ? "none" : "line-through",
                }}
              >
                {p.nickname}
                {p.id === myPlayerId ? "  •  sen" : ""}
              </Text>
              {!p.isAlive ? (
                <Feather name="x-circle" size={14} color={c.destructive} />
              ) : !p.isConnected ? (
                <Feather name="wifi-off" size={14} color={c.mutedForeground} />
              ) : null}
            </View>
          ))}
        </View>

        {!isDead ? (
          <Btn
            label={`⚖️ Oylama Öner (${state.voteOpenBy}/${need})`}
            variant="primary"
            onPress={() => emit("proposeVote")}
          />
        ) : null}
      </ScrollView>

      {isDead ? (
        <View style={[styles.chatPanel, { borderColor: c.border, backgroundColor: c.background }]}>
          <GraveyardChat />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  timerCard: { padding: 22, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 4 },
  eventCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  playerCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  chatPanel: {
    padding: 14,
    borderTopWidth: 1,
    height: 280,
  },
});
