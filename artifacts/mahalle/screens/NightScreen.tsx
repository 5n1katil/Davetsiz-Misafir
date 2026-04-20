import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Btn } from "@/components/Btn";
import { GhostActivityBadge } from "@/components/GhostActivityBadge";
import { GraveyardChat } from "@/components/GraveyardChat";
import roleImages from "@/constants/roleImages";
import { ROLE_DEFS, ROLE_TEAM_COLOR } from "@/constants/roles";
import { useGame } from "@/contexts/GameContext";
import { useCountdown } from "@/hooks/useCountdown";
import { useGhostActivity } from "@/hooks/useGhostActivity";
import { useReduceMotion } from "@/hooks/useReduceMotion";

function getNightResultStyle(msg: string): { accent: string; bg: string; disclaimer?: string; blocked?: boolean } {
  if (msg.startsWith("🔒")) return { accent: "#6B7280", bg: "#131313", blocked: true };
  if (msg.startsWith("🔦")) return { accent: "#1ECBE1", bg: "#0A1E2E" };
  if (msg.startsWith("🔮")) return {
    accent: "#B07EFF",
    bg: "#1A0E2E",
    disclaimer: "⚠️ %20 ihtimalle yanlış görülebilir.",
  };
  if (msg.startsWith("🧂")) return { accent: "#9CA3AF", bg: "#151515" };
  if (msg.startsWith("🐍")) return { accent: "#F87171", bg: "#1E0F0F" };
  if (msg.startsWith("🎰")) return { accent: "#FBBF24", bg: "#1E1700" };
  if (msg.startsWith("💔")) return { accent: "#FB7185", bg: "#1E0A12" };
  if (msg.startsWith("🎭")) return { accent: "#60A5FA", bg: "#0C1628" };
  return { accent: "#1ECBE1", bg: "#0D1F3A" };
}

function formatResultMsg(msg: string): string {
  const bekciMatch = msg.match(/^🔦 Bekçi raporu: (.+?) → (KÖTÜ EKİP \(çete\)|İYİ EKİP)$/);
  if (bekciMatch) {
    const nickname = bekciMatch[1];
    const team = bekciMatch[2].startsWith("KÖTÜ") ? "ÇETE" : "MAHALLE";
    return `🔦 Sorgu Sonucu: ${nickname} — ${team}`;
  }
  return msg;
}

const BG = "#060310";

// Roles whose identity must stay hidden from other players during night
const HIDDEN_ROLES = new Set(["anonim", "kahraman_dede", "kumarbaz"]);

const ROLE_INSTRUCTIONS: Record<string, string> = {
  _cete: "Hedef seçin. Çoğunluk kazanır.",
  bekci: "Bu gece kimin ekibini sorguluyorsun?",
  otaci: "Bu gece kimi koruyorsun?",
  falci: "Bu gece kimin falına bakıyorsun?",
  kapici: "Bu gece hangi evi kilitleyeceksin?",
  hoca: "Kime dua edeceksin? (Tek kullanımlık güç)",
  kumarbaz: "İki kişiyi seç — rolleri kalıcı olarak takas edilecek.",
  kiskanc_komsu: "Bu gece kimin eylemini taklit edeceksin?",
  anonim: "Bu gece gizlice kimi işaretliyorsun?",
  kahraman_dede: "Bu gece kim mahalleni bozuyor?",
};

function getRoleAccent(roleId: string): string {
  if (roleId === "_cete") return ROLE_TEAM_COLOR.kotu;
  const def = ROLE_DEFS[roleId];
  if (!def) return "#1ECBE1";
  return ROLE_TEAM_COLOR[def.team] ?? "#1ECBE1";
}

