import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Btn } from "@/components/Btn";
import { ROLE_DEFS, ROLE_TEAM_LABEL } from "@/constants/roles";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";

export default function RoleRevealScreen() {
  const c = useColors();
  const { state, myPlayerId, emit } = useGame();
  const [revealed, setRevealed] = useState(false);
  if (!state || !state.myRole) return null;
  const role = ROLE_DEFS[state.myRole];
  if (!role) return null;
  const me = state.players.find((p) => p.id === myPlayerId);

  if (!revealed) {
    return (
      <View style={styles.center}>
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", letterSpacing: 1, fontSize: 12 }}>
          {me?.nickname?.toUpperCase()}
        </Text>
        <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 26, marginTop: 12, textAlign: "center" }}>
          Telefonunu kimseye gösterme
        </Text>
        <Text style={{ color: c.mutedForeground, marginTop: 8, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 30 }}>
          Rolünü göstermek için aşağıya bas. Etrafındakilerin görmediğinden emin ol.
        </Text>
        <Btn
          label="Rolümü göster"
          onPress={() => setRevealed(true)}
          style={{ marginTop: 32, alignSelf: "stretch", marginHorizontal: 24 }}
        />
      </View>
    );
  }

  const teamColor = role.team === "iyi" ? "#4FB794" : "#E5654E";

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
      <View style={[styles.heroCard, { backgroundColor: c.card, borderColor: teamColor + "55" }]}>
        <Text style={{ fontSize: 64 }}>{role.emoji}</Text>
        <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 28, marginTop: 6 }}>
          {role.name}
        </Text>
        <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: teamColor + "22", marginTop: 8 }}>
          <Text style={{ color: teamColor, fontFamily: "Inter_700Bold", letterSpacing: 1, fontSize: 11 }}>
            {ROLE_TEAM_LABEL[role.team]}
          </Text>
        </View>
      </View>

      <Section c={c} title="Hikaye" body={role.story} />
      <Section c={c} title="Gece Yetkinliği" body={role.ability} />
      <Section c={c} title="Kazanma Koşulu" body={role.winCondition} />

      <View style={[styles.tipsCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={{ color: c.foreground, fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 6 }}>
          Taktik İpuçları
        </Text>
        {role.tips.map((t, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start", paddingVertical: 4 }}>
            <Feather name="zap" size={14} color={c.primary} style={{ marginTop: 3 }} />
            <Text style={{ color: c.foreground, fontFamily: "Inter_400Regular", flex: 1 }}>{t}</Text>
          </View>
        ))}
      </View>

      {state.ceteMembers.length > 0 ? (
        <View style={[styles.tipsCard, { backgroundColor: "#3A1F1F", borderColor: "#E5654E55" }]}>
          <Text style={{ color: "#E5654E", fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 1 }}>
            ÇETE ÜYELERİN
          </Text>
          {state.ceteMembers.map((m) => (
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
    <View style={{ paddingHorizontal: 6 }}>
      <Text style={{ color: c.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1 }}>
        {title.toUpperCase()}
      </Text>
      <Text style={{ color: c.foreground, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 21 }}>
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
    borderRadius: 20,
    borderWidth: 1,
  },
  tipsCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
});
