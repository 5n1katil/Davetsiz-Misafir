import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import { Btn } from "@/components/Btn";
import { ROLE_DEFS } from "@/constants/roles";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { useCountdown } from "@/hooks/useCountdown";

const ROLE_LABELS: Record<string, string> = {
  _cete: "Tefeci Çetesi",
  bekci: "Bekçi",
  otaci: "Otacı Teyze",
  falci: "Falcı",
};

export default function NightScreen() {
  const c = useColors();
  const { state, myPlayerId, emit } = useGame();
  const remaining = useCountdown(state?.phaseDeadline ?? null);
  const me = state?.players.find((p) => p.id === myPlayerId);
  const isHost = state && me && me.id === state.hostId;

  const moonAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moonAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(moonAnim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start();
  }, [moonAnim]);

  if (!state) return null;

  if (state.phase === "NIGHT") {
    return (
      <View style={[styles.intro, { backgroundColor: "#05070F" }]}>
        <Animated.Text
          style={{
            fontSize: 72,
            opacity: moonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
            transform: [
              { scale: moonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) },
            ],
          }}
        >
          🌙
        </Animated.Text>
        <Text style={{ color: "#F4ECDA", fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 16, textAlign: "center" }}>
          Mahalle uykuya daldı...
        </Text>
        <Text style={{ color: "#7E7C92", marginTop: 8, fontFamily: "Inter_400Regular", textAlign: "center" }}>
          Gözlerinizi kapatın
        </Text>
        {isHost ? (
          <Btn
            label="▶ Devam Et"
            onPress={() => emit("startNight")}
            style={{ marginTop: 32, alignSelf: "stretch", marginHorizontal: 30 }}
          />
        ) : null}
      </View>
    );
  }

  // NIGHT_ROLE
  const step = state.nightStep;
  if (!step) return null;
  const roleLabel = ROLE_LABELS[step.roleId] ?? step.roleId;
  const isMyTurn =
    step.roleId === "_cete"
      ? !!me && step.actorIds.includes(me.id)
      : me?.roleId === step.roleId;

  if (!isMyTurn) {
    return (
      <View style={[styles.intro, { backgroundColor: "#05070F" }]}>
        <Feather name="moon" size={56} color="#E9B342" />
        <Text style={{ color: "#F4ECDA", fontFamily: "Inter_700Bold", fontSize: 20, marginTop: 16, textAlign: "center" }}>
          {roleLabel} uyanıyor...
        </Text>
        <Text style={{ color: "#7E7C92", marginTop: 8, fontFamily: "Inter_400Regular", textAlign: "center" }}>
          Sen uyu. Aksiyon başkasına ait.
        </Text>
        <Text style={{ color: "#E9B342", fontFamily: "Inter_700Bold", fontSize: 32, marginTop: 28 }}>
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
    <View style={{ flex: 1, padding: 18, backgroundColor: "#05070F" }}>
      <View style={{ alignItems: "center", paddingVertical: 12 }}>
        <Text style={{ color: "#7E7C92", fontFamily: "Inter_500Medium", letterSpacing: 1, fontSize: 12 }}>
          GECE AKSİYONU
        </Text>
        <Text style={{ color: "#F4ECDA", fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 6 }}>
          {roleLabel}
        </Text>
        <Text style={{ color: "#E9B342", fontFamily: "Inter_700Bold", fontSize: 32, marginTop: 6 }}>
          {remaining}s
        </Text>
      </View>
      <Text style={{ color: "#B7B6C4", fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 12 }}>
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
              backgroundColor: "#141A2E",
              borderColor: "#2C3350",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#1B2238",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#F4ECDA", fontFamily: "Inter_700Bold" }}>
              {p.nickname[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: "#F4ECDA", flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
            {p.nickname}
          </Text>
          <Feather name="target" size={18} color="#E9B342" />
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
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
});
