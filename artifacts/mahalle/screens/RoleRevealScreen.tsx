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
        <Text style={{ fontSize: 48 }}>🔒</Text>
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", letterSpacing: 1.5, fontSize: 11, marginTop: 20 }}>
          {me?.nickname?.toUpperCase()}
        </Text>
        <Text style={{ color: c.foreground, fontFamily: "Cinzel_700Bold", fontSize: 22, marginTop: 10, textAlign: "center", letterSpacing: 2 }}>
          Telefonunu kimseye gösterme
        </Text>
        <Text style={{ color: c.mutedForeground, marginTop: 10, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 30, lineHeight: 20 }}>
          Rolünü görmek için aşağıya bas. Etrafındakilerin görmediğinden emin ol.
        </Text>
        <Btn
          label="Rolümü göster"
          onPress={() => setRevealed(true)}
          style={{ marginTop: 36, alignSelf: "stretch", marginHorizontal: 24 }}
        />
      </View>
    );
  }

  const teamColor = ROLE_TEAM_COLOR[role.team] ?? c.factionGood;

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{ padding: 20, gap: 14 }}
    >
      <View style={[styles.heroCard, { backgroundColor: c.card, borderColor: teamColor }]}>
        {img ? (
          <View style={[styles.avatarCircle, { borderColor: teamColor, shadowColor: teamColor }]}>
            <Image source={img} style={styles.avatarImg} />
          </View>
        ) : (
          <Text style={{ fontSize: 68 }}>{role.emoji}</Text>
        )}
        <Text style={{ color: c.foreground, fontFamily: "Cinzel_700Bold", fontSize: 26, marginTop: 14, letterSpacing: 2 }}>
          {role.name}
        </Text>
        <View style={{ paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, backgroundColor: teamColor + "20", marginTop: 10, borderWidth: 1, borderColor: teamColor + "55" }}>
          <Text style={{ color: teamColor, fontFamily: "Inter_700Bold", letterSpacing: 1.5, fontSize: 11 }}>
            {ROLE_TEAM_LABEL[role.team]}
          </Text>
        </View>
      </View>

      <Section c={c} title="Hikaye" body={role.story} />
      <Section c={c} title="Gece Yetkinliği" body={role.ability} />
      <Section c={c} title="Kazanma Koşulu" body={role.winCondition} />

      <View style={[styles.tipsCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 13, marginBottom: 8, letterSpacing: 0.5 }}>
          Taktik İpuçları
        </Text>
        {role.tips.map((t: string, i: number) => (
          <View key={i} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start", paddingVertical: 5 }}>
            <Feather name="zap" size={13} color={c.primary} style={{ marginTop: 3 }} />
            <Text style={{ color: c.foreground, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 }}>{t}</Text>
          </View>
        ))}
      </View>

      {state.ceteMembers.length > 0 ? (
        <View style={[styles.tipsCard, { backgroundColor: "#1E0510", borderColor: c.destructive + "44" }]}>
          <Text style={{ color: c.destructive, fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.5, marginBottom: 4 }}>
            EKİP ÜYELERİN
          </Text>
          {state.ceteMembers.map((m: any) => (
            <Text key={m.id} style={{ color: c.foreground, fontFamily: "Inter_500Medium", marginTop: 6 }}>
              • {m.nickname}{" "}
              <Text style={{ color: c.mutedForeground }}>({ROLE_DEFS[m.roleId ?? ""]?.name ?? "?"})</Text>
            </Text>
          ))}
        </View>
      ) : null}

      <Btn
        label={me?.isReady ? "✓ Hazırsın, diğerleri bekleniyor" : "✅ Anladım, Hazırım"}
        disabled={me?.isReady}
        onPress={() => emit("setReady")}
        style={{ marginTop: 6 }}
      />
    </ScrollView>
  );
}

function Section({ c, title, body }: any) {
  return (
    <View style={{ paddingHorizontal: 4, gap: 4 }}>
      <Text style={{ color: c.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5 }}>
        {title.toUpperCase()}
      </Text>
      <Text style={{ color: c.foreground, fontFamily: "Inter_400Regular", lineHeight: 22 }}>
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  heroCard: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  tipsCard: { padding: 16, borderRadius: 12, borderWidth: 1 },
});
