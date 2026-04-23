import * as Haptics from "expo-haptics";
import { haptic } from "@/lib/haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { ROLE_DEFS, ROLE_TEAM_COLOR, ROLE_TEAM_LABEL } from "@/constants/roles";
import roleImages from "@/constants/roleImages";
import { useGame } from "@/contexts/GameContext";
import { useCountdown } from "@/hooks/useCountdown";

export default function RoleSelectScreen() {
  const { state, myPlayerId, emit } = useGame();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const remaining = useCountdown(state?.roleSelectDeadline ?? null);

  if (!state) return null;

  const isMyTurn =
    !!(state.currentChoice && state.currentChoice.playerId === myPlayerId);
  const choices = isMyTurn ? state.currentChoice!.options : [];
  const selectedCount = state.players.filter((p: any) => p.hasSelectedRole).length;
  const totalCount = state.players.length;
  const showNames = state.settings?.roleSelectShowNames === "visible";

  return (
    <View style={[styles.root, { flexDirection: isMobile ? "column" : "row" }]}>
      {/* ── SOL PANEL — Oyuncu listesi ── */}
      <View
        style={[
          styles.leftPanel,
          isMobile && { width: "100%", height: 80, flexDirection: "row" },
        ]}
      >
        {!isMobile && (
          <Text style={styles.leftTitle}>OYUNCULAR</Text>
        )}
        <ScrollView
          horizontal={isMobile}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          {state.players.map((p: any, index: number) => {
            const isPicking =
              state.currentChoice?.playerId === p.id && !p.hasSelectedRole;
            const isDone = p.hasSelectedRole;
            const isMe = p.id === myPlayerId;
            const roleDef = isDone ? ROLE_DEFS[p.selectedRoleId] : null;

            return (
              <View
                key={p.id}
                style={[
                  styles.playerRow,
                  isPicking && styles.playerRowActive,
                  isDone && styles.playerRowDone,
                  !isPicking && !isDone && styles.playerRowWaiting,
                  isMobile && styles.playerRowMobile,
                ]}
              >
                <View style={[styles.playerAvatar, isPicking && styles.playerAvatarActive]}>
                  <Text style={[styles.playerAvatarText, isPicking && styles.playerAvatarTextActive]}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                </View>

                {!isMobile && (
                  <View style={styles.playerInfo}>
                    {isDone && roleDef ? (
                      <>
                        <Text style={styles.playerRoleEmoji}>{roleDef.emoji}</Text>
                        <Text style={styles.playerRoleName} numberOfLines={1}>
                          {roleDef.name}
                        </Text>
                      </>
                    ) : isPicking ? (
                      <Text style={styles.pickingLabel}>seçiyor…</Text>
                    ) : (
                      <Text style={styles.waitingLabelSmall}>bekliyor</Text>
                    )}
                    {isMe && !isDone && (
                      <Text style={styles.meLabel}>SEN</Text>
                    )}
                  </View>
                )}
                {isMobile && isDone && roleDef && (
                  <Text style={styles.mobileRoleEmoji}>{roleDef.emoji}</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* ── SAĞ PANEL — Seçim alanı ── */}
      <View style={styles.rightPanel}>
        {isMyTurn ? (
          <MyTurnPanel
            choices={choices}
            remaining={remaining}
            onSelect={(roleId) => {
              haptic(Haptics.ImpactFeedbackStyle.Medium);
              emit("chooseRole", { roleId: roleId ?? "__random__" });
            }}
          />
        ) : (
          <WaitingPanel selectedCount={selectedCount} totalCount={totalCount} />
        )}
      </View>
    </View>
  );
}

// ── MyTurnPanel ───────────────────────────────────────────────────────────────
function MyTurnPanel({
  choices,
  remaining,
  onSelect,
}: {
  choices: string[];
  remaining: number;
  onSelect: (roleId: string | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const urgent = remaining <= 5;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.myTurnContainer}>
      <Text style={styles.myTurnTitle}>ROL SEÇ</Text>
      <Text style={styles.myTurnSubtitle}>Kaderini koy ortaya</Text>

      {/* Timer */}
      <View style={styles.timerRow}>
        <Text style={[styles.timerText, urgent && styles.timerTextUrgent]}>
          {remaining}s
        </Text>
      </View>
      <View style={styles.timerBarBg}>
        <View
          style={[
            styles.timerBarFill,
            { width: `${Math.max(0, (remaining / 25) * 100)}%` as any },
            urgent && styles.timerBarUrgent,
          ]}
        />
      </View>

      {/* Kartlar */}
      <ScrollView
        contentContainerStyle={[
          styles.cardsRow,
          isMobile && styles.cardsRowMobile,
          choices.length === 1 && styles.cardsRowSingle,
          choices.length === 2 && styles.cardsRowDouble,
        ]}
        horizontal={!isMobile}
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 20 }}
      >
        {choices.map((rid) => (
          <RoleCard
            key={rid}
            roleId={rid}
            selected={selected === rid}
            onPress={() => setSelected((prev) => (prev === rid ? null : rid))}
          />
        ))}
      </ScrollView>

      {/* Butonlar */}
      <Pressable
        style={styles.randomBtn}
        onPress={() => onSelect(null)}
      >
        <Text style={styles.randomBtnText}>🎲 Rastgele Seç — kaderini koy ortaya!</Text>
      </Pressable>

      {selected && (
        <Pressable
          style={styles.confirmBtn}
          onPress={() => onSelect(selected)}
        >
          <Text style={styles.confirmBtnText}>✓ Seç</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── RoleCard ──────────────────────────────────────────────────────────────────
function RoleCard({
  roleId,
  selected,
  onPress,
}: {
  roleId: string;
  selected: boolean;
  onPress: () => void;
}) {
  const role = ROLE_DEFS[roleId];
  if (!role) return null;
  const teamColor = ROLE_TEAM_COLOR[role.team] ?? "#9B7FD4";
  const img = roleImages[roleId];

  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Pressable
        onPress={onPress}
        style={[
          styles.roleCard,
          selected && styles.roleCardSelected,
          selected && { borderColor: teamColor },
        ]}
      >
        {/* Emoji / görsel */}
        <View style={styles.roleCardImageArea}>
          {img ? (
            <View style={[styles.roleCardImgCircle, { borderColor: teamColor + "88" }]}>
              <Animated.Image source={img} style={styles.roleCardImg} />
            </View>
          ) : (
            <Text style={styles.roleCardEmoji}>{role.emoji}</Text>
          )}
        </View>

        <Text style={styles.roleCardName}>{role.name}</Text>

        <View style={[styles.roleCardTeamBadge, { backgroundColor: teamColor + "22", borderColor: teamColor }]}>
          <Text style={[styles.roleCardTeamText, { color: teamColor }]}>
            {ROLE_TEAM_LABEL[role.team]}
          </Text>
        </View>

        <Text style={styles.roleCardDesc} numberOfLines={3}>
          {role.description}
        </Text>

        {selected && (
          <View style={[styles.roleCardSelectedBadge, { backgroundColor: teamColor }]}>
            <Text style={styles.roleCardSelectedText}>✓</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── WaitingPanel ──────────────────────────────────────────────────────────────
function WaitingPanel({
  selectedCount,
  totalCount,
}: {
  selectedCount: number;
  totalCount: number;
}) {
  const pct = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0;
  return (
    <View style={styles.waitingContainer}>
      <Text style={styles.waitingTitle}>ROL DAĞITIMI</Text>
      <Text style={styles.waitingProgress}>{selectedCount}/{totalCount}</Text>
      <Text style={styles.waitingProgressLabel}>seçimini yaptı</Text>

      <View style={styles.waitingBarBg}>
        <View style={[styles.waitingBarFill, { width: `${pct}%` as any }]} />
      </View>

      <Text style={styles.waitingHint}>Sıranı bekle…</Text>
      <Text style={styles.waitingDecor}>? ? ?</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0614",
  },

  // Left panel
  leftPanel: {
    width: 200,
    backgroundColor: "#1A0A3E",
    borderRightWidth: 1,
    borderRightColor: "#2A1060",
    paddingTop: 16,
  },
  leftTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#4A2E7A",
    textAlign: "center",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginHorizontal: 8,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: "#0A0614",
    gap: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  playerRowMobile: {
    marginHorizontal: 4,
    marginBottom: 0,
    marginRight: 0,
    flexDirection: "column",
    padding: 8,
    width: 60,
    alignItems: "center",
  },
  playerRowActive: {
    backgroundColor: "#2A1060",
    borderColor: "#F5C842",
  },
  playerRowDone: {
    backgroundColor: "#0A1A14",
    borderColor: "#1ECBE188",
  },
  playerRowWaiting: {
    opacity: 0.5,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2A1060",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  playerAvatarActive: {
    backgroundColor: "#F5C842",
  },
  playerAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#E8DEFF",
  },
  playerAvatarTextActive: {
    color: "#0A0614",
  },
  playerInfo: {
    flex: 1,
    gap: 2,
  },
  playerRoleEmoji: {
    fontSize: 16,
  },
  playerRoleName: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#1ECBE1",
  },
  pickingLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#F5C842",
    fontStyle: "italic",
  },
  waitingLabelSmall: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#4A2E7A",
  },
  meLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: "#9B7FD4",
    letterSpacing: 1,
    marginTop: 2,
  },
  mobileRoleEmoji: { fontSize: 14, marginTop: 2 },

  // Right panel
  rightPanel: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },

  // MyTurnPanel
  myTurnContainer: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 700,
    alignSelf: "center",
    width: "100%",
  },
  myTurnTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 3,
    color: "#4A2E7A",
    textAlign: "center",
    textTransform: "uppercase",
  },
  myTurnSubtitle: {
    fontFamily: "Cinzel_700Bold",
    fontSize: 20,
    letterSpacing: 2,
    color: "#E8DEFF",
    textAlign: "center",
    marginTop: 6,
  },
  timerRow: {
    alignItems: "center",
    marginTop: 12,
  },
  timerText: {
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    color: "#F5C842",
    fontVariant: ["tabular-nums"],
  },
  timerTextUrgent: { color: "#C8102E" },
  timerBarBg: {
    height: 4,
    backgroundColor: "#2A1060",
    borderRadius: 2,
    marginHorizontal: 16,
    marginTop: 6,
  },
  timerBarFill: {
    height: 4,
    backgroundColor: "#F5C842",
    borderRadius: 2,
  },
  timerBarUrgent: { backgroundColor: "#C8102E" },

  cardsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 8,
  },
  cardsRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  cardsRowSingle: {
    paddingHorizontal: 80,
  },
  cardsRowDouble: {
    paddingHorizontal: 40,
  },

  // RoleCard
  roleCard: {
    backgroundColor: "#1A0A3E",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#2A1060",
    padding: 16,
    alignItems: "center",
    flex: 1,
    minWidth: 160,
    maxWidth: 220,
    gap: 6,
  },
  roleCardSelected: {
    borderWidth: 3,
  },
  roleCardImageArea: {
    marginBottom: 4,
  },
  roleCardImgCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 2,
  },
  roleCardImg: {
    width: "100%",
    height: "100%",
  },
  roleCardEmoji: {
    fontSize: 48,
  },
  roleCardName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#E8DEFF",
    textAlign: "center",
  },
  roleCardTeamBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleCardTeamText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.5,
  },
  roleCardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#9B7FD4",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
  },
  roleCardSelectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  roleCardSelectedText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#0A0614",
  },

  // Random / Confirm buttons
  randomBtn: {
    borderWidth: 1,
    borderColor: "#3B1F8C",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    alignSelf: "stretch",
  },
  randomBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#9B7FD4",
    textAlign: "center",
  },
  confirmBtn: {
    backgroundColor: "#F5C842",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 12,
    alignSelf: "center",
  },
  confirmBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#0A0614",
  },

  // WaitingPanel
  waitingContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 8,
  },
  waitingTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 3,
    color: "#4A2E7A",
    textAlign: "center",
    textTransform: "uppercase",
  },
  waitingProgress: {
    fontFamily: "Inter_700Bold",
    fontSize: 64,
    color: "#F5C842",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  waitingProgressLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#9B7FD4",
    textAlign: "center",
  },
  waitingBarBg: {
    height: 4,
    backgroundColor: "#2A1060",
    borderRadius: 2,
    width: 200,
    marginTop: 12,
  },
  waitingBarFill: {
    height: 4,
    backgroundColor: "#9B7FD4",
    borderRadius: 2,
  },
  waitingHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#4A2E7A",
    textAlign: "center",
    marginTop: 24,
  },
  waitingDecor: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: "#2A1060",
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 16,
  },
});
