import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { haptic } from "@/lib/haptics";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn } from "@/components/Btn";
import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import SettingsScreen from "@/screens/SettingsScreen";
import StatsScreen from "@/screens/StatsScreen";

const SCREEN_W = Dimensions.get("window").width;
const LOGO_SIZE = Math.min(SCREEN_W * 0.78, 300);

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
    vibrationsEnabled,
    toggleVibrations,
  } = useGame();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [statsVisible, setStatsVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const skeletonOpacity = useRef(new Animated.Value(0.3)).current;
  const inputFadeAnim = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: false }),
    ]).start();
  }, []);

  useEffect(() => {
    if (myNickname !== null || reduceMotion !== false) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, { toValue: 0.6, duration: 600, useNativeDriver: true }),
        Animated.timing(skeletonOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [myNickname, reduceMotion]);

  useEffect(() => {
    if (myNickname === null) return;
    Animated.timing(inputFadeAnim, {
      toValue: 1,
      duration: reduceMotion ? 0 : 200,
      useNativeDriver: true,
    }).start();
  }, [myNickname]);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });
    const sub = Linking.addEventListener("url", ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, []);

  function handleDeepLink(url: string) {
    const parsed = Linking.parse(url);
    if (parsed.path === "join" && parsed.queryParams?.code) {
      const roomCode = String(parsed.queryParams.code).toUpperCase();
      setCode(roomCode);
      setMode("join");
    }
  }

  async function handleCreate() {
    if (!(myNickname ?? "").trim()) {
      Alert.alert("Adını yaz", "Önce mahalleli adını girmelisin.");
      return;
    }
    setBusy(true);
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    const res = await createRoom((myNickname ?? "").trim());
    setBusy(false);
    if (!res.ok) Alert.alert("Hata", res.error ?? "Bilinmeyen hata");
  }

  async function handleJoin() {
    if (!(myNickname ?? "").trim()) {
      Alert.alert("Adını yaz", "Önce mahalleli adını girmelisin.");
      return;
    }
    if (code.trim().length < 3) {
      Alert.alert("Kod yok", "Geçerli bir oda kodu gir.");
      return;
    }
    setBusy(true);
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    const res = await joinRoom(code.trim(), (myNickname ?? "").trim());
    setBusy(false);
    if (!res.ok) Alert.alert("Hata", res.error ?? "Bilinmeyen hata");
  }

  const inRoom = !!state;

  if (!inRoom) {
    return (
      <>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={["#1A0A3E", "#140830", "#0A0614"]}
              style={styles.heroBg}
            />

            <View style={styles.heroIcons}>
              <Pressable
                onPress={() => setStatsVisible(true)}
                hitSlop={12}
                style={[styles.iconBtn, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <Feather name="bar-chart-2" size={17} color={c.foreground} />
              </Pressable>
              <Pressable
                onPress={() => setSettingsVisible(true)}
                hitSlop={12}
                style={[styles.iconBtn, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <Feather name="settings" size={17} color={c.foreground} />
              </Pressable>
              <Pressable
                onPress={() => setHelpVisible(true)}
                hitSlop={12}
                style={[styles.iconBtn, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <Feather name="help-circle" size={17} color={c.foreground} />
              </Pressable>
            </View>

            <Animated.View
              style={[
                styles.hero,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.logoWrap}>
                <Image
                  source={require("../assets/images/logo.png")}
                  style={styles.logoImg}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["transparent", "transparent", "#0A0614"]}
                  style={[styles.logoFade, { pointerEvents: "none" }]}
                />
                <View style={[styles.logoGlow, { pointerEvents: "none" }]} />
              </View>

              <Text style={styles.brand}>DAVETSİZ MİSAFİR</Text>
              <View style={styles.divider} />
              <Text style={[styles.tag, { color: c.mutedForeground }]}>
                Davetsiz Misafir'i bul. Yoksa mahalle onların olur.
              </Text>
            </Animated.View>

            <Animated.View
              style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.label, { color: c.mutedForeground }]}>Adın</Text>
              {myNickname === null ? (
                <Animated.View
                  style={[
                    styles.input,
                    { borderColor: c.border, backgroundColor: c.input, opacity: reduceMotion === false ? skeletonOpacity : 0.4 },
                  ]}
                />
              ) : (
                <Animated.View style={{ opacity: inputFadeAnim }}>
                  <TextInput
                    value={myNickname}
                    onChangeText={setNickname}
                    placeholder="Ör: Selim Abi"
                    placeholderTextColor={c.mutedForeground}
                    maxLength={20}
                    style={[
                      styles.input,
                      { color: c.foreground, borderColor: c.border, backgroundColor: c.input },
                    ]}
                  />
                </Animated.View>
              )}

              <View style={styles.actionRow}>
                <Pressable
                  onPress={mode === "create" ? handleCreate : () => setMode("create")}
                  disabled={busy}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: mode === "create" ? c.primary : c.card,
                      borderColor: mode === "create" ? c.primary : c.border,
                      opacity: busy ? 0.6 : 1,
                    },
                  ]}
                >
                  <Feather
                    name="home"
                    size={16}
                    color={mode === "create" ? c.primaryForeground : c.foreground}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={{
                      color: mode === "create" ? c.primaryForeground : c.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Oda Kur
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setMode("join")}
                  disabled={busy}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: mode === "join" ? c.primary : c.card,
                      borderColor: mode === "join" ? c.primary : c.border,
                      opacity: busy ? 0.6 : 1,
                    },
                  ]}
                >
                  <Feather
                    name="users"
                    size={16}
                    color={mode === "join" ? c.primaryForeground : c.foreground}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={{
                      color: mode === "join" ? c.primaryForeground : c.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Odaya Katıl
                  </Text>
                </Pressable>
              </View>

              {mode === "join" ? (
                <>
                  <TextInput
                    value={code}
                    onChangeText={(t) => setCode(t.toUpperCase())}
                    placeholder="ODA KODU (ör. KAHVE47)"
                    placeholderTextColor={c.mutedForeground}
                    maxLength={10}
                    autoCapitalize="characters"
                    autoFocus
                    style={[
                      styles.input,
                      styles.codeInput,
                      { color: c.foreground, borderColor: c.border, backgroundColor: c.input },
                    ]}
                  />
                  <Btn label="Katıl" loading={busy} onPress={handleJoin} />
                </>
              ) : null}
            </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        <StatsScreen visible={statsVisible} onClose={() => setStatsVisible(false)} />
        <SettingsScreen visible={settingsVisible} onClose={() => setSettingsVisible(false)} />

        <Modal
          visible={helpVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setHelpVisible(false)}
        >
          <View style={[styles.helpModal, { backgroundColor: c.background }]}>
            <View style={[styles.helpHeader, { borderBottomColor: c.border }]}>
              <Text style={[styles.helpTitle, { color: c.foreground }]}>Nasıl Oynanır?</Text>
              <Pressable
                onPress={() => setHelpVisible(false)}
                hitSlop={12}
                style={{ padding: 4 }}
              >
                <Feather name="x" size={22} color={c.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
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
                text="Davetsiz Misafir geceleri saldırır. Gündüz mahalle suçluyu bulmaya çalışır."
              />
              <How
                c={c}
                icon="award"
                title="Kazanma koşulu"
                text="Tüm Davetsiz Misafirler idam edilirse mahalle kazanır. Çete sayıca eşitlenirse çete kazanır."
              />
            </ScrollView>
          </View>
        </Modal>
      </>
    );
  }

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
        <Text style={{ color: c.primary, fontFamily: "Inter_700Bold", fontSize: 30, letterSpacing: 8, marginTop: 6, fontVariant: ["tabular-nums"] }}>
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
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.isConnected ? "#1ECBE1" : "#4A2E7A" }} />
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: c.foreground }]}>Cihaz Ayarları</Text>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, gap: 0 }]}>
        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: c.mutedForeground, marginBottom: 0, flex: 1 }]}>Titreşim</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => { if (!vibrationsEnabled) toggleVibrations(); }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: vibrationsEnabled ? c.primary : c.background,
                borderWidth: 1,
                borderColor: vibrationsEnabled ? c.primary : c.border,
              }}
            >
              <Text style={{ color: vibrationsEnabled ? c.primaryForeground : c.foreground, fontFamily: "Inter_500Medium" }}>
                Açık
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { if (vibrationsEnabled) toggleVibrations(); }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: !vibrationsEnabled ? c.primary : c.background,
                borderWidth: 1,
                borderColor: !vibrationsEnabled ? c.primary : c.border,
              }}
            >
              <Text style={{ color: !vibrationsEnabled ? c.primaryForeground : c.foreground, fontFamily: "Inter_500Medium" }}>
                Kapalı
              </Text>
            </Pressable>
          </View>
        </View>
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
  const deepLink = `mahalle://join?code=${state.code}`;

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
      <View style={[styles.qrCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: 12 }}>
          OYUNCULAR QR İLE KATILABİLİR
        </Text>
        <View style={styles.qrWrap}>
          <QRCode
            value={deepLink}
            size={160}
            color="#E9B342"
            backgroundColor="transparent"
          />
        </View>
        <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 10 }}>
          {deepLink}
        </Text>
      </View>
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
  heroBg: { position: "absolute", left: 0, right: 0, top: 0, height: 480 },
  hero: { alignItems: "center", marginBottom: 4 },
  heroIcons: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#F5C84255",
  },
  logoImg: {
    width: "100%",
    height: "100%",
  },
  logoFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: LOGO_SIZE * 0.35,
  },
  logoGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: LOGO_SIZE / 2,
    borderWidth: 1,
    borderColor: "#F5C84233",
  },
  brand: {
    fontFamily: "Cinzel_900Black",
    fontSize: 28,
    letterSpacing: 5,
    color: "#F5C842",
    textAlign: "center",
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: "#F5C84244",
    borderRadius: 1,
    marginTop: 10,
    marginBottom: 6,
  },
  tag: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4, textAlign: "center", paddingHorizontal: 18 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  codeInput: { textAlign: "center", letterSpacing: 4, fontFamily: "Inter_700Bold" },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
  },
  codeCard: { padding: 18, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  qrCard: { padding: 18, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  qrWrap: { padding: 12, borderRadius: 12, backgroundColor: "#0B0F1F" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginTop: 6 },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  rowGap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  settingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  waitCard: { padding: 22, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  helpModal: { flex: 1 },
  helpHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  helpTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  howRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
});
