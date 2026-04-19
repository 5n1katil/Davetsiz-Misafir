import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";

import { Btn } from "@/components/Btn";
import { ROLE_DEFS } from "@/constants/roles";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { saveGameRecord } from "@/lib/history";

export default function EndScreen() {
  const c = useColors();
  const { state, myPlayerId, emit, leave } = useGame();
  const burstAnim = useRef(new Animated.Value(0)).current;
  const savedRef = useRef(false);

  useEffect(() => {
    Animated.timing(burstAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!state || !myPlayerId || savedRef.current) return;
    if (!state.winner) return;

    const myGraveEntry = state.graveyard.find((g) => g.playerId === myPlayerId);
    const myRoleId = state.myRole ?? myGraveEntry?.roleId ?? "koylu";
    const myRoleDef = ROLE_DEFS[myRoleId];
    const myTeam = myRoleDef?.team ?? "iyi";
    const won = myTeam === state.winner;

    savedRef.current = true;
    saveGameRecord({
      playedAt: Date.now(),
      winner: state.winner,
      myRoleId,
      myTeam,
      won,
      playerCount: state.players.length,
      rounds: state.round,
    });
  }, [state, myPlayerId]);

  if (!state) return null;
  const isHost = state.hostId === myPlayerId;
  const winner = state.winner;
  const winnerColor = winner === "iyi" ? c.factionGood : c.factionBad;
  const winnerLabel = winner === "iyi" ? "MAHALLE KAZANDI" : "DAVETSİZ MİSAFİR KAZANDI";

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{ padding: 20, gap: 14 }}
    >
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 400,
          opacity: burstAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.18, 0.1] }),
          transform: [{ scale: burstAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 3] }) }],
          borderRadius: 9999,
          backgroundColor: winnerColor,
          alignSelf: "center",
          width: 300,
          top: 60,
        }}
      />
      <LinearGradient
        colors={[winnerColor + "28", "transparent"]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, height: 360 }}
      />

      <View style={{ alignItems: "center", paddingTop: 44, paddingBottom: 22 }}>
        <Feather name="award" size={60} color={winnerColor} />
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", letterSpacing: 2, marginTop: 14, fontSize: 11 }}>
          OYUN BİTTİ
        </Text>
        <Text style={{ color: winnerColor, fontFamily: "Cinzel_900Black", fontSize: 26, marginTop: 6, textAlign: "center", letterSpacing: 3 }}>
          {winnerLabel}
        </Text>
        <Text style={{ color: c.foreground, fontFamily: "Inter_400Regular", marginTop: 12, textAlign: "center", paddingHorizontal: 20, lineHeight: 21 }}>
          {state.winnerLabel}
        </Text>
      </View>

      <Text style={{ color: c.mutedForeground, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, fontSize: 10 }}>
        TÜM ROLLER
      </Text>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        {state.players.map((p) => {
          const grave = state.graveyard.find((g: any) => g.playerId === p.id);
          const role = grave ? ROLE_DEFS[grave.roleId] : null;
          const roleTeamColor = role?.team === "iyi" ? c.factionGood : c.factionBad;
          return (
            <View
              key={p.id}
              style={{
                flexDirection: "row",
                paddingVertical: 9,
                alignItems: "center",
                gap: 10,
                opacity: p.isAlive ? 1 : 0.7,
              }}
            >
              <Text style={{ fontSize: 22 }}>{role?.emoji ?? "🙂"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold" }}>
                  {p.nickname}
                </Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2, color: role ? roleTeamColor : c.mutedForeground }}>
                  {role?.name ?? "Bilinmiyor"} • {p.isAlive ? "Hayatta" : grave?.cause ?? "Öldü"}
                </Text>
              </View>
              {!p.isAlive && (
                <Feather name="x-circle" size={14} color={c.destructive} style={{ opacity: 0.6 }} />
              )}
            </View>
          );
        })}
      </View>

      <Text style={{ color: c.mutedForeground, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, fontSize: 10, marginTop: 6 }}>
        OLAY GÜNLÜĞÜ
      </Text>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        {state.graveyard.length === 0 ? (
          <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular" }}>
            Hiç olay yaşanmadı.
          </Text>
        ) : (
          state.graveyard.map((g: any, i: number) => (
            <View key={i} style={{ paddingVertical: 6 }}>
              <Text style={{ color: c.foreground, fontFamily: "Inter_500Medium" }}>
                {g.nickname}{" "}
                <Text style={{ color: c.mutedForeground }}>({ROLE_DEFS[g.roleId]?.name ?? g.roleId})</Text>
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
  card: { padding: 14, borderRadius: 12, borderWidth: 1 },
});
