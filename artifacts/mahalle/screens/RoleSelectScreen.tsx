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

export default function RoleSelectScreen() {
  const { state, myPlayerId, emit } = useGame();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
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

  return (
    <View style={[styles.root, { flexDirection: isMobile ? "column" : "row" }]}>
      {isMobile ? (
        <MobilePlayerPanel players={sortedPlayers} myId={myPlayerId} />
      ) : (
        <DesktopPlayerPanel players={sortedPlayers} myId={myPlayerId} />
      )}

      <View style={styles.mainArea}>
        {isMyTurn ? (
          <PickingArea
            choices={choices}
            timeLeft={remaining}
            onSelect={handleSelect}
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

// ── DesktopPlayerPanel ────────────────────────────────────────────────────────
function DesktopPlayerPanel({ players, myId }: { players: any[]; myId: string | null }) {
  return (
    <View style={styles.desktopPanel}>
      <Text style={styles.panelTitle}>OYUNCULAR</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {players.map((p) => (
          <PlayerRow key={p.id} player={p} myId={myId} layout="vertical" />
        ))}
      </ScrollView>
    </View>
  );
}

// ── MobilePlayerPanel ─────────────────────────────────────────────────────────
function MobilePlayerPanel({ players, myId }: { players: any[]; myId: string | null }) {
  return (
    <View style={styles.mobilePanel}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mobilePanelScroll}
      >
        {players.map((p) => (
          <PlayerRow key={p.id} player={p} myId={myId} layout="horizontal" />
        ))}
      </ScrollView>
    </View>
  );
}

// ── PlayerRow ─────────────────────────────────────────────────────────────────
function PlayerRow({
  player,
  myId,
  layout,
}: {
  player: any;
  myId: string | null;
  layout: "vertical" | "horizontal";
}) {
  const isMe = player.id === myId;
  const isDone = player.roleSelectStatus === "done";
  const isPicking = player.roleSelectStatus === "picking";

  const role = isDone && player.selectedRoleId ? ROLE_DEFS[player.selectedRoleId] : null;
  const teamColor = role ? (TEAM_COLOR[role.team] ?? "#4A2E7A") : "#4A2E7A";

  if (layout === "horizontal") {
    return (
      <View
        style={[
          styles.mobilePlayerCard,
          isPicking && styles.mobilePlayerCardPicking,
          isDone && { borderColor: teamColor },
          isMe && styles.mobilePlayerCardMe,
        ]}
      >
        <View style={[styles.positionBadge, isPicking && styles.positionBadgePicking]}>
          <Text style={[styles.positionText, isPicking && styles.positionTextPicking]}>
            {String(player.roleSelectPosition ?? "?").padStart(2, "0")}
          </Text>
        </View>

        {isDone && role ? (
          <>
            <Text style={styles.mobileRoleEmoji}>{role.emoji}</Text>
            <Text style={[styles.mobileRoleName, { color: teamColor }]} numberOfLines={2}>
              {role.name}
            </Text>
            <View style={styles.doneTick}>
              <Text style={[styles.doneTickText, { color: teamColor }]}>✓</Text>
            </View>
          </>
        ) : isPicking ? (
          <>
            <Text style={styles.pickingDots}>···</Text>
            <Text style={styles.pickingLabel}>seçiyor</Text>
          </>
        ) : (
          <Text style={styles.waitingLabel}>bekliyor</Text>
        )}

        {isMe && <Text style={styles.meMark}>sen</Text>}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.desktopPlayerRow,
        isPicking && styles.desktopPlayerRowPicking,
        isDone && { borderLeftColor: teamColor, borderLeftWidth: 3 },
        isMe && styles.desktopPlayerRowMe,
      ]}
    >
      <View style={[styles.positionBadge, isPicking && styles.positionBadgePicking]}>
        <Text style={[styles.positionText, isPicking && styles.positionTextPicking]}>
          {String(player.roleSelectPosition ?? "?").padStart(2, "0")}
        </Text>
      </View>

      <View style={styles.desktopPlayerInfo}>
        {isDone && role ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 16 }}>{role.emoji}</Text>
              <Text style={[styles.desktopRoleName, { color: teamColor }]} numberOfLines={1}>
                {role.name}
              </Text>
            </View>
            <View
              style={[
                styles.teamBadge,
                { backgroundColor: teamColor + "22", borderColor: teamColor },
              ]}
            >
              <Text style={[styles.teamBadgeText, { color: teamColor }]}>
                {TEAM_LABEL[role.team] ?? role.team}
              </Text>
            </View>
          </>
        ) : isPicking ? (
          <Text style={styles.pickingLabel}>seçiyor...</Text>
        ) : (
          <Text style={styles.waitingLabelText}>bekliyor</Text>
        )}
      </View>

      {isMe && <Text style={styles.meMarkDesktop}>sen</Text>}
    </View>
  );
}

