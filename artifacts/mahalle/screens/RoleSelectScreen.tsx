import * as Haptics from "expo-haptics";
import { haptic } from "@/lib/haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { ROLE_DEFS } from "@/constants/roles";
import { useGame } from "@/contexts/GameContext";
import { useCountdown } from "@/hooks/useCountdown";

const TEAM_COLOR: Record<string, string> = {
  iyi: "#F5C842",
  kotu: "#C8102E",
  kaos: "#1ECBE1",
  tarafsiz: "#9B7FD4",
};
const TEAM_LABEL: Record<string, string> = {
  iyi: "MAHALLE",
  kotu: "ÇETE",
  kaos: "KARGAŞACI",
  tarafsiz: "YALNIZ KURT",
};

// ── Root ──────────────────────────────────────────────────────────────────────
export default function RoleSelectScreen() {
  const { state, myPlayerId, emit } = useGame();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const panelWidth = isMobile ? 152 : 200;
  const remaining = useCountdown(state?.roleSelectDeadline ?? null);

  if (!state) return null;

  const sortedPlayers = [...state.players].sort(
    (a, b) => (a.roleSelectPosition ?? 0) - (b.roleSelectPosition ?? 0)
  );

  const isMyTurn =
    !!(state.currentChoice && state.currentChoice.playerId === myPlayerId);
  const choices = isMyTurn ? state.currentChoice!.options : [];
  const selectedCount = sortedPlayers.filter((p) => p.hasSelectedRole).length;
  const totalCount = sortedPlayers.length;

  const handleSelect = (roleId: string | null) => {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    emit("chooseRole", { roleId: roleId ?? "__random__" });
  };

  // Main area width for calculating card sizes
  const mainWidth = width - panelWidth;

  return (
    <View style={styles.root}>
      {/* Left panel — always side by side */}
      <PlayerPanel
        players={sortedPlayers}
        myId={myPlayerId}
        panelWidth={panelWidth}
      />

      {/* Right content */}
      <View style={styles.mainArea}>
        {isMyTurn ? (
          <PickingArea
            choices={choices}
            timeLeft={remaining}
            onSelect={handleSelect}
            mainWidth={mainWidth}
            isMobile={isMobile}
          />
        ) : (
          <WaitingArea
            selectedCount={selectedCount}
            totalCount={totalCount}
          />
        )}
      </View>
    </View>
  );
}

// ── PlayerPanel — GGD style, always left side ─────────────────────────────────
function PlayerPanel({
  players,
  myId,
  panelWidth,
}: {
  players: any[];
  myId: string | null;
  panelWidth: number;
}) {
  return (
    <View style={[styles.panel, { width: panelWidth }]}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>OYUNCULAR</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.panelScroll}>
        {players.map((p) => (
          <PlayerRow key={p.id} player={p} myId={myId} panelWidth={panelWidth} />
        ))}
      </ScrollView>
    </View>
  );
}

// ── PlayerRow — GGD-inspired ──────────────────────────────────────────────────
function PlayerRow({
  player,
  myId,
  panelWidth,
}: {
  player: any;
  myId: string | null;
  panelWidth: number;
}) {
  const isMe = player.id === myId;
  const isDone = player.roleSelectStatus === "done";
  const isPicking = player.roleSelectStatus === "picking";
  const isWaiting = player.roleSelectStatus === "waiting";
  const isNarrow = panelWidth < 160;

  const role = isDone && player.selectedRoleId ? ROLE_DEFS[player.selectedRoleId] : null;
  const teamColor = role ? (TEAM_COLOR[role.team] ?? "#4A2E7A") : "#4A2E7A";

  // Pulsing animation for "picking" state
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isPicking) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPicking]);

  return (
    <View
      style={[
        styles.playerRow,
        isPicking && styles.playerRowPicking,
        isDone && { borderLeftColor: teamColor },
        isMe && styles.playerRowMe,
      ]}
    >
      {/* Position badge */}
      <View style={[styles.posBadge, isPicking && styles.posBadgePicking]}>
        <Text style={[styles.posNum, isPicking && styles.posNumPicking]}>
          {String(player.roleSelectPosition ?? "?").padStart(2, "0")}
        </Text>
      </View>

      {/* Name + status */}
      <View style={styles.playerInfo}>
        <Text
          style={[styles.playerName, isMe && styles.playerNameMe]}
          numberOfLines={1}
        >
          {isNarrow
            ? player.nickname.length > 7
              ? player.nickname.slice(0, 7) + "…"
              : player.nickname
            : player.nickname.length > 11
            ? player.nickname.slice(0, 11) + "…"
            : player.nickname}
        </Text>

        {isDone && role ? (
          <Text style={[styles.statusDone, { color: teamColor }]} numberOfLines={1}>
            ✓ {role.name}
          </Text>
        ) : isPicking ? (
          <Animated.Text style={[styles.statusPicking, { opacity: pulseAnim }]}>
            seçiyor...
          </Animated.Text>
        ) : (
          <Text style={styles.statusWaiting}>bekliyor</Text>
        )}
      </View>

      {/* Right side: role emoji when done, or "sen" badge */}
      <View style={styles.playerRight}>
        {isDone && role ? (
          <Text style={styles.doneEmoji}>{role.emoji}</Text>
        ) : isDone ? (
          <Text style={[styles.checkmark, { color: teamColor }]}>✓</Text>
        ) : null}
        {isMe && <Text style={styles.youBadge}>sen</Text>}
      </View>
    </View>
  );
}

