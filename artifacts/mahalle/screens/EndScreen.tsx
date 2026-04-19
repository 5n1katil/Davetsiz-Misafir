import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Btn } from "@/components/Btn";
import { ROLE_DEFS } from "@/constants/roles";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";

export default function EndScreen() {
  const c = useColors();
  const { state, myPlayerId, emit, leave } = useGame();
  if (!state) return null;
  const isHost = state.hostId === myPlayerId;
  const winner = state.winner;
  const winnerColor = winner === "iyi" ? "#4FB794" : "#E5654E";

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
      <LinearGradient
        colors={[winnerColor + "33", "transparent"]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, height: 320 }}
      />
      <View style={{ alignItems: "center", paddingTop: 40, paddingBottom: 20 }}>
        <Feather name="award" size={56} color={winnerColor} />
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", letterSpacing: 2, marginTop: 12 }}>
          OYUN BİTTİ
        </Text>
        <Text style={{ color: winnerColor, fontFamily: "Inter_700Bold", fontSize: 32, marginTop: 6 }}>
          {winner === "iyi" ? "MAHALLE KAZANDI" : "DAVETSİZ MİSAFİR KAZANDI"}
        </Text>
        <Text style={{ color: c.foreground, fontFamily: "Inter_400Regular", marginTop: 12, textAlign: "center", paddingHorizontal: 20 }}>
          {state.winnerLabel}
        </Text>
      </View>

      <Text style={{ color: c.mutedForeground, fontFamily: "Inter_600SemiBold", letterSpacing: 1, fontSize: 11 }}>
        TÜM ROLLER
      </Text>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        {state.players.map((p) => {
          const grave = state.graveyard.find((g) => g.playerId === p.id);
          const role = grave ? ROLE_DEFS[grave.roleId] : null;
          return (
            <View key={p.id} style={{ flexDirection: "row", paddingVertical: 8, alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 22 }}>{role?.emoji ?? "🙂"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold" }}>
                  {p.nickname}
                </Text>
                <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
                  {role?.name ?? "Bilinmiyor"} • {p.isAlive ? "Hayatta" : grave?.cause ?? "Öldü"}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={{ color: c.mutedForeground, fontFamily: "Inter_600SemiBold", letterSpacing: 1, fontSize: 11, marginTop: 8 }}>
        OLAY GÜNLÜĞÜ
      </Text>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        {state.graveyard.length === 0 ? (
          <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular" }}>
            Hiç olay yaşanmadı.
          </Text>
        ) : (
          state.graveyard.map((g, i) => (
            <View key={i} style={{ paddingVertical: 6 }}>
              <Text style={{ color: c.foreground, fontFamily: "Inter_500Medium" }}>
                {g.nickname} <Text style={{ color: c.mutedForeground }}>({ROLE_DEFS[g.roleId]?.name ?? g.roleId})</Text>
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular" }}>
                {g.cause}
              </Text>
            </View>
          ))
        )}
      </View>

      {isHost ? (
        <Btn label="🔄 Tekrar Oyna" onPress={() => emit("restartGame")} style={{ marginTop: 12 }} />
      ) : (
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 12 }}>
          Host'un yeni oyunu başlatmasını bekle...
        </Text>
      )}
      <Btn label="Odadan Çık" variant="ghost" onPress={() => leave()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: 14, borderWidth: 1 },
});
