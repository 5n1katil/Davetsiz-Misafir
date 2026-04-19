import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { useCountdown } from "@/hooks/useCountdown";

export default function VoteScreen() {
  const c = useColors();
  const { state, myPlayerId, emit } = useGame();
  const remaining = useCountdown(state?.phaseDeadline ?? null);
  if (!state) return null;
  const me = state.players.find((p) => p.id === myPlayerId);
  const candidates = state.players.filter((p) => state.runoffCandidates.includes(p.id));
  const isRunoff = state.phase === "VOTE_RUNOFF";

  return (
    <View style={{ flex: 1, padding: 18, gap: 14 }}>
      <View style={{ alignItems: "center", paddingVertical: 8 }}>
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", letterSpacing: 1, fontSize: 12 }}>
          {isRunoff ? "İKİNCİ TUR — BERABERLİK" : "OYLAMA"}
        </Text>
        <Text style={{ color: c.primary, fontFamily: "Inter_700Bold", fontSize: 44 }}>
          {remaining}s
        </Text>
        <Text style={{ color: c.mutedForeground, marginTop: 4, fontFamily: "Inter_400Regular" }}>
          {state.voteCount} oy verildi
        </Text>
      </View>

      {!me?.isAlive ? (
        <View style={[styles.deadCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="eye" size={20} color={c.mutedForeground} />
          <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", marginTop: 6 }}>
            Mezardasın. Oylamayı izliyorsun.
          </Text>
        </View>
      ) : (
        candidates.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => emit("castVote", { targetId: p.id })}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: c.card,
                borderColor: c.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: c.secondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold" }}>
                {p.nickname[0]?.toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: c.foreground, flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
              {p.nickname}
              {p.id === myPlayerId ? "  •  sen" : ""}
            </Text>
            <Feather name="check-square" size={20} color={c.primary} />
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  deadCard: { padding: 22, borderRadius: 16, borderWidth: 1, alignItems: "center" },
});