// ── PickingArea ───────────────────────────────────────────────────────────────
function PickingArea({
  choices,
  timeLeft,
  onSelect,
  mainWidth,
  isMobile,
}: {
  choices: string[];
  timeLeft: number;
  onSelect: (roleId: string | null) => void;
  mainWidth: number;
  isMobile: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const urgentTime = timeLeft <= 5;

  // Card sizing: fit 3 cards + 1 random horizontally, never wrap
  const hPad = isMobile ? 10 : 20;
  const cardGap = isMobile ? 6 : 10;
  const numCards = Math.min(choices.length, 3) + 1; // +1 for random
  const cardWidth = Math.max(
    60,
    (mainWidth - hPad * 2 - cardGap * (numCards - 1)) / numCards
  );
  const cardHeight = isMobile ? 110 : 140;

  return (
    <View style={styles.pickingRoot}>
      {/* Header */}
      <View style={[styles.pickingHeader, isMobile && styles.pickingHeaderMobile]}>
        <Text style={styles.pickingTitle}>ROL SEÇ!</Text>
        <Text style={[styles.pickingSubtitle, isMobile && styles.pickingSubtitleMobile]}>
          Kaderini belirle
        </Text>
      </View>

      {/* Timer */}
      <View style={[styles.timerRow, isMobile && styles.timerRowMobile]}>
        <Text style={[styles.timerNum, urgentTime && styles.timerUrgent]}>
          {timeLeft}
        </Text>
        <Text style={styles.timerLabel}>sn</Text>
      </View>
      <View style={[styles.timerBarBg, { marginHorizontal: hPad }]}>
        <View
          style={[
            styles.timerBarFill,
            { width: `${Math.max(0, (timeLeft / 25) * 100)}%` as any },
            urgentTime && styles.timerBarUrgent,
          ]}
        />
      </View>

      {/* Role cards + Random — always horizontal row */}
      <View style={[styles.cardsRow, { paddingHorizontal: hPad, gap: cardGap }]}>
        {choices.slice(0, 3).map((roleId, idx) => (
          <RoleCard
            key={roleId}
            roleId={roleId}
            isSelected={selected === roleId}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            delay={idx * 80}
            isMobile={isMobile}
            onPress={() => {
              haptic(Haptics.ImpactFeedbackStyle.Light);
              setSelected((prev) => (prev === roleId ? null : roleId));
            }}
          />
        ))}

        {/* Random card — same style */}
        <RandomCard
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          isMobile={isMobile}
          onPress={() => onSelect(null)}
        />
      </View>

      {/* Selected description */}
      {selected && ROLE_DEFS[selected] && (
        <View style={[styles.descBox, { marginHorizontal: hPad }]}>
          <Text style={styles.descText} numberOfLines={2}>
            {ROLE_DEFS[selected].shortDesc ?? ROLE_DEFS[selected].description}
          </Text>
        </View>
      )}

      {/* Confirm button */}
      <View style={[styles.confirmWrap, { paddingHorizontal: hPad }]}>
        <Pressable
          style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
          onPress={() => {
            if (selected) {
              haptic(Haptics.ImpactFeedbackStyle.Medium);
              onSelect(selected);
            }
          }}
          disabled={!selected}
        >
          <Text style={[styles.confirmBtnText, !selected && styles.confirmBtnTextDisabled]}>
            {selected
              ? `✓  ${ROLE_DEFS[selected]?.name ?? ""} — ONAYLA`
              : "Bir rol seç"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── RoleCard ──────────────────────────────────────────────────────────────────
function RoleCard({
  roleId,
  isSelected,
  cardWidth,
  cardHeight,
  delay,
  isMobile,
  onPress,
}: {
  roleId: string;
  isSelected: boolean;
  cardWidth: number;
  cardHeight: number;
  delay: number;
  isMobile: boolean;
  onPress: () => void;
}) {
  const role = ROLE_DEFS[roleId];
  if (!role) return null;

  const teamColor = TEAM_COLOR[role.team] ?? "#9B7FD4";
  const teamLabel = TEAM_LABEL[role.team] ?? role.team;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const emojiSize = isMobile ? (cardWidth < 70 ? 20 : 26) : 32;
  const nameSize = isMobile ? (cardWidth < 70 ? 8 : 10) : 12;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        width: cardWidth,
      }}
    >
      <Pressable
        style={[
          styles.roleCard,
          { height: cardHeight, borderColor: isSelected ? teamColor : "#2A1060" },
          isSelected && styles.roleCardSelected,
          isSelected && { shadowColor: teamColor },
        ]}
        onPress={onPress}
      >
        {isSelected && (
          <View style={[styles.selBadge, { backgroundColor: teamColor }]}>
            <Text style={styles.selBadgeText}>✓</Text>
          </View>
        )}

        <Text style={{ fontSize: emojiSize }}>{role.emoji}</Text>
        <Text
          style={[
            styles.cardName,
            { fontSize: nameSize, color: isSelected ? teamColor : "#E8DEFF" },
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {role.name}
        </Text>
        <View
          style={[
            styles.cardTeamBadge,
            { backgroundColor: teamColor + "25", borderColor: teamColor + "70" },
          ]}
        >
          <Text style={[styles.cardTeamText, { color: teamColor, fontSize: isMobile ? 6 : 8 }]}>
            {teamLabel}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── RandomCard ────────────────────────────────────────────────────────────────
function RandomCard({
  cardWidth,
  cardHeight,
  isMobile,
  onPress,
}: {
  cardWidth: number;
  cardHeight: number;
  isMobile: boolean;
  onPress: () => void;
}) {
  const nameSize = isMobile ? (cardWidth < 70 ? 8 : 10) : 12;
  const emojiSize = isMobile ? (cardWidth < 70 ? 20 : 26) : 32;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        delay: 3 * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        delay: 3 * 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        width: cardWidth,
      }}
    >
      <Pressable
        style={[styles.roleCard, styles.randomCard, { height: cardHeight }]}
        onPress={onPress}
      >
        <Text style={{ fontSize: emojiSize }}>🎲</Text>
        <Text
          style={[styles.cardName, { fontSize: nameSize, color: "#9B7FD4" }]}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          RASTGELE
        </Text>
        <View style={[styles.cardTeamBadge, styles.randomBadge]}>
          <Text style={[styles.cardTeamText, { color: "#9B7FD4", fontSize: isMobile ? 6 : 8 }]}>
            ŞANS
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── WaitingArea ───────────────────────────────────────────────────────────────
function WaitingArea({
  selectedCount,
  totalCount,
}: {
  selectedCount: number;
  totalCount: number;
}) {
  const pct = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0;

  // Pulsing question marks
  const qAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(qAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(qAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.waitingRoot}>
      <Text style={styles.waitingLabel}>ROL DAĞITIMI</Text>

      <View style={styles.fractionRow}>
        <Text style={styles.fractionNum}>{selectedCount}</Text>
        <Text style={styles.fractionSep}>/{totalCount}</Text>
      </View>
      <Text style={styles.fractionSub}>seçimini yaptı</Text>

      <View style={styles.waitBarBg}>
        <View style={[styles.waitBarFill, { width: `${pct}%` as any }]} />
      </View>

      <Text style={styles.waitHint}>Sıranı bekle...</Text>

      <View style={styles.qRow}>
        {[0, 1, 2].map((i) => (
          <Animated.Text
            key={i}
            style={[
              styles.qMark,
              {
                opacity: qAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.15 + i * 0.15, 0.5 + i * 0.15],
                }),
              },
            ]}
          >
            ?
          </Animated.Text>
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0614",
    flexDirection: "row",
  },

  // ── Panel ──
  panel: {
    backgroundColor: "#0C0720",
    borderRightWidth: 1,
    borderRightColor: "#1A0A3E",
    flexShrink: 0,
  },
  panelHeader: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1A0A3E",
  },
  panelTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: "#3B1F8C",
    letterSpacing: 2,
    textAlign: "center",
  },
  panelScroll: { flex: 1 },

  // ── Player row ──
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#130830",
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
    gap: 6,
    minHeight: 52,
  },
  playerRowPicking: {
    backgroundColor: "#160935",
    borderLeftColor: "#F5C842",
  },
  playerRowMe: {
    backgroundColor: "#0F0625",
  },

  posBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1E0B4A",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  posBadgePicking: {
    backgroundColor: "#F5C842",
  },
  posNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: "#9B7FD4",
  },
  posNumPicking: {
    color: "#0A0614",
  },

  playerInfo: {
    flex: 1,
    gap: 2,
    overflow: "hidden",
  },
  playerName: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#C8B8FF",
    letterSpacing: 0.2,
  },
  playerNameMe: {
    color: "#F5C842",
  },
  statusDone: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.1,
  },
  statusPicking: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: "#F5C842",
  },
  statusWaiting: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    color: "#3B1F8C",
  },

  playerRight: {
    alignItems: "center",
    gap: 2,
    flexShrink: 0,
  },
  doneEmoji: {
    fontSize: 16,
  },
  checkmark: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  youBadge: {
    fontFamily: "Inter_700Bold",
    fontSize: 7,
    color: "#F5C842",
    letterSpacing: 0.5,
  },

  // ── Main area ──
  mainArea: {
    flex: 1,
    overflow: "hidden",
  },

  // ── Picking root ──
  pickingRoot: {
    flex: 1,
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
  },

  pickingHeader: {
    paddingHorizontal: 20,
    gap: 2,
  },
  pickingHeaderMobile: {
    paddingHorizontal: 10,
  },
  pickingTitle: {
    fontFamily: "Cinzel_700Bold",
    fontSize: 20,
    color: "#E8DEFF",
    textAlign: "center",
  },
  pickingSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#4A2E7A",
    textAlign: "center",
    letterSpacing: 1,
  },
  pickingSubtitleMobile: {
    fontSize: 10,
  },

  // Timer
  timerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
  },
  timerRowMobile: {},
  timerNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 44,
    color: "#F5C842",
    fontVariant: ["tabular-nums"],
  },
  timerLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#9B7FD4",
  },
  timerUrgent: { color: "#C8102E" },
  timerBarBg: {
    height: 3,
    backgroundColor: "#1A0A3E",
    borderRadius: 2,
  },
  timerBarFill: {
    height: 3,
    backgroundColor: "#F5C842",
    borderRadius: 2,
  },
  timerBarUrgent: { backgroundColor: "#C8102E" },

  // Cards row — always horizontal
  cardsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  // Role card — NO aspectRatio, fixed height
  roleCard: {
    backgroundColor: "#140830",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2A1060",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    gap: 5,
    position: "relative",
    shadowOpacity: 0,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  roleCardSelected: {
    backgroundColor: "#1E0C40",
    borderWidth: 2.5,
    shadowOpacity: 0.5,
    elevation: 6,
  },
  selBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  selBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#0A0614",
  },
  cardName: {
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 13,
  },
  cardTeamBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
  },
  cardTeamText: {
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },

  randomCard: {
    borderColor: "#2A1060",
    borderStyle: "dashed",
  },
  randomBadge: {
    backgroundColor: "#1A0A3E",
    borderColor: "#3B1F8C",
  },

  // Description box
  descBox: {
    backgroundColor: "#130830",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#2A1060",
  },
  descText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#9B7FD4",
    textAlign: "center",
    lineHeight: 16,
  },

  // Confirm button
  confirmWrap: {},
  confirmBtn: {
    backgroundColor: "#F5C842",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmBtnDisabled: {
    backgroundColor: "#1A0A3E",
  },
  confirmBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#0A0614",
  },
  confirmBtnTextDisabled: {
    color: "#3B1F8C",
  },

  // ── Waiting area ──
  waitingRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  waitingLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 3,
    color: "#3B1F8C",
  },
  fractionRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  fractionNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 72,
    color: "#F5C842",
    lineHeight: 80,
    fontVariant: ["tabular-nums"],
  },
  fractionSep: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    color: "#4A2E7A",
  },
  fractionSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#9B7FD4",
  },
  waitBarBg: {
    height: 3,
    backgroundColor: "#1A0A3E",
    borderRadius: 2,
    width: 160,
    marginTop: 4,
  },
  waitBarFill: {
    height: 3,
    backgroundColor: "#F5C842",
    borderRadius: 2,
  },
  waitHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#3B1F8C",
    marginTop: 6,
  },
  qRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  qMark: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: "#3B1F8C",
  },
});
