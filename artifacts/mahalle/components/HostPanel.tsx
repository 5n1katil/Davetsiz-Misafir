import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { ROLE_DEFS } from "@/constants/roles";

const PHASE_LABELS: Record<string, string> = {
  ROLE_SELECT: "Rol Seçimi",
  ROLE_REVEAL: "Rol Açıklaması",
  DAY: "Gündüz",
  VOTE: "Oylama",
  VOTE_RUNOFF: "Uzatma Oylaması",
  NIGHT: "Gece",
  NIGHT_ROLE: "Gece Aksiyonları",
  ENDED: "Oyun Bitti",
};

const ACTIVE_PHASES = ["ROLE_SELECT", "ROLE_REVEAL", "DAY", "VOTE", "VOTE_RUNOFF", "NIGHT", "NIGHT_ROLE"];

export default function HostPanel() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { state, myPlayerId, emit } = useGame();
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState(0);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const frozenRemainingRef = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTicker((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const isHost = state && myPlayerId === state.hostId;
  if (!isHost || !state || !ACTIVE_PHASES.includes(state.phase)) return null;

  const gs = state;

  const liveRemainingMs = gs.phaseDeadline
    ? Math.max(0, gs.phaseDeadline - Date.now())
    : null;
  const liveRemainingSec = liveRemainingMs !== null ? Math.ceil(liveRemainingMs / 1000) : null;

  // Freeze displayed countdown while paused so it doesn't keep ticking down on-screen
  if (!gs.paused) {
    frozenRemainingRef.current = null;
  } else if (frozenRemainingRef.current === null && liveRemainingSec !== null) {
    frozenRemainingRef.current = liveRemainingSec;
  }
  const remainingSec = gs.paused ? frozenRemainingRef.current : liveRemainingSec;

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}s`;
  };

  function openPanel() {
    setOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function closePanel() {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setOpen(false));
  }

  async function handlePauseResume() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (gs.paused) {
      await emit("resumeGame");
    } else {
      await emit("pauseGame");
    }
  }

  async function handleStartNight() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const res = await emit("startNight");
    if (!res.ok) Alert.alert("Hata", res.error ?? "Bilinmeyen hata");
  }

  function handleEndDayEarly() {
    Alert.alert(
      "Oylamaya Geç",
      "Gündüz tartışmasını bitirip hemen oylamaya geçmek istiyor musun?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Oylamaya Geç",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            const res = await emit("endDayEarly");
            if (!res.ok) Alert.alert("Hata", res.error ?? "Bilinmeyen hata");
          },
        },
      ],
    );
  }

  function handleKick(targetId: string, nickname: string) {
    Alert.alert(
      "Oyuncuyu Çıkar",
      `${nickname} adlı oyuncuyu odadan çıkarmak istediğine emin misin?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkar",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const res = await emit("kickPlayer", { targetId });
            if (!res.ok) Alert.alert("Hata", res.error ?? "Bilinmeyen hata");
          },
        },
      ],
    );
  }

  function handleTransferHost(newHostId: string, nickname: string) {
    const currentPhaseLabel = PHASE_LABELS[gs.phase] ?? gs.phase;
    const phaseWarning = `\n\n⚠️ Oyun şu an "${currentPhaseLabel}" aşamasında. Devrettiğinde bu aşamanın kontrolü de ${nickname} adlı oyuncuya geçecek.`;
    const powersLost =
      "Bunu yaparsanız şu yetkilerini kaybedersin:\n• Oyunu duraklatma / devam ettirme\n• Oyuncu atma\n• Gece aşaması kontrolü";

    Alert.alert(
      "Host Devret",
      `${nickname} adlı oyuncuyu yeni host yapmak istediğine emin misin?\n\n${powersLost}${phaseWarning}`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Host Yap",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            const res = await emit("transferHost", { newHostId });
            if (!res.ok) Alert.alert("Hata", res.error ?? "Bilinmeyen hata");
            else closePanel();
          },
        },
      ],
    );
  }

  const graveyardMap = Object.fromEntries(
    gs.graveyard.map((g) => [g.playerId, g]),
  );

  const nightTotal = gs.nightOrderQueue.length;
  const nightDone = gs.nightStepIndex;
  const nightProgress = nightTotal > 0 ? nightDone / nightTotal : 0;

  return (
    <>
      <Pressable
        onPress={openPanel}
        style={[
          styles.fab,
          {
            backgroundColor: "#F5C842",
            bottom: insets.bottom + 20,
          },
        ]}
      >
        <Feather name="sliders" size={20} color="#0A0614" />
        {gs.paused && (
          <View style={styles.pauseDot} />
        )}
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={closePanel}
      >
        <Pressable style={styles.overlay} onPress={closePanel} />
        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: c.border }]} />

          <View style={styles.panelHeader}>
            <View>
              <Text style={[styles.phaseLabel, { color: c.mutedForeground }]}>FAZA GENEL BAKIŞ</Text>
              <Text style={[styles.phaseName, { color: c.foreground }]}>
                {PHASE_LABELS[gs.phase] ?? gs.phase}
              </Text>
            </View>
            {remainingSec !== null && (
              <View style={[styles.timerBadge, { backgroundColor: gs.paused ? "#2A1060" : "#F5C842" }]}>
                <Text style={[styles.timerText, { color: gs.paused ? "#9B7FD4" : "#0A0614" }]}>
                  {gs.paused ? "⏸" : "⏱"} {formatTime(remainingSec)}
                </Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={handlePauseResume}
            style={[
              styles.pauseBtn,
              {
                backgroundColor: gs.paused ? "#1ECBE1" : "#2A1060",
                borderColor: gs.paused ? "#1ECBE1" : c.border,
              },
            ]}
          >
            <Feather
              name={gs.paused ? "play" : "pause"}
              size={16}
              color={gs.paused ? "#0A0614" : c.foreground}
            />
            <Text
              style={{
                color: gs.paused ? "#0A0614" : c.foreground,
                fontFamily: "Inter_600SemiBold",
                marginLeft: 8,
              }}
            >
              {gs.paused ? "Devam Et" : "Beklet"}
            </Text>
          </Pressable>

          {gs.phase === "DAY" && (
            <Pressable
              onPress={handleEndDayEarly}
              style={[styles.nightBtn, { backgroundColor: "#1ECBE1", borderColor: "#1ECBE1" }]}
            >
              <Feather name="check-circle" size={16} color="#0A0614" />
              <Text style={{ color: "#0A0614", fontFamily: "Inter_600SemiBold", marginLeft: 8 }}>
                Oylamaya Geç
              </Text>
            </Pressable>
          )}

          {(gs.phase === "DAY" || gs.phase === "NIGHT") && (
            <Pressable
              onPress={handleStartNight}
              style={[styles.nightBtn, { backgroundColor: "#C8102E", borderColor: "#C8102E" }]}
            >
              <Feather name="moon" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", marginLeft: 8 }}>
                {gs.phase === "DAY" ? "Geceyi Başlat (Gündüzü Atla)" : "Geceyi Başlat"}
              </Text>
            </Pressable>
          )}

          {gs.phase === "NIGHT_ROLE" && nightTotal > 0 && (
            <View style={styles.progressWrap}>
              <View style={styles.progressRow}>
                <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                  Gece sırası
                </Text>
                <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
                  {nightDone}/{nightTotal}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: "#2A1060", flexDirection: "row" }]}>
                {nightProgress > 0 && (
                  <View style={[styles.progressFill, { flex: nightProgress, backgroundColor: "#F5C842" }]} />
                )}
                {nightProgress < 1 && (
                  <View style={{ flex: 1 - nightProgress }} />
                )}
              </View>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: c.border }]} />

          <Text style={[styles.playersTitle, { color: c.mutedForeground }]}>
            OYUNCULAR ({gs.players.length})
          </Text>

          <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
            {gs.players.map((p) => {
              const dead = graveyardMap[p.id];
              const role = dead ? ROLE_DEFS[dead.roleId] : null;
              return (
                <View
                  key={p.id}
                  style={[
                    styles.playerRow,
                    { borderBottomColor: c.border, opacity: dead ? 0.6 : 1 },
                  ]}
                >
                  <View style={styles.playerAvatar}>
                    <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                      {p.nickname[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.foreground, fontFamily: "Inter_500Medium", fontSize: 14 }}>
                      {p.nickname}
                      {dead ? "  💀" : ""}
                    </Text>
                    {role && (
                      <Text style={{ color: "#9B7FD4", fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 }}>
                        {role.emoji} {role.name}
                      </Text>
                    )}
                  </View>
                  {p.id !== myPlayerId && !dead && (
                    <Pressable
                      onPress={() => handleTransferHost(p.id, p.nickname)}
                      hitSlop={8}
                      style={[styles.actionBtn, { borderColor: "#F5C842" }]}
                    >
                      <Feather name="award" size={14} color="#F5C842" />
                    </Pressable>
                  )}
                  {p.id !== myPlayerId && ["LOBBY", "DAY"].includes(gs.phase) && !dead && (
                    <Pressable
                      onPress={() => handleKick(p.id, p.nickname)}
                      hitSlop={8}
                      style={[styles.actionBtn, { borderColor: "#C8102E" }]}
                    >
                      <Feather name="user-x" size={14} color="#C8102E" />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  pauseDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1ECBE1",
    borderWidth: 2,
    borderColor: "#F5C842",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 20,
    gap: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  phaseLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  phaseName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginTop: 2,
  },
  timerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  pauseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  nightBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressWrap: { gap: 6 },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  playersTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  playerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2A1060",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
