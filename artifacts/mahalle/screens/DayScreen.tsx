import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { Btn } from "@/components/Btn";
import { GraveyardChat } from "@/components/GraveyardChat";
import { GhostActivityBadge } from "@/components/GhostActivityBadge";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { useCountdown } from "@/hooks/useCountdown";
import { useGhostActivity } from "@/hooks/useGhostActivity";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import roleImages from "@/constants/roleImages";

interface MorningEvent {
  kind: "death" | "calm" | "saved" | "info" | "sahte_dernek_lynched";
  message: string;
  victims?: string[];
}

interface GraveyardEntry {
  playerId: string;
  nickname: string;
  roleId: string;
  cause: string;
}

const EVENT_CONFIG: Record<
  string,
  { icon: string; bgColor: string; borderColor: string; textColor: string; label: string }
> = {
  death: {
    icon: "💀",
    bgColor: "#2D0A0A",
    borderColor: "#7F1D1D",
    textColor: "#FCA5A5",
    label: "KAYIP",
  },
  calm: {
    icon: "🌅",
    bgColor: "#052E16",
    borderColor: "#14532D",
    textColor: "#86EFAC",
    label: "SABAH",
  },
  saved: {
    icon: "🛡️",
    bgColor: "#052E16",
    borderColor: "#166534",
    textColor: "#4ADE80",
    label: "KURTARILDI",
  },
  info: {
    icon: "ℹ️",
    bgColor: "#0C1A2E",
    borderColor: "#1E3A5F",
    textColor: "#93C5FD",
    label: "DUYURU",
  },
  sahte_dernek_lynched: {
    icon: "⚠️",
    bgColor: "#2D1500",
    borderColor: "#7C2D12",
    textColor: "#FCD34D",
    label: "UYARI",
  },
  warning: {
    icon: "⚠️",
    bgColor: "#2D1500",
    borderColor: "#7C2D12",
    textColor: "#FCD34D",
    label: "UYARI",
  },
};

function getEventConfig(kind: string) {
  return EVENT_CONFIG[kind] ?? EVENT_CONFIG.info;
}

interface AnimatedEventCardProps {
  event: MorningEvent;
  index: number;
  graveyard: GraveyardEntry[];
  reduceMotion: boolean;
}

function AnimatedEventCard({ event, index, graveyard, reduceMotion }: AnimatedEventCardProps) {
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : 28)).current;
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const delay = index * 140;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cfg = getEventConfig(event.kind);

  const victimGrave =
    event.kind === "death" && event.victims && event.victims.length > 0
      ? graveyard.find((g) => g.nickname === event.victims![0])
      : null;

  const roleImage = victimGrave ? roleImages[victimGrave.roleId] : null;

  return (
    <Animated.View
      style={[
        styles.eventItem,
        {
          backgroundColor: cfg.bgColor,
          borderColor: cfg.borderColor,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.eventHeader}>
        <Text style={styles.eventIcon}>{cfg.icon}</Text>
        <Text style={[styles.eventLabel, { color: cfg.textColor }]}>{cfg.label}</Text>
      </View>

      {event.kind === "death" && victimGrave && roleImage ? (
        <View style={styles.deathContent}>
          <Image source={roleImage} style={styles.roleAvatar} resizeMode="cover" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.eventMessage, { color: cfg.textColor }]}>{event.message}</Text>
            <Text style={[styles.causeText, { color: cfg.textColor }]}>{victimGrave.cause}</Text>
          </View>
        </View>
      ) : event.kind === "death" && victimGrave ? (
        <View style={{ marginTop: 4 }}>
          <Text style={[styles.eventMessage, { color: cfg.textColor }]}>{event.message}</Text>
          <Text style={[styles.causeText, { color: cfg.textColor }]}>{victimGrave.cause}</Text>
        </View>
      ) : event.kind === "saved" && event.victims && event.victims.length > 0 ? (
        <View style={{ marginTop: 6 }}>
          <Text style={[styles.savedNickname, { color: cfg.textColor }]}>{event.victims[0]}</Text>
          <Text style={[styles.causeText, { color: cfg.textColor, opacity: 0.8, marginTop: 3 }]}>
            {event.message}
          </Text>
        </View>
      ) : (
        <Text style={[styles.eventMessage, { color: cfg.textColor, marginTop: 4 }]}>
          {event.message}
        </Text>
      )}
    </Animated.View>
  );
}

