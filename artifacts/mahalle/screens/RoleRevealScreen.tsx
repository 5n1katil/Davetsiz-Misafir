import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { Btn } from "@/components/Btn";
import { ROLE_DEFS, ROLE_TEAM_COLOR, ROLE_TEAM_LABEL } from "@/constants/roles";
import roleImages from "@/constants/roleImages";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";

const AVATAR_SIZE = 140;

export default function RoleRevealScreen() {
  const c = useColors();
  const { state, myPlayerId, emit } = useGame();
  const [revealed, setRevealed] = useState(false);
  if (!state || !state.myRole) return null;
  const role = ROLE_DEFS[state.myRole];
  if (!role) return null;
  const me = state.players.find((p) => p.id === myPlayerId);
  const img = roleImages[state.myRole];

  if (!revealed) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Text style={{ fontSize: 52 }}>🔒</Text>
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", letterSpacing: 2, fontSize: 14, marginTop: 22 }}>
          {me?.nickname?.toUpperCase()}
        </Text>
        <Text style={{ color: c.foreground, fontFamily: "Cinzel_700Bold", fontSize: 22, marginTop: 10, textAlign: "center", letterSpacing: 2, paddingHorizontal: 20 }}>
          Telefonunu kimseye gösterme
        </Text>
        <Text style={{ color: c.mutedForeground, marginTop: 12, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32, lineHeight: 21, fontSize: 16 }}>
          Rolünü görmek için aşağıya bas. Etrafındakilerin görmediğinden emin ol.
        </Text>
        <Btn
          label="Rolümü Göster"
          onPress={() => setRevealed(true)}
          style={{ marginTop: 40, alignSelf: "stretch", marginHorizontal: 24 }}
        />
      </View>
    );
  }

  const teamColor = ROLE_TEAM_COLOR[role.team] ?? c.factionGood;

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{ padding: 18, gap: 12 }}
    >
      {/* ── Hero kart ──────────────────────────────────────────────────── */}
      <View style={[styles.heroCard, { backgroundColor: c.card, borderColor: teamColor + "55" }]}>
        {/* Takım rengi arka plan tonu */}
        <View style={[styles.heroBg, { backgroundColor: teamColor + "0D" }]} />

        {img ? (
          <View style={[styles.avatarCircle, { borderColor: teamColor, shadowColor: teamColor }]}>
            <Image source={img} style={styles.avatarImg} />
          </View>
        ) : (
          <Text style={{ fontSize: 72 }}>{role.emoji}</Text>
        )}

        <Text style={{ color: c.foreground, fontFamily: "Cinzel_700Bold", fontSize: 26, marginTop: 16, letterSpacing: 2, textAlign: "center" }}>
          {role.name}
        </Text>

        <View style={[styles.teamBadge, { backgroundColor: teamColor + "22", borderColor: teamColor + "66" }]}>
          <Text style={{ color: teamColor, fontFamily: "Inter_700Bold", letterSpacing: 2, fontSize: 13 }}>
            {ROLE_TEAM_LABEL[role.team]}
          </Text>
        </View>

        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 15, marginTop: 12, textAlign: "center", lineHeight: 20, paddingHorizontal: 8 }}>
          {role.description}
        </Text>
      </View>

      {/* ── Hikaye ──────────────────────────────────────────────────────── */}
      <Section
        c={c}
        teamColor={teamColor}
        icon="book-open"
        title="Mahalle Hikayesi"
        body={role.story}
      />

      {/* ── Gece Yetkinliği ─────────────────────────────────────────────── */}
      <Section
        c={c}
        teamColor={teamColor}
        icon="moon"
        title="Gece Yetkinliği"
        body={role.ability}
        highlight
      />

      {/* ── Kazanma Koşulu ──────────────────────────────────────────────── */}
      <View style={[styles.winCard, { backgroundColor: teamColor + "14", borderColor: teamColor + "44" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Feather name="award" size={14} color={teamColor} />
          <Text style={{ color: teamColor, fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 2 }}>
            KAZANMA KOŞULU
          </Text>
        </View>
        <Text style={{ color: c.foreground, fontFamily: "Inter_500Medium", lineHeight: 22, fontSize: 16 }}>
          {role.winCondition}
        </Text>
      </View>

      {/* ── Taktik İpuçları ─────────────────────────────────────────────── */}
      <View style={[styles.tipsCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Feather name="zap" size={14} color={c.primary} />
          <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 15, letterSpacing: 0.5 }}>
            Taktik İpuçları
          </Text>
        </View>
        {role.tips.map((t: string, i: number) => (
          <View key={i} style={styles.tipRow}>
            <View style={[styles.tipBullet, { backgroundColor: c.primary + "33" }]}>
              <Text style={{ color: c.primary, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                {i + 1}
              </Text>
            </View>
            <Text style={{ color: c.foreground, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 21, fontSize: 16 }}>
              {t}
            </Text>
          </View>
        ))}
      </View>

      {/* ── Çete üyeleri (yalnızca çete takımına gösterilir) ─────────────── */}
      {state.ceteMembers.length > 0 ? (
        <View style={[styles.tipsCard, { backgroundColor: "#1E0510", borderColor: c.destructive + "44" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Feather name="users" size={14} color={c.destructive} />
            <Text style={{ color: c.destructive, fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 2 }}>
              EKİP ÜYELERİN
            </Text>
          </View>
          {state.ceteMembers.map((m: any) => (
            <View key={m.id} style={styles.memberRow}>
              <View style={[styles.memberInitial, { backgroundColor: c.destructive + "22" }]}>
                <Text style={{ color: c.destructive, fontFamily: "Inter_700Bold", fontSize: 15 }}>
                  {m.nickname[0]?.toUpperCase()}
                </Text>
              </View>
              <Text style={{ color: c.foreground, fontFamily: "Inter_500Medium", flex: 1 }}>
                {m.nickname}
              </Text>
              <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 15 }}>
                {ROLE_DEFS[m.roleId ?? ""]?.name ?? "?"}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Btn
        label={me?.isReady ? "✓ Hazırsın — diğerleri bekleniyor" : "✅ Anladım, Hazırım"}
        disabled={me?.isReady}
        onPress={() => emit("setReady")}
        style={{ marginTop: 8, marginBottom: 4 }}
      />
    </ScrollView>
  );
}

function Section({
  c,
  teamColor,
  icon,
  title,
  body,
  highlight,
}: {
  c: any;
  teamColor: string;
  icon: string;
  title: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: highlight ? teamColor + "0A" : c.card,
          borderColor: highlight ? teamColor + "33" : c.border,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Feather name={icon as any} size={13} color={highlight ? teamColor : c.mutedForeground} />
        <Text
          style={{
            color: highlight ? teamColor : c.mutedForeground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 13,
            letterSpacing: 2,
          }}
        >
          {title.toUpperCase()}
        </Text>
      </View>
      <Text style={{ color: c.foreground, fontFamily: "Inter_400Regular", lineHeight: 22, fontSize: 16 }}>
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  heroCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  heroBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 8,
  },
  avatarImg: { width: "100%", height: "100%" },
  teamBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 12,
    borderWidth: 1,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  winCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  tipsCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  tipRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  tipBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  memberInitial: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
