import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import { Btn } from "@/components/Btn";
import { GhostActivityBadge } from "@/components/GhostActivityBadge";
import { GraveyardChat } from "@/components/GraveyardChat";
import { ROLE_DEFS } from "@/constants/roles";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { useCountdown } from "@/hooks/useCountdown";
import { useGhostActivity } from "@/hooks/useGhostActivity";

const ROLE_LABELS: Record<string, string> = {
  _cete: "Davetsiz Misafir",
  bekci: "Bekçi",
  otaci: "Otacı Teyze",
  falci: "Falcı",
};

const BG = "#060310";

export default function NightScreen() {
  const c = useColors();
  const { state, myPlayerId, emit } = useGame();
  const remaining = useCountdown(state?.phaseDeadline ?? null, state?.paused ?? false);
  const me = state?.players.find((p) => p.id === myPlayerId);
  const isHost = state && me && me.id === state.hostId;
  const isDead = !me?.isAlive;
  const ghostActive = useGhostActivity();

  const moonAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moonAnim, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(moonAnim, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start();
  }, [moonAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  if (!state) return null;

  if (isDead) {
    return (
      <View style={{ flex: 1, backgroundColor: "#05070F" }}>
        <View style={[styles.deadHeader]}>
          <Feather name="moon" size={18} color="#7E7C92" />
          <Text style={{ color: "#7E7C92", fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 1, marginLeft: 6 }}>
            GECE — SEN MEZARLIKTASIN
          </Text>
        </View>
        <View style={[styles.chatWrapper, { borderColor: "#2C3350" }]}>
          <GraveyardChat />
        </View>
      </View>
    );
  }

  if (state.phase === "NIGHT") {
    return (
      <View style={[styles.intro, { backgroundColor: BG }]}>
        <Animated.Text
          style={{
            fontSize: 80,
            opacity: moonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
            transform: [
              { scale: moonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1.07] }) },
            ],
          }}
        >
          🌙
        </Animated.Text>
        <Text style={{ color: "#E8DEFF", fontFamily: "Cinzel_700Bold", fontSize: 20, marginTop: 16, textAlign: "center", letterSpacing: 2 }}>
          Mahalle uykuya daldı...
        </Text>
        <Text style={{ color: "#9B7FD4", marginTop: 8, fontFamily: "Inter_400Regular", textAlign: "center" }}>
          Gözlerinizi kapatın
        </Text>
        {ghostActive > 0 ? (
          <View style={{ marginTop: 12 }}>
            <GhostActivityBadge count={ghostActive} />
          </View>
        ) : null}
        {isHost ? (
          <Btn
            label="▶ Devam Et"
            onPress={() => emit("startNight")}
            style={{ marginTop: 36, alignSelf: "stretch", marginHorizontal: 30 }}
          />
        ) : null}
      </View>
    );
  }

  const step = state.nightStep;
  if (!step) return null;
  const roleLabel = ROLE_LABELS[step.roleId] ?? step.roleId;
  const isMyTurn =
    step.roleId === "_cete"
      ? !!me && step.actorIds.includes(me.id)
      : me?.roleId === step.roleId;

  if (!isMyTurn) {
    return (
      <View style={[styles.intro, { backgroundColor: BG }]}>
        <Feather name="moon" size={52} color="#F5C842" />
        <Text style={{ color: "#E8DEFF", fontFamily: "Cinzel_700Bold", fontSize: 20, marginTop: 16, textAlign: "center", letterSpacing: 2 }}>
          {roleLabel} uyanıyor...
        </Text>
        <Text style={{ color: "#9B7FD4", marginTop: 8, fontFamily: "Inter_400Regular", textAlign: "center" }}>
          Sen uyu. Aksiyon başkasına ait.
        </Text>
        {ghostActive > 0 ? (
          <View style={{ marginTop: 12 }}>
            <GhostActivityBadge count={ghostActive} />
          </View>
        ) : null}
        <Text style={{ color: "#F5C842", fontFamily: "Inter_700Bold", fontSize: 34, marginTop: 28, fontVariant: ["tabular-nums"] }}>
          {remaining}s
        </Text>
      </View>
    );
  }

  const ceteIds = new Set(state.ceteMembers.map((m) => m.id));
  const targets = state.players.filter((p) => {
    if (!p.isAlive) return false;
    if (p.id === me!.id) return false;
    if (step.roleId === "_cete" && ceteIds.has(p.id)) return false;
    return true;
  });

  return (
    <View style={{ flex: 1, padding: 18, backgroundColor: BG }}>
      <View style={{ alignItems: "center", paddingVertical: 14 }}>
        <Text style={{ color: "#9B7FD4", fontFamily: "Inter_500Medium", letterSpacing: 1.5, fontSize: 11 }}>
          GECE AKSİYONU
        </Text>
        <Text style={{ color: "#E8DEFF", fontFamily: "Cinzel_700Bold", fontSize: 22, marginTop: 6, letterSpacing: 2 }}>
          {roleLabel}
        </Text>
        <Text style={{ color: "#F5C842", fontFamily: "Inter_700Bold", fontSize: 34, marginTop: 8, fontVariant: ["tabular-nums"] }}>
          {remaining}s
        </Text>
        {ghostActive > 0 ? (
          <View style={{ marginTop: 8 }}>
            <GhostActivityBadge count={ghostActive} />
          </View>
        ) : null}
      </View>
      <Text style={{ color: "#9B7FD4", fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 14 }}>
        {step.roleId === "_cete"
          ? "Hedef seç. Çoğunluk kazanır."
          : "Bu gece kimi hedefleyeceksin?"}
      </Text>
      {targets.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => emit("nightAction", { targetId: p.id })}
          style={({ pressed }) => [
            styles.targetRow,
            {
              backgroundColor: pressed ? "#1A0A3E" : "#2A1060",
              borderColor: pressed ? "#1ECBE155" : "#3B1F8C",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={styles.avatar}>
            <Text style={{ color: "#E8DEFF", fontFamily: "Inter_700Bold" }}>
              {p.nickname[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: "#E8DEFF", flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
            {p.nickname}
          </Text>
          <Feather name="target" size={18} color="#1ECBE1" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A0A3E",
    alignItems: "center",
    justifyContent: "center",
  },
  deadHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    paddingBottom: 12,
  },
  chatWrapper: {
    flex: 1,
    borderTopWidth: 1,
    padding: 14,
  },
});
