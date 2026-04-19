import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeaderBar } from "@/components/HeaderBar";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import DayScreen from "@/screens/DayScreen";
import EndScreen from "@/screens/EndScreen";
import LobbyScreen from "@/screens/LobbyScreen";
import NightScreen from "@/screens/NightScreen";
import RoleRevealScreen from "@/screens/RoleRevealScreen";
import RoleSelectScreen from "@/screens/RoleSelectScreen";
import VoteScreen from "@/screens/VoteScreen";

export default function Index() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { connected, state } = useGame();

  if (!connected && !state) {
    return (
      <View style={[styles.center, { backgroundColor: c.background, paddingTop: insets.top }]}>
        <ActivityIndicator color={c.primary} />
        <Text style={{ color: c.mutedForeground, marginTop: 12, fontFamily: "Inter_400Regular" }}>
          Mahalleye bağlanılıyor...
        </Text>
      </View>
    );
  }

  let phaseTitle = "MAHALLE";
  let phaseSub: string | undefined;
  let body: React.ReactNode = <LobbyScreen />;

  if (state) {
    phaseTitle = `MAHALLE • ${state.code}`;
    if (state.phase === "LOBBY") {
      phaseSub = "Bekleme odası";
      body = <LobbyScreen />;
    } else if (state.phase === "ROLE_SELECT") {
      phaseSub = "Rol dağıtımı";
      body = <RoleSelectScreen />;
    } else if (state.phase === "ROLE_REVEAL") {
      phaseSub = "Rolünü incele";
      body = <RoleRevealScreen />;
    } else if (state.phase === "DAY") {
      phaseSub = `Gün ${state.round} • Mahalle meydanı`;
      body = <DayScreen />;
    } else if (state.phase === "VOTE" || state.phase === "VOTE_RUNOFF") {
      phaseSub = "Oylama açık";
      body = <VoteScreen />;
    } else if (state.phase === "NIGHT" || state.phase === "NIGHT_ROLE") {
      phaseSub = "Gece çöktü";
      body = <NightScreen />;
    } else if (state.phase === "ENDED") {
      phaseSub = "Sonuç";
      body = <EndScreen />;
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <HeaderBar title={phaseTitle} subtitle={phaseSub} />
      <View style={{ flex: 1 }}>{body}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
