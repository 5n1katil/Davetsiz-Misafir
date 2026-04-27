import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { GraveyardChat } from "@/components/GraveyardChat";
import { GhostActivityBadge } from "@/components/GhostActivityBadge";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { haptic } from "@/lib/haptics";
import { useCountdown } from "@/hooks/useCountdown";
import { useGhostActivity } from "@/hooks/useGhostActivity";

export default function VoteScreen() {
  const c = useColors();
  const { state, myPlayerId, emit } = useGame();
  const remaining = useCountdown(state?.phaseDeadline ?? null, state?.paused ?? false);
  if (!state) return null;
  const me = state.players.find((p) => p.id === myPlayerId);
  const candidates = state.players.filter((p) => state.runoffCandidates.includes(p.id));
  const isRunoff = state.phase === "VOTE_RUNOFF";
  const isCritical = remaining <= 10 && remaining > 0;
  const isDead = !me?.isAlive;
  const ghostActive = useGhostActivity();

  const timerColor = isCritical ? c.destructive : c.primary;

  const voteTally = state.voteTally ?? {};
  const maxVotes = Math.max(1, ...candidates.map((p) => voteTally[p.id] ?? 0));
  const alivePlayers = state.players.filter((p) => p.isAlive).length;

  return (
    <ScrollView
      style={{ backgroundColor: "#12051A" }}
      contentContainerStyle={{ padding: 18, gap: 14 }}
    >
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300, opacity: 0.07, backgroundColor: c.destructive }} />

      <View style={{ alignItems: "center", paddingVertical: 10 }}>
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", letterSpacing: 1.5, fontSize: 11 }}>
          {isRunoff ? "İKİNCİ TUR — BERABERLİK" : "OYLAMA"}
        </Text>
        <Text style={{ color: timerColor, fontFamily: "Inter_700Bold", fontSize: 52, marginTop: 4, fontVariant: ["tabular-nums"] }}>
          {remaining}s
        </Text>
        <Text style={{ color: c.mutedForeground, marginTop: 4, fontFamily: "Inter_400Regular", fontSize: 13 }}>
          {state.voteCount} oy verildi
        </Text>
        {ghostActive > 0 ? (
          <View style={{ marginTop: 8 }}>
            <GhostActivityBadge count={ghostActive} />
          </View>
        ) : null}
      </View>

      {isDead ? (
        <GraveyardChat />
      ) : (
        candidates.map((p) => {
          const candidateVotes = voteTally[p.id] ?? 0;
          const voteShare = candidateVotes / maxVotes;

          return (
            <Pressable
              key={p.id}
              onPress={() => {
                haptic(Haptics.ImpactFeedbackStyle.Light);
                emit("castVote", { targetId: p.id });
              }}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: c.card,
                  borderColor: pressed ? c.destructive + "88" : c.border,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <View style={styles.avatar}>
                <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold" }}>
                  {p.nickname[0]?.toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
                  {p.nickname}
                  {p.id === myPlayerId ? "  •  sen" : ""}
                </Text>
                <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                  {candidateVotes} oy
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: c.destructive,
                        width: `${Math.max(0, Math.min(1, voteShare)) * 100}%` as any,
                      },
                    ]}
                  />
                </View>
              </View>
              <Feather name="check-square" size={20} color={c.destructive} />
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#3B1F8C",
    alignItems: "center",
    justifyContent: "center",
  },
  deadCard: { padding: 22, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  barTrack: {
    height: 4,
    backgroundColor: "#3B1F8C",
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
});
