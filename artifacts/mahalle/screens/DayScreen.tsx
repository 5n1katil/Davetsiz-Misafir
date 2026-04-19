import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Btn } from "@/components/Btn";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { useCountdown } from "@/hooks/useCountdown";

export default function DayScreen() {
  const c = useColors();
  const { state, myPlayerId, emit } = useGame();
  const remaining = useCountdown(state?.phaseDeadline ?? null);
  if (!state) return null;
  const me = state.players.find((p) => p.id === myPlayerId);
  const alive = state.players.filter((p) => p.isAlive && p.isConnected);
  const need = Math.ceil(alive.length / 2);

  const mins = Math.floor(remaining / 60);
  const secs = (remaining % 60).toString().padStart(2, "0");

  return (
    <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
      <View style={[styles.timerCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Feather name="sun" size={20} color={c.primary} />
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 1, marginTop: 4 }}>
          GÜN {state.round}
        </Text>
        <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 48, letterSpacing: 2 }}>
          {mins}:{secs}
        </Text>
      </View>

      {state.morningEvents.length > 0 ? (
        <View style={[styles.morning, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={{ color: c.primary, fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1 }}>
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
        <View style={[styles.morning, { backgroundColor: "#1A2A22", borderColor: "#4FB79455" }]}>
          <Text style={{ color: "#4FB794", fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1 }}>
            SANA ÖZEL BİLGİ
          </Text>
          {state.privateMessages.map((m, i) => (
            <Text key={i} style={{ color: c.foreground, marginTop: 6, fontFamily: "Inter_500Medium", fontSize: 14 }}>
              {m.msg}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={{ color: c.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1, marginTop: 4 }}>
        HAYATTA OLAN ({alive.length})
      </Text>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        {state.players.map((p) => (
          <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: p.isAlive ? c.secondary : c.muted,
                alignItems: "center",
                justifyContent: "center",
                opacity: p.isAlive ? 1 : 0.4,
              }}
            >
              <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold" }}>
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
              <Feather name="x-circle" size={14} color={c.mutedForeground} />
            ) : !p.isConnected ? (
              <Feather name="wifi-off" size={14} color={c.mutedForeground} />
            ) : null}
          </View>
        ))}
      </View>

      {me?.isAlive ? (
        <Btn
          label={`⚖️ Oylama Öner (${state.voteOpenBy}/${need})`}
          variant="primary"
          onPress={() => emit("proposeVote")}
        />
      ) : (
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, alignItems: "center" }]}>
          <Feather name="eye" size={18} color={c.mutedForeground} />
          <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", marginTop: 8 }}>
            Sen mezarlıktasın. Oylamayı izliyorsun.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  timerCard: { padding: 22, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 4 },
  morning: { padding: 14, borderRadius: 14, borderWidth: 1 },
  card: { padding: 14, borderRadius: 14, borderWidth: 1 },
});