export default function NightScreen() {
  const { state, myPlayerId, emit, nightResultMessages, clearNightResult } = useGame();
  const remaining = useCountdown(state?.phaseDeadline ?? null, state?.paused ?? false);
  const reduceMotion = useReduceMotion();
  const me = state?.players.find((p) => p.id === myPlayerId);
  const isHost = state && me && me.id === state.hostId;
  const isDead = !me?.isAlive;
  const ghostActive = useGhostActivity();

  const [kumarbazFirst, setKumarbazFirst] = useState<string | null>(null);
  const [kumarbazSecond, setKumarbazSecond] = useState<string | null>(null);
  const [localResult, setLocalResult] = useState<{ msg: string; ts: number }[]>([]);
  const resultFadeAnim = useRef(new Animated.Value(0)).current;

  const moonAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) { moonAnim.setValue(0.5); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(moonAnim, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(moonAnim, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [moonAnim, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) { pulseAnim.setValue(1); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim, reduceMotion]);

  // Reset kumarbaz selection when night step changes
  const step = state?.nightStep;
  const stepRoleId = step?.roleId;
  useEffect(() => {
    setKumarbazFirst(null);
    setKumarbazSecond(null);
  }, [stepRoleId]);

  // Capture new private messages that arrive during NIGHT_ROLE and show them inline
  useEffect(() => {
    if (nightResultMessages.length === 0) return;
    setLocalResult((prev) => [...prev, ...nightResultMessages]);
    clearNightResult();
    resultFadeAnim.setValue(0);
    Animated.timing(resultFadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [nightResultMessages]);

  // Clear local result when a new night begins
  useEffect(() => {
    if (state?.phase === "NIGHT") {
      setLocalResult([]);
      resultFadeAnim.setValue(0);
    }
  }, [state?.phase]);

  if (!state) return null;

  // ── Dead player view ────────────────────────────────────────────────────────
  if (isDead) {
    return (
      <View style={{ flex: 1, backgroundColor: "#05070F" }}>
        <View style={styles.deadHeader}>
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

  // ── NIGHT intro screen (before startNight is pressed) ───────────────────────
  if (state.phase === "NIGHT") {
    return (
      <View style={[styles.intro, { backgroundColor: BG }]}>
        <Animated.Text
          style={{
            fontSize: 80,
            opacity: moonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
            transform: [{ scale: moonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1.07] }) }],
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

  // ── Night role phase ─────────────────────────────────────────────────────────
  if (!step) return null;

  const roleId = step.roleId;
  const roleDef = roleId !== "_cete" ? ROLE_DEFS[roleId] : null;
  const roleLabel = roleId === "_cete" ? "Davetsiz Misafir" : (roleDef?.name ?? roleId);
  const roleEmoji = roleId === "_cete" ? "🚪" : (roleDef?.emoji ?? "🌙");
  const accent = getRoleAccent(roleId);
  const instruction = ROLE_INSTRUCTIONS[roleId] ?? "Bu gece kimi hedefleyeceksin?";

  const isMyTurn =
    roleId === "_cete"
      ? !!me && step.actorIds.includes(me.id)
      : state.myRole === roleId;

  if (!isMyTurn) {
    // If we just submitted our action and have a result, show it inline
    if (localResult.length > 0) {
      return (
        <View style={[styles.intro, { backgroundColor: BG }]}>
          <Animated.View style={{ opacity: resultFadeAnim, width: "100%", maxWidth: 380 }}>
            <View style={[styles.resultSubmittedHint]}>
              <Feather name="check-circle" size={16} color="#6EE7B7" />
              <Text style={{ color: "#6EE7B7", fontFamily: "Inter_600SemiBold", fontSize: 13, marginLeft: 8 }}>
                Aksiyon gönderildi — sonuç aşağıda
              </Text>
            </View>
            {localResult.map((item, idx) => {
              const { accent, bg, disclaimer, blocked } = getNightResultStyle(item.msg);
              const formatted = formatResultMsg(item.msg);
              return (
                <View key={idx} style={[styles.resultCard, { backgroundColor: bg, borderColor: accent + "55" }]}>
                  <View style={[styles.resultAccentBar, { backgroundColor: accent }]} />
                  <View style={{ flex: 1, paddingLeft: 12 }}>
                    <Text style={{ color: accent, fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 0.5, marginBottom: 4 }}>
                      {blocked ? "SORGU ENGELLENDİ" : "GECE AKSIYON SONUCU"}
                    </Text>
                    <Text style={{ color: blocked ? "#9CA3AF" : "#E8DEFF", fontFamily: "Inter_600SemiBold", fontSize: 15, lineHeight: 22 }}>
                      {formatted}
                    </Text>
                    {disclaimer ? (
                      <Text style={{ color: "#9B7FD4", fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 6 }}>
                        {disclaimer}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
            <Text style={{ color: "#7E7C92", fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", marginTop: 16 }}>
              Diğer rollerin bitmesini bekliyorsun...
            </Text>
          </Animated.View>
          {ghostActive > 0 ? (
            <View style={{ marginTop: 16 }}>
              <GhostActivityBadge count={ghostActive} />
            </View>
          ) : null}
        </View>
      );
    }

    const isHiddenRole = HIDDEN_ROLES.has(roleId);
    return (
      <View style={[styles.intro, { backgroundColor: BG }]}>
        <Feather name="moon" size={52} color="#F5C842" />
        <Text style={{ color: "#E8DEFF", fontFamily: "Cinzel_700Bold", fontSize: 20, marginTop: 16, textAlign: "center", letterSpacing: 2 }}>
          {isHiddenRole ? "Biri uyanıyor..." : `${roleLabel} uyanıyor...`}
        </Text>
        <Text style={{ color: "#9B7FD4", marginTop: 8, fontFamily: "Inter_400Regular", textAlign: "center" }}>
          {isHiddenRole
            ? "Gözlerini kapat. Kim olduğu gizli."
            : "Sen uyu. Aksiyon başkasına ait."}
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

  if (roleId === "hoca" && state.hocaUsed) {
    return (
      <View style={[styles.intro, { backgroundColor: BG }]}>
        <Text style={{ fontSize: 64 }}>📿</Text>
        <Text style={{ color: "#E8DEFF", fontFamily: "Cinzel_700Bold", fontSize: 20, marginTop: 16, textAlign: "center", letterSpacing: 2 }}>
          Hoca
        </Text>
        <View style={[styles.infoNote, { borderColor: accent + "55" }]}>
          <Feather name="check-circle" size={18} color={accent} />
          <Text style={{ color: "#C3AEFF", fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, flex: 1, marginLeft: 10 }}>
            Duan edildi — bu gece eylemsizsin.{"\n"}
            <Text style={{ color: "#7E7C92", fontSize: 12 }}>Gücünü daha önce kullandın.</Text>
          </Text>
        </View>
        <Text style={{ color: "#F5C842", fontFamily: "Inter_700Bold", fontSize: 32, marginTop: 20, fontVariant: ["tabular-nums"] }}>
          {remaining}s
        </Text>
        <Btn
          label="Tamam"
          onPress={() => emit("nightAction", { targetId: "" })}
          style={{ marginTop: 16, alignSelf: "stretch", marginHorizontal: 30 }}
        />
      </View>
    );
  }

  // ── Build target list ─────────────────────────────────────────────────────────
  const ceteIds = new Set(state.ceteMembers.map((m) => m.id));
  const allTargets = state.players.filter((p) => {
    if (!p.isAlive) return false;
    if (p.id === me!.id) return false;
    if (roleId === "_cete" && ceteIds.has(p.id)) return false;
    return true;
  });

  // Kumarbaz: filter out already-chosen players for each phase
  const targets = roleId === "kumarbaz" && kumarbazSecond
    ? []
    : roleId === "kumarbaz" && kumarbazFirst
      ? allTargets.filter((p) => p.id !== kumarbazFirst)
      : allTargets;

  const firstPlayerNick = kumarbazFirst
    ? state.players.find((p) => p.id === kumarbazFirst)?.nickname
    : null;
  const secondPlayerNick = kumarbazSecond
    ? state.players.find((p) => p.id === kumarbazSecond)?.nickname
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Role avatar */}
        <View style={[styles.avatarContainer, { borderColor: accent }]}>
          {roleImages[roleId] ? (
            <Image source={roleImages[roleId]} style={styles.roleAvatar} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 32 }}>{roleEmoji}</Text>
          )}
        </View>

        {/* Role label + team chip */}
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <View style={[styles.teamChip, { backgroundColor: accent + "22", borderColor: accent + "88" }]}>
            <Text style={{ color: accent, fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5 }}>
              {roleId === "_cete" ? "ÇETE" : (roleDef ? roleDef.team.toUpperCase() : "GECE")}
            </Text>
          </View>
          <Text style={{ color: "#E8DEFF", fontFamily: "Cinzel_700Bold", fontSize: 22, marginTop: 6, letterSpacing: 2 }}>
            {roleLabel}
          </Text>
        </View>

        {/* Timer */}
        <Text style={[styles.timer, { color: accent }]}>
          {remaining}s
        </Text>

        {ghostActive > 0 ? (
          <View style={{ marginTop: 4 }}>
            <GhostActivityBadge count={ghostActive} />
          </View>
        ) : null}
      </View>

      {/* ── Instruction ── */}
      <View style={[styles.instructionBar, { borderColor: accent + "33" }]}>
        {roleId === "kumarbaz" && kumarbazSecond ? (
          <Text style={{ color: "#C3AEFF", fontFamily: "Inter_400Regular", textAlign: "center", fontSize: 14, lineHeight: 22 }}>
            <Text style={{ color: accent, fontFamily: "Inter_600SemiBold" }}>{firstPlayerNick}</Text>
            {" "}↔️{" "}
            <Text style={{ color: accent, fontFamily: "Inter_600SemiBold" }}>{secondPlayerNick}</Text>
            {"\n"}Onaylamak için "Takas Et" butonuna bas.
          </Text>
        ) : roleId === "kumarbaz" && kumarbazFirst ? (
          <Text style={{ color: "#C3AEFF", fontFamily: "Inter_400Regular", textAlign: "center", fontSize: 14, lineHeight: 20 }}>
            <Text style={{ color: accent, fontFamily: "Inter_600SemiBold" }}>{firstPlayerNick}</Text>
            {" "}seçildi. Şimdi ikinci kişiyi seç.
          </Text>
        ) : (
          <Text style={{ color: "#9B7FD4", fontFamily: "Inter_400Regular", textAlign: "center", fontSize: 14 }}>
            {instruction}
          </Text>
        )}
      </View>

      {/* ── Target list ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
      >
        {targets.map((p) => {
          const isFirstSelected = roleId === "kumarbaz" && p.id === kumarbazFirst;
          const isSecondSelected = roleId === "kumarbaz" && p.id === kumarbazSecond;
          const isSelected = isFirstSelected || isSecondSelected;
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                if (roleId === "kumarbaz") {
                  if (!kumarbazFirst) {
                    setKumarbazFirst(p.id);
                  } else if (!kumarbazSecond) {
                    setKumarbazSecond(p.id);
                  }
                } else {
                  emit("nightAction", { targetId: p.id });
                }
              }}
              style={({ pressed }) => [
                styles.targetRow,
                {
                  backgroundColor: isSelected ? accent + "33" : pressed ? "#1A0A3E" : "#2A1060",
                  borderColor: isSelected ? accent : pressed ? (accent + "55") : "#3B1F8C",
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={[styles.playerAvatar, { backgroundColor: isSelected ? accent + "44" : "#1A0A3E" }]}>
                <Text style={{ color: "#E8DEFF", fontFamily: "Inter_700Bold", fontSize: 15 }}>
                  {p.nickname[0]?.toUpperCase()}
                </Text>
              </View>
              <Text style={{ color: "#E8DEFF", flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
                {p.nickname}
              </Text>
              {isFirstSelected ? (
                <View style={[styles.firstBadge, { backgroundColor: accent }]}>
                  <Text style={{ color: "#000", fontFamily: "Inter_700Bold", fontSize: 10 }}>1.</Text>
                </View>
              ) : isSecondSelected ? (
                <View style={[styles.firstBadge, { backgroundColor: accent }]}>
                  <Text style={{ color: "#000", fontFamily: "Inter_700Bold", fontSize: 10 }}>2.</Text>
                </View>
              ) : (
                <Feather
                  name={roleId === "anonim" ? "eye" : roleId === "kapici" ? "lock" : roleId === "kumarbaz" ? "refresh-cw" : "target"}
                  size={18}
                  color={accent}
                />
              )}
            </Pressable>
          );
        })}

        {/* Kumarbaz: "Takas Et" confirm button after both selected */}
        {roleId === "kumarbaz" && kumarbazFirst && kumarbazSecond ? (
          <Btn
            label="🎰 Takas Et"
            onPress={() => {
              emit("nightAction", { targetId: kumarbazFirst, targetId2: kumarbazSecond });
              setKumarbazFirst(null);
              setKumarbazSecond(null);
            }}
            style={{ marginTop: 8 }}
          />
        ) : null}

        {/* Kumarbaz: cancel / back button */}
        {roleId === "kumarbaz" && (kumarbazFirst || kumarbazSecond) ? (
          <Pressable
            onPress={() => {
              if (kumarbazSecond) {
                setKumarbazSecond(null);
              } else {
                setKumarbazFirst(null);
              }
            }}
            style={[styles.cancelBtn, { borderColor: "#3B1F8C" }]}
          >
            <Feather name="x" size={14} color="#9B7FD4" />
            <Text style={{ color: "#9B7FD4", fontFamily: "Inter_500Medium", fontSize: 13, marginLeft: 6 }}>
              {kumarbazSecond ? "İkinci seçimi iptal et" : "İlk seçimi iptal et"}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 18,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A0A3E",
  },
  roleAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  teamChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  timer: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    marginTop: 8,
    fontVariant: ["tabular-nums"],
  },
  instructionBar: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#0E0628",
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  firstBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#0E0628",
    maxWidth: 320,
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
  resultSubmittedHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  resultCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  resultAccentBar: {
    width: 4,
    borderRadius: 2,
    alignSelf: "stretch",
  },
});
