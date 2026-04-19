import * as Haptics from "expo-haptics";
import { haptic } from "@/lib/haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Btn } from "@/components/Btn";
import { ROLE_DEFS, ROLE_TEAM_LABEL } from "@/constants/roles";
import roleImages from "@/constants/roleImages";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { useCountdown } from "@/hooks/useCountdown";

const AVATAR_SIZE = 72;

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
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Text style={{ color: c.mutedForeground, fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 1.5 }}>
          ROL DAĞITIMI
        </Text>
        <Text style={{ color: c.foreground, fontFamily: "Cinzel_700Bold", fontSize: 24, marginTop: 10, letterSpacing: 2 }}>
          {currentPlayer?.nickname ?? "..."}
        </Text>
        <Text style={{ color: c.mutedForeground, marginTop: 6, fontFamily: "Inter_400Regular" }}>
          kartlarına bakıyor...
        </Text>
        <View style={{ marginTop: 28, alignItems: "center" }}>
          <Text style={{ color: c.primary, fontFamily: "Inter_700Bold", fontSize: 36 }}>
            {done}/{state.players.length}
          </Text>
          <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 }}>
            seçimini yaptı
          </Text>
        </View>
      </View>
    );
  }

  const opts = state.currentChoice!.options;

  return (
    <CardFan opts={opts} remaining={remaining} emit={emit} c={c} myPlayerId={myPlayerId} />
  );
}

function CardFan({ opts, remaining, emit, c, myPlayerId }: any) {
  const anims = useRef(opts.map(() => new Animated.Value(0))).current;
  const rotations = [-3, 0, 3];

  useEffect(() => {
    Animated.stagger(
      100,
      anims.map((anim: Animated.Value) =>
        Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ),
    ).start();
  }, []);

  return (
    <View style={{ flex: 1, padding: 18, gap: 14, backgroundColor: c.background }}>
      <View style={{ alignItems: "center", marginBottom: 4 }}>
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", letterSpacing: 1.5, fontSize: 11 }}>
          ROL SEÇ
        </Text>
        <Text style={{ color: c.foreground, fontFamily: "Cinzel_700Bold", fontSize: 20, marginTop: 6, letterSpacing: 2 }}>
          Kaderini koy ortaya
        </Text>
        <Text style={{ color: c.primary, fontFamily: "Inter_700Bold", fontSize: 30, marginTop: 8, fontVariant: ["tabular-nums"] }}>
          {remaining}s
        </Text>
      </View>

      {opts.map((rid: string, i: number) => {
        const r = ROLE_DEFS[rid];
        if (!r) return null;
        const teamColor = r.team === "iyi" ? c.factionGood : c.factionBad;
        const img = roleImages[rid];
        return (
          <Animated.View
            key={rid}
            style={{
              opacity: anims[i],
              transform: [
                { translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
                { rotateZ: `${rotations[i] ?? 0}deg` },
              ],
            }}
          >
            <Pressable
              onPress={() => {
                haptic(Haptics.ImpactFeedbackStyle.Medium);
                emit("chooseRole", { roleId: rid });
              }}
              style={({ pressed }) => [
                styles.roleCard,
                {
                  backgroundColor: pressed ? c.surface : c.card,
                  borderColor: pressed ? teamColor : teamColor + "44",
                  borderWidth: pressed ? 2 : 1,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              {img ? (
                <View style={[styles.avatarCircle, { borderColor: teamColor + "88" }]}>
                  <Image source={img} style={styles.avatarImg} />
                </View>
              ) : (
                <Text style={{ fontSize: 38 }}>{r.emoji}</Text>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 17 }}>
                  {r.name}
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontFamily: "Inter_700Bold",
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: teamColor,
                  }}
                >
                  {ROLE_TEAM_LABEL[r.team]}
                </Text>
                <Text style={{ color: c.mutedForeground, marginTop: 6, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 }}>
                  {r.description}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
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
    borderRadius: 12,
    alignItems: "center",
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    borderWidth: 2,
    flexShrink: 0,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
});
