import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { HeaderBar } from "@/components/HeaderBar";
import HostPanel from "@/components/HostPanel";
import SystemToast from "@/components/SystemToast";
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

  let phaseTitle = "DAVETSİZ MİSAFİR";
  let phaseSub: string | undefined;
  let body: React.ReactNode = <LobbyScreen />;

  if (state) {
    phaseTitle = `DAVETSİZ MİSAFİR • ${state.code}`;
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

  const isPaused = state?.paused === true;

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <HeaderBar title={phaseTitle} subtitle={phaseSub} />
      <View style={{ flex: 1 }}>
        {body}
        {isPaused && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.pauseOverlay}
            pointerEvents="none"
          >
            <View style={styles.pauseBadge}>
              <Text style={styles.pauseIcon}>⏸</Text>
              <Text style={styles.pauseTitle}>OYUN DURAKLATILDI</Text>
              <Text style={styles.pauseSub}>Host oyunu duraklattı. Kısa sürede devam edilecek.</Text>
            </View>
          </Animated.View>
        )}
      </View>
      <HostPanel />
      <SystemToast />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6, 3, 16, 0.82)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
  pauseBadge: {
    alignItems: "center",
    paddingHorizontal: 36,
    paddingVertical: 40,
    borderRadius: 20,
    backgroundColor: "#14053A",
    borderWidth: 1,
    borderColor: "#3B1F8C",
    maxWidth: 320,
    gap: 10,
  },
  pauseIcon: {
    fontSize: 52,
  },
  pauseTitle: {
    color: "#E8DEFF",
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: 2,
    textAlign: "center",
  },
  pauseSub: {
    color: "#9B7FD4",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
});
