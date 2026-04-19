import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ROLE_DEFS } from "@/constants/roles";
import { useColors } from "@/hooks/useColors";
import {
  clearHistory,
  computeStats,
  GameRecord,
  loadHistory,
  PlayerStats,
} from "@/lib/history";

interface Colors {
  background: string;
  foreground: string;
  mutedForeground: string;
  card: string;
  border: string;
  primary: string;
  secondary: string;
}

interface StatBoxProps {
  label: string;
  value: string;
  color: string;
  c: Colors;
}

interface TeamRowProps {
  label: string;
  emoji: string;
  games: number;
  wins: number;
  color: string;
  c: Colors;
}

interface GameRowProps {
  game: GameRecord;
  c: Colors;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function StatsScreen({ visible, onClose }: Props) {
  const c = useColors();
  const [stats, setStats] = useState<PlayerStats | null>(null);

  const refresh = useCallback(async () => {
    const history = await loadHistory();
    setStats(computeStats(history));
  }, []);

  useEffect(() => {
    if (visible) refresh();
  }, [visible, refresh]);

  const handleClear = () => {
    Alert.alert(
      "Geçmişi Sil",
      "Tüm oyun geçmişin silinecek. Emin misin?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            await clearHistory();
            refresh();
          },
        },
      ],
    );
  };

  const mostPlayedRole = stats?.mostPlayedRoleId
    ? ROLE_DEFS[stats.mostPlayedRoleId]
    : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Text style={[styles.title, { color: c.foreground }]}>İstatistikler</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Feather name="x" size={22} color={c.foreground} />
          </Pressable>
        </View>

        {!stats || stats.gamesPlayed === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="bar-chart-2" size={48} color={c.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>Henüz oyun yok</Text>
            <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
              İlk oyununu oynadıktan sonra istatistiklerin burada görünür.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.statRow}>
              <StatBox label="Oynanan" value={String(stats.gamesPlayed)} color={c.primary} c={c} />
              <StatBox label="Galibiyet" value={String(stats.wins)} color="#4FB794" c={c} />
              <StatBox label="Mağlubiyet" value={String(stats.losses)} color="#E5654E" c={c} />
            </View>

            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>KAZANMA ORANI</Text>
              <View style={styles.winRateRow}>
                <Text style={[styles.winRatePct, { color: c.foreground }]}>
                  {Math.round(stats.winRate * 100)}%
                </Text>
                <View style={[styles.bar, { backgroundColor: c.secondary }]}>
                  <View style={{ flex: stats.winRate, height: 8, borderRadius: 4, backgroundColor: "#4FB794" }} />
                  <View style={{ flex: 1 - stats.winRate }} />
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>TAKIMA GÖRE</Text>
              <TeamRow
                label="Mahalle"
                emoji="🏘️"
                games={stats.mahalleGames}
                wins={stats.mahalleWins}
                color="#4FB794"
                c={c}
              />
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <TeamRow
                label="Davetsiz Misafir"
                emoji="🚪"
                games={stats.ceteGames}
                wins={stats.ceteWins}
                color="#E5654E"
                c={c}
              />
            </View>

            {mostPlayedRole && stats.mostPlayedRoleId && (
              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>EN ÇOK OYNANAN ROL</Text>
                <View style={styles.roleRow}>
                  <Text style={styles.roleEmoji}>{mostPlayedRole.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleName, { color: c.foreground }]}>{mostPlayedRole.name}</Text>
                    <Text style={[styles.roleCount, { color: c.mutedForeground }]}>
                      {stats.roleCounts[stats.mostPlayedRoleId]} kez oynandı
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {stats.recentGames.length > 0 && (
              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>SON OYUNLAR</Text>
                {stats.recentGames.map((g) => (
                  <GameRow key={g.id} game={g} c={c} />
                ))}
              </View>
            )}

            <Pressable onPress={handleClear} style={styles.clearBtn}>
              <Text style={[styles.clearText, { color: c.mutedForeground }]}>Geçmişi Temizle</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function StatBox({ label, value, color, c }: StatBoxProps) {
  return (
    <View style={[styles.statBox, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function TeamRow({ label, emoji, games, wins, color, c }: TeamRowProps) {
  const rate = games > 0 ? Math.round((wins / games) * 100) : 0;
  return (
    <View style={styles.teamRow}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.teamLabel, { color: c.foreground }]}>{label}</Text>
        <Text style={[styles.teamSub, { color: c.mutedForeground }]}>
          {games} oyun · {wins} galibiyet
        </Text>
      </View>
      <Text style={[styles.teamRate, { color }]}>{rate}%</Text>
    </View>
  );
}

function GameRow({ game, c }: GameRowProps) {
  const role = ROLE_DEFS[game.myRoleId];
  const date = new Date(game.playedAt);
  const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  return (
    <View style={styles.gameRow}>
      <Text style={{ fontSize: 18 }}>{role?.emoji ?? "🙂"}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.gameRole, { color: c.foreground }]}>{role?.name ?? game.myRoleId}</Text>
        <Text style={[styles.gameDate, { color: c.mutedForeground }]}>
          {dateStr} · {game.playerCount} oyuncu
        </Text>
      </View>
      <Text
        style={[
          styles.gameResult,
          { color: game.won ? "#4FB794" : "#E5654E" },
        ]}
      >
        {game.won ? "GALİP" : "MAĞLUBİYET"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  closeBtn: { padding: 4 },
  scroll: { padding: 18, gap: 14, paddingBottom: 40 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  statRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 28 },
  statLabel: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.5 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  winRateRow: { gap: 8 },
  winRatePct: { fontFamily: "Inter_700Bold", fontSize: 36 },
  bar: { height: 8, borderRadius: 4, overflow: "hidden", flexDirection: "row" },
  divider: { height: StyleSheet.hairlineWidth },
  teamRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  teamLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  teamSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  teamRate: { fontFamily: "Inter_700Bold", fontSize: 18 },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  roleEmoji: { fontSize: 32 },
  roleName: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  roleCount: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  gameRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  gameRole: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  gameDate: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  gameResult: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 0.5 },
  clearBtn: { alignItems: "center", paddingVertical: 12 },
  clearText: { fontFamily: "Inter_400Regular", fontSize: 13 },
});