export default function DayScreen() {
  const c = useColors();
  const { state, myPlayerId, emit } = useGame();
  const remaining = useCountdown(state?.phaseDeadline ?? null, state?.paused ?? false);
  const reduceMotion = useReduceMotion();
  if (!state) return null;
  const me = state.players.find((p) => p.id === myPlayerId);
  const alive = state.players.filter((p) => p.isAlive && p.isConnected);
  const need = Math.ceil(alive.length / 2);
  const isDead = !me?.isAlive;
  const ghostActive = useGhostActivity();

  const mins = Math.floor(remaining / 60);
  const secs = (remaining % 60).toString().padStart(2, "0");
  const isCritical = remaining <= 10 && remaining > 0 && !state.paused;

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const critColorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isCritical && !reduceMotion) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]),
        { iterations: -1 },
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(critColorAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(critColorAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
        ]),
      ).start();
    } else {
      shakeAnim.stopAnimation();
      shakeAnim.setValue(0);
      critColorAnim.stopAnimation();
      critColorAnim.setValue(isCritical ? 1 : 0);
    }
  }, [isCritical, reduceMotion]);

  const timerColor = reduceMotion
    ? isCritical
      ? c.destructive
      : c.primary
    : critColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [c.primary, c.destructive],
      });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ backgroundColor: c.background }}
        contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: isDead ? 6 : 18 }}
      >
        <View style={[styles.timerCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="sun" size={18} color={c.primary} />
          <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 1.5, marginTop: 4 }}>
            GÜN {state.round}
          </Text>
          <Animated.Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 52,
              letterSpacing: 2,
              color: timerColor,
              transform: [{ translateX: shakeAnim }],
              fontVariant: ["tabular-nums"],
            }}
          >
            {mins}:{secs}
          </Animated.Text>
        </View>

        {state.morningEvents.length > 0 ? (
          <View style={styles.morningSection}>
            <Text style={[styles.sectionHeading, { color: c.mutedForeground }]}>
              SABAH DUYURUSU
            </Text>
            {state.morningEvents.map((e, i) => (
              <AnimatedEventCard
                key={i}
                event={e}
                index={i}
                graveyard={state.graveyard}
                reduceMotion={reduceMotion}
              />
            ))}
          </View>
        ) : null}

        {state.privateMessages.length > 0 ? (
          <View style={[styles.eventCard, { backgroundColor: "#0D1F3A", borderColor: "#1ECBE155" }]}>
            <Text style={{ color: "#1ECBE1", fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.5 }}>
              SANA ÖZEL BİLGİ
            </Text>
            {state.privateMessages.map((m, i) => (
              <Text key={i} style={{ color: c.foreground, marginTop: 6, fontFamily: "Inter_500Medium", fontSize: 14 }}>
                {m.msg}
              </Text>
            ))}
          </View>
        ) : null}

        {state.myRole === "anonim" && state.anonimMarks !== undefined ? (
          <View style={[styles.eventCard, { backgroundColor: "#1A0D2E", borderColor: "#A855F755" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: "#A855F7", fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.5 }}>
                İŞARETLENEN KİŞİLER
              </Text>
              <Text style={{ color: "#A855F7", fontFamily: "Inter_700Bold", fontSize: 13 }}>
                {state.anonimLynchedCount ?? 0}/3 linç edildi
              </Text>
            </View>
            {state.anonimMarks.length === 0 ? (
              <Text style={{ color: c.mutedForeground, marginTop: 8, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                Henüz kimseyi işaretlemedin.
              </Text>
            ) : (
              state.anonimMarks.map((markId) => {
                const marked = state.players.find((p) => p.id === markId);
                const graveyardEntry = state.graveyard.find((g) => g.playerId === markId);
                const isLynched = graveyardEntry?.cause === "Linç edildi";
                const isDead = marked ? !marked.isAlive : !!graveyardEntry;
                return (
                  <View key={markId} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <Feather
                      name={isLynched ? "check-circle" : isDead ? "x-circle" : "target"}
                      size={14}
                      color={isLynched ? "#22C55E" : isDead ? c.mutedForeground : "#A855F7"}
                    />
                    <Text
                      style={{
                        color: isLynched ? "#22C55E" : isDead ? c.mutedForeground : c.foreground,
                        fontFamily: "Inter_500Medium",
                        fontSize: 14,
                        textDecorationLine: isDead ? "line-through" : "none",
                      }}
                    >
                      {marked?.nickname ?? graveyardEntry?.nickname ?? markId}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {state.myRole === "kiskanc_komsu" && state.kiskanKopyaTarget ? (
          <View style={[styles.eventCard, { backgroundColor: "#1A1A0D", borderColor: "#EAB30855" }]}>
            <Text style={{ color: "#EAB308", fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.5 }}>
              KOPYA HEDEFİN
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
              <Feather name="copy" size={14} color="#EAB308" />
              <Text style={{ color: c.foreground, fontFamily: "Inter_500Medium", fontSize: 14 }}>
                {state.players.find((p) => p.id === state.kiskanKopyaTarget)?.nickname ?? state.kiskanKopyaTarget}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={{ color: c.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1.5 }}>
            HAYATTA OLAN ({alive.length})
          </Text>
          {ghostActive > 0 ? <GhostActivityBadge count={ghostActive} /> : null}
        </View>
        <View style={[styles.playerCard, { backgroundColor: c.card, borderColor: c.border }]}>
          {state.players.map((p) => (
            <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: p.isAlive ? c.elevated : c.muted,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: p.isAlive ? 1 : 0.4,
                }}
              >
                <Text style={{ color: p.isAlive ? c.foreground : c.mutedForeground, fontFamily: "Inter_700Bold", fontSize: 13 }}>
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
                <Feather name="x-circle" size={14} color={c.destructive} />
              ) : !p.isConnected ? (
                <Feather name="wifi-off" size={14} color={c.mutedForeground} />
              ) : null}
            </View>
          ))}
        </View>

        {!isDead ? (
          <Btn
            label={`⚖️ Oylama Öner (${state.voteOpenBy}/${need})`}
            variant="primary"
            onPress={() => emit("proposeVote")}
          />
        ) : null}
      </ScrollView>

      {isDead ? (
        <View style={[styles.chatPanel, { borderColor: c.border, backgroundColor: c.background }]}>
          <GraveyardChat />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  timerCard: { padding: 22, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 4 },
  eventCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  playerCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  chatPanel: {
    padding: 14,
    borderTopWidth: 1,
    height: 280,
  },
  morningSection: {
    gap: 8,
  },
  sectionHeading: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  eventItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  eventIcon: {
    fontSize: 16,
  },
  eventLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.5,
  },
  eventMessage: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  deathContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  roleAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  causeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 3,
    opacity: 0.65,
  },
  savedNickname: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    lineHeight: 24,
  },
});
