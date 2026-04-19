import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Btn } from "@/components/Btn";
import { ROLE_DEFS, ROLE_TEAM_LABEL } from "@/constants/roles";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { useCountdown } from "@/hooks/useCountdown";

export default function RoleSelectScreen() {
  const c = useColors();
  const { state, myPlayerId, emit } = useGame();
  const remaining = useCountdown(state?.roleSelectDeadline ?? null);

  if (!state) return null;
  const myTurn =
    state.currentChoice && state.currentChoice.playerId === myPlayerId;
  const currentPlayer = state.players.find(
    (p) => p.id === state.currentChoice?.playerId,
  );

  if (!myTurn) {
    const done = state.players.filter((p) => p.hasSelectedRole).length;
    return (
      <View style={styles.center}>
        <Text style={{ color: c.mutedForeground, fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 1 }}>
          ROL DAĞITIMI
        </Text>
        <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 26, marginTop: 8 }}>
          {currentPlayer?.nickname ?? "..."}
        </Text>
        <Text style={{ color: c.mutedForeground, marginTop: 6, fontFamily: "Inter_400Regular" }}>
          kartlarına bakıyor...
        </Text>
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <Text style={{ color: c.primary, fontFamily: "Inter_700Bold", fontSize: 32 }}>
            {done}/{state.players.length}
          </Text>
          <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }}>
            seçimini yaptı
          </Text>
        </View>
      </View>
    );
  }

  const opts = state.currentChoice!.options;
  return (
    <View style={{ flex: 1, padding: 18, gap: 14 }}>
      <View style={{ alignItems: "center", marginBottom: 4 }}>
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", letterSpacing: 1, fontSize: 12 }}>
          ROL SEÇ
        </Text>
        <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 6 }}>
          Kaderini koy ortaya
        </Text>
        <Text style={{ color: c.primary, fontFamily: "Inter_700Bold", fontSize: 28, marginTop: 8 }}>
          {remaining}s
        </Text>
      </View>

      {opts.map((rid) => {
        const r = ROLE_DEFS[rid];
        if (!r) return null;
        return (
          <Pressable
            key={rid}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              emit("chooseRole", { roleId: rid });
            }}
            style={({ pressed }) => [
              styles.roleCard,
              {
                backgroundColor: c.card,
                borderColor: r.team === "iyi" ? "#4FB79433" : "#E5654E33",
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 36 }}>{r.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 17 }}>
                {r.name}
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  fontFamily: "Inter_500Medium",
                  fontSize: 11,
                  letterSpacing: 1,
                  color: r.team === "iyi" ? "#4FB794" : "#E5654E",
                }}
              >
                {ROLE_TEAM_LABEL[r.team]}
              </Text>
              <Text style={{ color: c.mutedForeground, marginTop: 6, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                {r.description}
              </Text>
            </View>
          </Pressable>
        );
      })}

      <Btn
        label="🎲 Rastgele Seç — kaderini koy ortaya!"
        variant="ghost"
        onPress={() => emit("chooseRole", { roleId: "__random__" })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  roleCard: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "flex-start",
  },
});
