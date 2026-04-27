import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ROLE_DEFS } from "@/constants/roles";
import roleImages from "@/constants/roleImages";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PHASES = [
  {
    icon: "moon" as const,
    label: "GECE",
    color: "#7C4DFF",
    steps: [
      "Host oyunu başlatır, TTS Türkçe anlatım devreye girer.",
      "Tüm oyuncular gözlerini kapatır.",
      "Kumarbaz ve Kıskanç Komşu ilk eylemlerini yapar.",
      "Çete üyeleri gizli kanalda hedef oylaması yapar.",
      "Kapıcı bir evi kilitler; Şifacı Teyze birini korur.",
      "Bekçi ekip, Falcı tam rol sorgular.",
      "Hoca (tek kullanım), Savaş Gazisi Dede ve Anonim eylemlerini yapar.",
      "Sabah olur — ölümler ve özel olaylar açıklanır.",
    ],
  },
  {
    icon: "sun" as const,
    label: "GÜNDÜZ",
    color: "#E9B342",
    steps: [
      "Ölen oyuncunun rolü açıklanır.",
      "Hayatta kalanlar şüphelileri tartışır.",
      "Herkes argümanlarını sunar.",
      "Ölmüş oyuncular hayalet sohbetine erişir.",
      "Süre dolmadan önce linç oyu başlar.",
    ],
  },
  {
    icon: "users" as const,
    label: "OYLAMA",
    color: "#1ECBE1",
    steps: [
      "Her oyuncu linç edilecek kişiye oy verir.",
      "En çok oy alan linç edilir — rolü açıklanır.",
      "Eşitlik olursa ikinci tur başlar; yine eşit olursa kimse elenmez.",
      "Politikacı linç edilirse çete ANINDA kazanır.",
      "Kazanma koşulu kontrol edilir.",
    ],
  },
];

const WIN_CONDITIONS = [
  {
    team: "MAHALLE",
    color: "#1ECBE1",
    icon: "shield" as const,
    condition:
      "Tüm Davetsiz Misafir çetesi ve tehlikeli yalnız kurtlar (Anonim, Savaş Gazisi Dede) etkisiz hale getirilirse mahalle kazanır.",
  },
  {
    team: "ÇETE",
    color: "#FF4D6D",
    icon: "zap" as const,
    condition:
      "Çete, hayatta kalan mahallelilerle sayıca eşitlenirse veya geçerse kazanır. Politikacı linç edilirse çete ANINDA kazanır.",
  },
  {
    team: "KARGAŞACILAR (KAOS ROLLERİ)",
    color: "#F5A623",
    icon: "shuffle" as const,
    condition:
      "Kumarbaz son 3'e kalırsa kazanır. Kırık Kalp, aşığıyla ikisi birlikte oyun sonuna ulaşırsa kazanır. Dedikoducu, 2 masum linç edilirse kişisel puan alır.",
  },
  {
    team: "YALNIZ KURTLAR (TARAFSIZ ROLLER)",
    color: "#9B7FD4",
    icon: "target" as const,
    condition:
      "Anonim, işaretlediği 3 kişi linç edilirse tek başına kazanır. Savaş Gazisi Dede, hayatta kalan son oyuncu olursa kazanır.",
  },
];

const NAMED_ROLE_IDS = [
  "mahalle_sakini", "muhtar", "bekci", "otaci", "falci", "kapici", "muhabir", "tiyatrocu", "hoca",
  "tefeci_basi", "tahsildar", "sahte_dernek", "icten_pazarlikli",
  "kumarbaz", "kiskanc_komsu", "kirik_kalp", "dedikoducu",
  "anonim", "savas_gazisi_dede",
];

const TEAM_GROUPS: { team: "iyi" | "kotu" | "kaos" | "tarafsiz"; title: string; color: string }[] = [
  { team: "iyi", title: "MAHALLE — İYİ TARAF", color: "#1ECBE1" },
  { team: "kotu", title: "ÇETE — KÖTÜ TARAF", color: "#FF4D6D" },
  { team: "kaos", title: "KARGAŞACILAR (KAOS ROLLERİ)", color: "#F5A623" },
  { team: "tarafsiz", title: "YALNIZ KURTLAR (TARAFSIZ ROLLER)", color: "#9B7FD4" },
];

