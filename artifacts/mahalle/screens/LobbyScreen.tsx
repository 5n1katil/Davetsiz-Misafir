import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn } from "@/components/Btn";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";

export default function LobbyScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const {
    createRoom,
    joinRoom,
    myNickname,
    setNickname,
    state,
    myPlayerId,
    emit,
  } = useGame();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"create" | "join">("create");

  const inRoom = !!state;

  if (!inRoom) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={["#1B2238", "#0B0F1F"]}
            style={styles.heroBg}
          />
          <View style={styles.hero}>
            <Text style={styles.brand}>MAHALLE</Text>
            <Text style={[styles.tag, { color: c.mutedForeground }]}>
              Tefeci çetesini bul. Yoksa mahalle onların olur.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.label, { color: c.mutedForeground }]}>Adın</Text>
            <TextInput
              value={myNickname}
              onChangeText={setNickname}
              placeholder="Ör: Selim Abi"
              placeholderTextColor={c.mutedForeground}
              maxLength={20}
              style={[
                styles.input,
                { color: c.foreground, borderColor: c.border, backgroundColor: c.background },
              ]}
            />

            <View style={[styles.tabs, { borderColor: c.border }]}>
              <Pressable
                onPress={() => setTab("create")}
                style={[
                  styles.tab,
                  tab === "create" && { backgroundColor: c.primary },
                ]}
              >
                <Text
                  style={{
                    color: tab === "create" ? c.primaryForeground : c.foreground,
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  Oda Kur
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTab("join")}
                style={[
                  styles.tab,
                  tab === "join" && { backgroundColor: c.primary },
                ]}
              >
                <Text
                  style={{
                    color: tab === "join" ? c.primaryForeground : c.foreground,
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  Odaya Katıl
                </Text>
              </Pressable>
            </View>

            {tab === "join" ? (
              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                placeholder="ODA KODU (ör. KAHVE47)"
                placeholderTextColor={c.mutedForeground}
                maxLength={10}
                autoCapitalize="characters"
                style={[
                  styles.input,
                  styles.codeInput,
                  { color: c.foreground, borderColor: c.border, backgroundColor: c.background },
                ]}
              />
            ) : null}

            <Btn
              label={tab === "create" ? "Oda Kur" : "Katıl"}
              loading={busy}
              onPress={async () => {
                if (!myNickname.trim()) {
                  Alert.alert("Adını yaz", "Önce mahalleli adını girmelisin.");
                  return;
                }
                if (tab === "join" && code.trim().length < 3) {
                  Alert.alert("Kod yok", "Geçerli bir oda kodu gir.");
                  return;
                }
                setBusy(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const res =
                  tab === "create"
                    ? await createRoom(myNickname.trim())
                    : await joinRoom(code.trim(), myNickname.trim());
                setBusy(false);
                if (!res.ok) Alert.alert("Hata", res.error ?? "Bilinmeyen hata");
              }}
            />
          </View>

          <View style={[styles.howWrap]}>
            <Text style={[styles.howTitle, { color: c.foreground }]}>Nasıl oynanır?</Text>
            <How
              c={c}
              icon="users"
              title="4-30 kişi, tek mekanda"
              text="Arkadaşlarınla yan yana oturun. Herkesin elinde telefon."
            />
            <How
              c={c}
              icon="volume-2"
              title="Host telefonu masada"
              text="Host telefonu hoparlör açık olarak masaya yatırır, oyunu sesli yönetir."
            />
            <How
              c={c}
              icon="moon"
              title="Gece, gündüz, oylama"
              text="Çete geceleri saldırır. Gündüz mahalle suçluyu bulmaya çalışır."
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // In LOBBY (waiting room) — host edits settings, others wait
  const isHost = state && myPlayerId === state.hostId;
  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={[styles.codeCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12 }}>
          ODA KODU
        </Text>
        <Text style={{ color: c.primary, fontFamily: "Inter_700Bold", fontSize: 36, letterSpacing: 4, marginTop: 4 }}>
          {state.code}
        </Text>
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 }}>
          Bu kodu arkadaşlarına paylaş
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: c.foreground }]}>
        Mahalleli ({state.players.length}/30)
      </Text>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        {state.players.map((p) => (
          <View key={p.id} style={styles.playerRow}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: c.secondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold" }}>
                {p.nickname[0]?.toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: c.foreground, fontFamily: "Inter_500Medium", flex: 1 }}>
              {p.nickname}
              {p.id === myPlayerId ? "  •  sen" : ""}
            </Text>
            {p.isHost ? (
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: c.primary, borderRadius: 6 }}>
                <Text style={{ color: c.primaryForeground, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
                  HOST
                </Text>
              </View>
            ) : null}
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.isConnected ? "#4FB794" : "#5A5872" }} />
          </View>
        ))}
      </View>

      {isHost ? (
        <HostSettings c={c} state={state} emit={emit} />
      ) : (
        <View style={[styles.waitCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="clock" size={22} color={c.primary} />
          <Text style={{ color: c.foreground, fontFamily: "Inter_500Medium", marginTop: 8, textAlign: "center" }}>
            Host'un oyunu başlatması bekleniyor...
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function HostSettings({ c, state, emit }: any) {
  const opt = (label: string, active: boolean, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: active ? c.primary : c.background,
        borderWidth: 1,
        borderColor: active ? c.primary : c.border,
      }}
    >
      <Text style={{ color: active ? c.primaryForeground : c.foreground, fontFamily: "Inter_500Medium" }}>
        {label}
      </Text>
    </Pressable>
  );

  const toggleSpecial = (id: string) => {
    const list: string[] = state.settings.activeSpecialRoles;
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    emit("updateSettings", { patch: { activeSpecialRoles: next } });
  };

  return (
    <>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>Ayarlar</Text>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, gap: 16 }]}>
        <View>
          <Text style={[styles.label, { color: c.mutedForeground }]}>Gündüz süresi</Text>
          <View style={styles.rowGap}>
            {opt("3 dk", state.settings.dayDurationSec === 180, () =>
              emit("updateSettings", { patch: { dayDurationSec: 180 } }),
            )}
            {opt("5 dk", state.settings.dayDurationSec === 300, () =>
              emit("updateSettings", { patch: { dayDurationSec: 300 } }),
            )}
          </View>
        </View>
        <View>
          <Text style={[styles.label, { color: c.mutedForeground }]}>Çete sayısı</Text>
          <View style={styles.rowGap}>
            {[1, 2, 3].map((n) =>
              opt(`${n}`, state.settings.ceteCount === n, () =>
                emit("updateSettings", { patch: { ceteCount: n } }),
              ),
            )}
          </View>
        </View>
        <View>
          <Text style={[styles.label, { color: c.mutedForeground }]}>Aktif özel roller</Text>
          <View style={styles.rowGap}>
            {[
              { id: "muhtar", label: "🎖️ Muhtar" },
              { id: "bekci", label: "🔦 Bekçi" },
              { id: "otaci", label: "🌿 Otacı" },
              { id: "falci", label: "🔮 Falcı" },
            ].map((r) => opt(r.label, state.settings.activeSpecialRoles.includes(r.id), () => toggleSpecial(r.id)))}
          </View>
        </View>
        <View>
          <Text style={[styles.label, { color: c.mutedForeground }]}>Gece aksiyon süresi</Text>
          <View style={styles.rowGap}>
            {opt("10 sn", state.settings.nightActionDurationSec === 10, () =>
              emit("updateSettings", { patch: { nightActionDurationSec: 10 } }),
            )}
            {opt("15 sn", state.settings.nightActionDurationSec === 15, () =>
              emit("updateSettings", { patch: { nightActionDurationSec: 15 } }),
            )}
          </View>
        </View>
      </View>
      <Btn
        label={state.players.length < 4 ? `En az 4 oyuncu (${state.players.length}/4)` : "Oyunu Başlat"}
        disabled={state.players.length < 4}
        onPress={() => emit("startGame")}
        style={{ marginTop: 18 }}
      />
    </>
  );
}

function How({ c, icon, title, text }: any) {
  return (
    <View style={[styles.howRow, { borderColor: c.border }]}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: c.card,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon} size={18} color={c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
          {title}
        </Text>
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, gap: 14 },
  heroBg: { position: "absolute", left: 0, right: 0, top: 0, height: 240 },
  hero: { paddingTop: 28, paddingBottom: 24, alignItems: "center" },
  brand: {
    fontFamily: "Inter_700Bold",
    fontSize: 44,
    letterSpacing: 6,
    color: "#E9B342",
  },
  tag: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 8, textAlign: "center", paddingHorizontal: 18 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  codeInput: { textAlign: "center", letterSpacing: 4, fontFamily: "Inter_700Bold" },
  tabs: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  howWrap: { gap: 10, marginTop: 8 },
  howTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 6 },
  howRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  codeCard: { padding: 18, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginTop: 6 },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  rowGap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  waitCard: { padding: 22, borderRadius: 16, borderWidth: 1, alignItems: "center" },
});