// ── PickingArea ───────────────────────────────────────────────────────────────
function PickingArea({
  choices,
  timeLeft,
  onSelect,
  isMobile,
}: {
  choices: string[];
  timeLeft: number;
  onSelect: (roleId: string | null) => void;
  isMobile: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const urgentTime = timeLeft <= 5;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.pickingContainer,
        isMobile && styles.pickingContainerMobile,
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pickingTitle}>ROL SEÇ</Text>
      <Text style={styles.pickingSubtitle}>Kaderini koy ortaya</Text>

      <View style={styles.timerContainer}>
        <Text style={[styles.timerNumber, urgentTime && styles.timerUrgent]}>
          {timeLeft}
        </Text>
        <Text style={styles.timerUnit}>saniye</Text>
      </View>
      <View style={styles.timerBarBg}>
        <View
          style={[
            styles.timerBarFill,
            { width: `${Math.max(0, (timeLeft / 25) * 100)}%` as any },
            urgentTime && styles.timerBarUrgent,
          ]}
        />
      </View>

      <View
        style={[
          styles.cardsGrid,
          choices.length === 1 && styles.cardsGrid1,
          choices.length === 2 && styles.cardsGrid2,
          isMobile && styles.cardsGridMobile,
        ]}
      >
        {choices.map((roleId) => (
          <RoleCard
            key={roleId}
            roleId={roleId}
            isSelected={selected === roleId}
            onPress={() => setSelected((prev) => (prev === roleId ? null : roleId))}
            isMobile={isMobile}
          />
        ))}
      </View>

      <Pressable
        style={styles.randomBtn}
        onPress={() => onSelect(null)}
      >
        <Text style={styles.randomBtnEmoji}>🎲</Text>
        <Text style={styles.randomBtnText}>Rastgele Seç — kaderini koy ortaya!</Text>
      </Pressable>

      <Pressable
        style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
        onPress={() => selected && onSelect(selected)}
        disabled={!selected}
      >
        <Text style={[styles.confirmBtnText, !selected && styles.confirmBtnTextDisabled]}>
          {selected ? `✓  ${ROLE_DEFS[selected]?.name ?? ""} — Seç` : "Bir rol seç"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// ── RoleCard ──────────────────────────────────────────────────────────────────
function RoleCard({
  roleId,
  isSelected,
  onPress,
  isMobile,
}: {
  roleId: string;
  isSelected: boolean;
  onPress: () => void;
  isMobile: boolean;
}) {
  const role = ROLE_DEFS[roleId];
  if (!role) return null;

  const teamColor = TEAM_COLOR[role.team] ?? "#9B7FD4";
  const teamLabel = TEAM_LABEL[role.team] ?? role.team;

  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.roleCardWrap,
        isMobile && styles.roleCardWrapMobile,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Pressable
        style={[
          styles.roleCard,
          isSelected && styles.roleCardSelected,
          isSelected && { borderColor: teamColor },
        ]}
        onPress={onPress}
      >
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: teamColor }]}>
            <Text style={styles.selectedBadgeText}>✓</Text>
          </View>
        )}

        <Text style={styles.roleCardEmoji}>{role.emoji}</Text>
        <Text style={[styles.roleCardName, isSelected && { color: teamColor }]}>
          {role.name}
        </Text>

        <View
          style={[
            styles.roleCardTeamBadge,
            { backgroundColor: teamColor + "20", borderColor: teamColor + "60" },
          ]}
        >
          <Text style={[styles.roleCardTeamText, { color: teamColor }]}>{teamLabel}</Text>
        </View>

        <Text style={styles.roleCardAbility} numberOfLines={3}>
          {role.shortDesc ?? role.description}
        </Text>
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
  return (
    <View style={styles.waitingContainer}>
      <Text style={styles.waitingTitle}>ROL DAĞITIMI</Text>
      <Text style={styles.waitingFraction}>
        {selectedCount}
        <Text style={styles.waitingFractionTotal}>/{totalCount}</Text>
      </Text>
      <Text style={styles.waitingSubtitle}>seçimini yaptı</Text>

      <View style={styles.waitingBarBg}>
        <View style={[styles.waitingBarFill, { width: `${pct}%` as any }]} />
      </View>

      <Text style={styles.waitingHint}>Sıranı bekle...</Text>

      <View style={styles.questionMarks}>
        {["?", "?", "?"].map((q, i) => (
          <Text key={i} style={[styles.questionMark, { opacity: 0.2 + i * 0.2 }]}>
            {q}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0614" },

  // ── Desktop panel ──
  desktopPanel: {
    width: 220,
    backgroundColor: "#0D0820",
    borderRightWidth: 1,
    borderRightColor: "#1A0A3E",
    paddingTop: 20,
  },
  panelTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#4A2E7A",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 16,
  },

  // ── Mobile panel ──
  mobilePanel: {
    height: 110,
    backgroundColor: "#0D0820",
    borderBottomWidth: 1,
    borderBottomColor: "#1A0A3E",
  },
  mobilePanelScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },

  // ── Mobile player card ──
  mobilePlayerCard: {
    width: 80,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#1A0A3E",
    borderWidth: 2,
    borderColor: "#2A1060",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    position: "relative",
    gap: 2,
  },
  mobilePlayerCardPicking: { borderColor: "#F5C842", backgroundColor: "#2A1060" },
  mobilePlayerCardMe: { borderStyle: "dashed" },
  mobileRoleEmoji: { fontSize: 22, marginBottom: 1 },
  mobileRoleName: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    textAlign: "center",
    lineHeight: 12,
  },

  // ── Desktop player row ──
  desktopPlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A0A3E",
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  desktopPlayerRowPicking: { backgroundColor: "#1A0A3E" },
  desktopPlayerRowMe: { backgroundColor: "#0F0625" },
  desktopPlayerInfo: { flex: 1, gap: 4 },
  desktopRoleName: { fontFamily: "Inter_700Bold", fontSize: 12 },

  // ── Position badge ──
  positionBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2A1060",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  positionBadgePicking: { backgroundColor: "#F5C842" },
  positionText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#E8DEFF",
  },
  positionTextPicking: { color: "#0A0614" },

  // ── Team badge ──
  teamBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
    marginTop: 2,
  },
  teamBadgeText: { fontFamily: "Inter_700Bold", fontSize: 8, letterSpacing: 0.5 },

  // ── Status indicators ──
  doneTick: { position: "absolute", top: 4, right: 4 },
  doneTickText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  meMark: {
    position: "absolute",
    bottom: 3,
    fontFamily: "Inter_700Bold",
    fontSize: 8,
    color: "#F5C842",
  },
  meMarkDesktop: { fontFamily: "Inter_700Bold", fontSize: 9, color: "#F5C842" },
  pickingLabel: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: "#F5C842" },
  pickingDots: { fontSize: 18, color: "#F5C842", letterSpacing: 2 },
  waitingLabel: { fontFamily: "Inter_400Regular", fontSize: 9, color: "#4A2E7A" },
  waitingLabelText: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#4A2E7A" },

  // ── Main area ──
  mainArea: { flex: 1 },

  // ── Picking container ──
  pickingContainer: {
    padding: 32,
    alignItems: "center",
    gap: 16,
    paddingBottom: 48,
  },
  pickingContainerMobile: { padding: 16, gap: 12 },
  pickingTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 3,
    color: "#4A2E7A",
    textAlign: "center",
  },
  pickingSubtitle: {
    fontFamily: "Cinzel_700Bold",
    fontSize: 22,
    color: "#E8DEFF",
    textAlign: "center",
  },

  // ── Timer ──
  timerContainer: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  timerNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 56,
    color: "#F5C842",
    fontVariant: ["tabular-nums"],
  },
  timerUnit: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#9B7FD4" },
  timerUrgent: { color: "#C8102E" },
  timerBarBg: {
    height: 3,
    backgroundColor: "#2A1060",
    borderRadius: 2,
    width: "100%",
    maxWidth: 400,
  },
  timerBarFill: { height: 3, backgroundColor: "#F5C842", borderRadius: 2 },
  timerBarUrgent: { backgroundColor: "#C8102E" },

  // ── Cards grid ──
  cardsGrid: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    width: "100%",
    maxWidth: 700,
  },
  cardsGrid1: { justifyContent: "center" },
  cardsGrid2: { justifyContent: "center" },
  cardsGridMobile: { flexDirection: "column", alignItems: "stretch" },

  roleCardWrap: {
    flex: 1,
    maxWidth: 200,
    minWidth: 120,
  },
  roleCardWrapMobile: {
    flex: 0,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%",
  },

  // ── Role card ──
  roleCard: {
    flex: 1,
    aspectRatio: 0.75,
    backgroundColor: "#1A0A3E",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#2A1060",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    position: "relative",
    gap: 6,
  },
  roleCardSelected: { borderWidth: 3, backgroundColor: "#2A1060" },
  roleCardEmoji: { fontSize: 52, marginBottom: 6 },
  roleCardName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#E8DEFF",
    textAlign: "center",
  },
  roleCardTeamBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
  },
  roleCardTeamText: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 1 },
  roleCardAbility: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#9B7FD4",
    textAlign: "center",
    lineHeight: 16,
  },

  // ── Selected badge ──
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBadgeText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#0A0614" },

  // ── Buttons ──
  randomBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#3B1F8C",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: 400,
  },
  randomBtnEmoji: { fontSize: 20 },
  randomBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#9B7FD4", flex: 1 },
  confirmBtn: {
    backgroundColor: "#F5C842",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  confirmBtnDisabled: { backgroundColor: "#2A1060" },
  confirmBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#0A0614" },
  confirmBtnTextDisabled: { color: "#4A2E7A" },

  // ── Waiting area ──
  waitingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  waitingTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 3,
    color: "#4A2E7A",
    textAlign: "center",
  },
  waitingFraction: {
    fontFamily: "Inter_700Bold",
    fontSize: 80,
    color: "#F5C842",
    lineHeight: 90,
    fontVariant: ["tabular-nums"],
  },
  waitingFractionTotal: {
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    color: "#9B7FD4",
  },
  waitingSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#9B7FD4",
  },
  waitingBarBg: {
    height: 3,
    backgroundColor: "#2A1060",
    borderRadius: 2,
    width: 200,
  },
  waitingBarFill: { height: 3, backgroundColor: "#F5C842", borderRadius: 2 },
  waitingHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#4A2E7A",
    marginTop: 8,
  },
  questionMarks: { flexDirection: "row", gap: 20, marginTop: 12 },
  questionMark: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    color: "#3B1F8C",
  },
});