export default function HowToPlayScreen({ visible, onClose }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"oyun" | "roller">("oyun");

  const namedRoles = NAMED_ROLE_IDS
    .map((id) => ROLE_DEFS[id])
    .filter(Boolean);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.root, { backgroundColor: c.background }]}>
        <View
          style={[
            s.header,
            { borderBottomColor: c.border, paddingTop: insets.top > 0 ? insets.top : 12 },
          ]}
        >
          <Text style={[s.headerTitle, { color: c.foreground }]}>Nasıl Oynanır?</Text>
          <Pressable onPress={onClose} hitSlop={12} style={{ padding: 4 }}>
            <Feather name="x" size={22} color={c.mutedForeground} />
          </Pressable>
        </View>

        <View style={[s.tabBar, { borderBottomColor: c.border }]}>
          {(["oyun", "roller"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[
                s.tabBtn,
                tab === t && { borderBottomColor: "#E9B342", borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={[
                  s.tabLabel,
                  { color: tab === t ? "#E9B342" : c.mutedForeground },
                ]}
              >
                {t === "oyun" ? "🎮  OYUN AKIŞI" : `🃏  ROLLER (${namedRoles.length})`}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {tab === "oyun" ? (
            <>
              <View style={[s.introCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[s.introTitle, { color: c.foreground }]}>
                  4-30 Kişi · Tek Mekan · {namedRoles.length} Rol
                </Text>
                <Text style={[s.introText, { color: c.mutedForeground }]}>
                  Herkesin elinde telefon, host masanın ortasında. Mahalle
                  sakinleri arasına sızmış{" "}
                  <Text style={{ color: "#FF4D6D" }}>Davetsiz Misafir</Text>'i
                  bulup idam etmek için gece ile gündüz arasında gidip
                  gelirsiniz. Kargaşacılar (Kaos rolleri) ve yalnız kurtlar (Tarafsız roller) kendi
                  gündemlerini takip eder.
                </Text>
              </View>

              {PHASES.map((phase) => (
                <View
                  key={phase.label}
                  style={[s.phaseCard, { backgroundColor: c.card, borderColor: c.border }]}
                >
                  <View style={s.phaseHeader}>
                    <View style={[s.phaseIconWrap, { backgroundColor: phase.color + "22" }]}>
                      <Feather name={phase.icon} size={18} color={phase.color} />
                    </View>
                    <Text style={[s.phaseLabel, { color: phase.color }]}>
                      {phase.label}
                    </Text>
                  </View>
                  {phase.steps.map((step, i) => (
                    <View key={i} style={s.stepRow}>
                      <View style={[s.stepDot, { backgroundColor: phase.color }]} />
                      <Text style={[s.stepText, { color: c.foreground }]}>{step}</Text>
                    </View>
                  ))}
                </View>
              ))}

              <Text style={[s.sectionTitle, { color: c.mutedForeground }]}>
                KAZANMA KOŞULLARI
              </Text>
              {WIN_CONDITIONS.map((w) => (
                <View
                  key={w.team}
                  style={[s.winCard, { backgroundColor: c.card, borderColor: w.color + "55" }]}
                >
                  <View style={[s.winIcon, { backgroundColor: w.color + "22" }]}>
                    <Feather name={w.icon} size={16} color={w.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.winTeam, { color: w.color }]}>{w.team}</Text>
                    <Text style={[s.winText, { color: c.foreground }]}>{w.condition}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <>
              {TEAM_GROUPS.map((group) => {
                const roles = namedRoles.filter((r) => r.team === group.team);
                if (roles.length === 0) return null;
                return (
                  <TeamSection
                    key={group.team}
                    c={c}
                    title={group.title}
                    teamColor={group.color}
                    roles={roles}
                  />
                );
              })}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function TeamSection({ c, title, teamColor, roles }: any) {
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={[s.teamHeader, { borderColor: teamColor + "55" }]}>
        <View style={[s.teamDot, { backgroundColor: teamColor }]} />
        <Text style={[s.teamTitle, { color: teamColor }]}>{title}</Text>
        <View style={[s.teamCount, { backgroundColor: teamColor + "22" }]}>
          <Text style={[s.teamCountText, { color: teamColor }]}>{roles.length}</Text>
        </View>
      </View>
      {roles.map((role: any) => (
        <RoleCard key={role.id} c={c} role={role} teamColor={teamColor} />
      ))}
    </View>
  );
}

function RoleCard({ c, role, teamColor }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      style={[s.roleCard, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <View style={s.roleTop}>
        {roleImages[role.id] ? (
          <View style={[s.roleAvatarCircle, { borderColor: teamColor + "66" }]}>
            <Image source={roleImages[role.id]} style={s.roleAvatarImg} />
          </View>
        ) : (
          <Text style={s.roleEmoji}>{role.emoji}</Text>
        )}
        <View style={{ flex: 1 }}>
          <View style={s.roleNameRow}>
            <Text style={[s.roleName, { color: c.foreground }]}>{role.name}</Text>
            {role.voteWeight !== 1 && (
              <View style={[s.voteBadge, { backgroundColor: "#E9B34222" }]}>
                <Text style={[s.voteBadgeText, { color: "#E9B342" }]}>
                  ×{role.voteWeight} oy
                </Text>
              </View>
            )}
          </View>
          <Text style={[s.roleDesc, { color: c.mutedForeground }]} numberOfLines={expanded ? undefined : 2}>
            {role.description}
          </Text>
        </View>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={c.mutedForeground}
        />
      </View>

      {expanded && (
        <View style={[s.roleDetails, { borderTopColor: c.border }]}>
          <View style={[s.storyBox, { backgroundColor: teamColor + "0F" }]}>
            <Text style={[s.storyText, { color: c.mutedForeground }]}>
              "{role.story}"
            </Text>
          </View>

          <InfoRow
            c={c}
            icon="zap"
            iconColor="#E9B342"
            label="Yetenek"
            text={role.ability}
          />
          <InfoRow
            c={c}
            icon="flag"
            iconColor={teamColor}
            label="Kazanma"
            text={role.winCondition}
          />

          {role.tips.length > 0 && (
            <View style={s.tipsWrap}>
              <Text style={[s.tipsTitle, { color: c.mutedForeground }]}>
                💡 İPUCU
              </Text>
              {role.tips.map((tip: string, i: number) => (
                <View key={i} style={s.tipRow}>
                  <Text style={[s.tipBullet, { color: teamColor }]}>•</Text>
                  <Text style={[s.tipText, { color: c.foreground }]}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

function InfoRow({ c, icon, iconColor, label, text }: any) {
  return (
    <View style={s.infoRow}>
      <View style={[s.infoIconWrap, { backgroundColor: iconColor + "22" }]}>
        <Feather name={icon} size={13} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.infoLabel, { color: c.mutedForeground }]}>{label}</Text>
        <Text style={[s.infoText, { color: c.foreground }]}>{text}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontFamily: "Cinzel_900Black", fontSize: 17, letterSpacing: 2, color: "#F5C842" },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1 },
  scroll: { padding: 16, gap: 12 },

  introCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  introTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  introText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },

  phaseCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  phaseHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  phaseIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseLabel: { fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 2 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  stepText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, flex: 1 },

  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  winCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  winIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  winTeam: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1, marginBottom: 3 },
  winText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },

  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  teamDot: { width: 8, height: 8, borderRadius: 4 },
  teamTitle: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.5, flex: 1 },
  teamCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  teamCountText: { fontFamily: "Inter_700Bold", fontSize: 11 },

  roleCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
  },
  roleTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  roleEmoji: { fontSize: 32, width: 48, textAlign: "center" },
  roleAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    flexShrink: 0,
  },
  roleAvatarImg: { width: "100%", height: "100%" },
  roleNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  roleName: { fontFamily: "Inter_700Bold", fontSize: 15 },
  voteBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  voteBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  roleDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },

  roleDetails: {
    padding: 14,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  storyBox: { padding: 12, borderRadius: 10 },
  storyText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, fontStyle: "italic" },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 1 },
  infoLabel: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1, marginBottom: 2 },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  tipsWrap: { gap: 6 },
  tipsTitle: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1 },
  tipRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  tipBullet: { fontFamily: "Inter_700Bold", fontSize: 14, lineHeight: 20 },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, flex: 1 },
});
