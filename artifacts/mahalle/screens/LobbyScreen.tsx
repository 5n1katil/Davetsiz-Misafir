import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { haptic } from "@/lib/haptics";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
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
import HowToPlayScreen from "@/screens/HowToPlayScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import StatsScreen from "@/screens/StatsScreen";

const SCREEN_W = Dimensions.get("window").width;
const LOGO_SIZE = Math.min(SCREEN_W * 0.60, 230);

// Home screen always uses dark noir palette regardless of system theme
const HOME_BG = "#070410";

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
  const [mode, setMode] = useState<"create" | "join">("create");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
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

  function showError(msg: string) {
    setErrorMsg(msg);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setErrorMsg(null), 4000);
  }

  async function handleCreate() {
    if (!(myNickname ?? "").trim()) {
      showError("Önce mahalleli adını girmelisin.");
      return;
    }
    setErrorMsg(null);
    setBusy(true);
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    const res = await createRoom((myNickname ?? "").trim());
    setBusy(false);
    if (!res.ok) showError(res.error ?? "Bilinmeyen hata");
  }

  async function handleJoin() {
    if (!(myNickname ?? "").trim()) {
      showError("Önce mahalleli adını girmelisin.");
      return;
    }
    if (code.trim().length < 3) {
      showError("Geçerli bir oda kodu gir.");
      return;
    }
    setErrorMsg(null);
    setBusy(true);
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    const res = await joinRoom(code.trim(), (myNickname ?? "").trim());
    setBusy(false);
    if (!res.ok) showError(res.error ?? "Oda bulunamadı. Kodu kontrol et.");
  }

  const inRoom = !!state;

  if (!inRoom) {
    return (
      <>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: HOME_BG }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 48 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: HOME_BG }}
          >
            {/* Hero wrapper: gradient + floating icons + logo */}
            <View style={styles.heroWrap}>
              {/* Full-screen atmospheric gradient */}
              <LinearGradient
                colors={["#1A0A3E", "#0D0525", HOME_BG]}
                style={styles.heroBg}
              />

              {/* Floating top-right icons — sit OVER the gradient */}
              <View style={[styles.heroIcons, { top: 6 }]}>
                <Pressable
                  onPress={() => setStatsVisible(true)}
                  hitSlop={12}
                  style={styles.iconBtn}
                >
                  <Feather name="bar-chart-2" size={17} color="#9B7FD4" />
                </Pressable>
                <Pressable
                  onPress={() => setHelpVisible(true)}
                  hitSlop={12}
                  style={styles.iconBtn}
                >
                  <Feather name="help-circle" size={17} color="#9B7FD4" />
                </Pressable>
              </View>

              {/* Hero section — logo + title + tagline */}
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
                    colors={["transparent", "transparent", HOME_BG]}
                    style={[styles.logoFade, { pointerEvents: "none" }]}
                  />
                  <View style={[styles.logoGlow, { pointerEvents: "none" }]} />
                </View>

                <Text style={styles.brand}>DAVETSİZ MİSAFİR</Text>
                <View style={styles.divider} />
                <Text style={styles.tag}>
                  Davetsiz Misafir'i bul. Yoksa mahalle onların olur.
                </Text>
              </Animated.View>
            </View>

            {/* Entry card */}
            <Animated.View
              style={[styles.entryCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              {/* Name label */}
              <Text style={styles.entryLabel}>ADIN</Text>

              {/* Name input */}
              {myNickname === null ? (
                <Animated.View
                  style={[
                    styles.entryInput,
                    { opacity: reduceMotion === false ? skeletonOpacity : 0.4 },
                  ]}
                />
              ) : (
                <Animated.View style={{ opacity: inputFadeAnim }}>
                  <TextInput
                    value={myNickname}
                    onChangeText={setNickname}
                    placeholder="Ör: Selim Abi"
                    placeholderTextColor="#4A3570"
                    maxLength={20}
                    style={styles.entryInput}
                  />
                </Animated.View>
              )}

              {/* Mode toggle + primary action */}
              <View style={styles.actionRow}>
                <Pressable
                  onPress={mode === "create" ? handleCreate : () => setMode("create")}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    mode === "create" ? styles.actionBtnPrimary : styles.actionBtnSecondary,
                    { opacity: busy || pressed ? 0.75 : 1 },
                  ]}
                >
                  <Feather
                    name="home"
                    size={17}
                    color={mode === "create" ? "#0A0614" : "#C3AEFF"}
                    style={{ marginBottom: 5 }}
                  />
                  <Text style={mode === "create" ? styles.actionBtnLabelPrimary : styles.actionBtnLabelSecondary}>
                    Oda Kur
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setMode("join")}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    mode === "join" ? styles.actionBtnPrimary : styles.actionBtnSecondary,
                    { opacity: busy || pressed ? 0.75 : 1 },
                  ]}
                >
                  <Feather
                    name="users"
                    size={17}
                    color={mode === "join" ? "#0A0614" : "#C3AEFF"}
                    style={{ marginBottom: 5 }}
                  />
                  <Text style={mode === "join" ? styles.actionBtnLabelPrimary : styles.actionBtnLabelSecondary}>
                    Odaya Katıl
                  </Text>
                </Pressable>
              </View>

              {/* Join mode: code input + button */}
              {mode === "join" ? (
                <>
                  <TextInput
                    value={code}
                    onChangeText={(t) => setCode(t.toUpperCase())}
                    placeholder="ODA KODU (ör. KAHVE47)"
                    placeholderTextColor="#4A3570"
                    maxLength={10}
                    autoCapitalize="characters"
                    autoFocus
                    style={[styles.entryInput, styles.codeInput]}
                  />
                  <Btn label="Katıl" loading={busy} onPress={handleJoin} />
                </>
              ) : null}

              {/* Inline error — works on web and native (replaces Alert.alert) */}
              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={13} color="#FF6B6B" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}
            </Animated.View>

            {/* Bottom tagline */}
            <Animated.View style={{ opacity: fadeAnim, alignItems: "center", marginTop: 8 }}>
              <Text style={styles.footer}>4–30 oyuncu • Yüz yüze • Türkçe anlatım</Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        <StatsScreen visible={statsVisible} onClose={() => setStatsVisible(false)} />
        <HowToPlayScreen visible={helpVisible} onClose={() => setHelpVisible(false)} />
      </>
    );
  }

  const isHost = state && myPlayerId === state.hostId;

  return (
    <>
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View testID="room-code" style={[styles.codeCard, { backgroundColor: c.card, borderColor: c.border }]}>
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
      <View testID="player-list" style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
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
              <View testID="host-badge" style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: c.primary, borderRadius: 6 }}>
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
      <Pressable
        onPress={() => setSettingsVisible(true)}
        style={[styles.card, { backgroundColor: c.card, borderColor: c.border, gap: 0 }]}
      >
        <View style={[styles.settingRow, { paddingVertical: 14 }]}>
          <Feather name="settings" size={18} color={c.primary} style={{ marginRight: 10 }} />
          <Text style={[styles.label, { color: c.foreground, marginBottom: 0, flex: 1 }]}>Ses ve Titreşim Ayarları</Text>
          <Feather name="chevron-right" size={18} color={c.mutedForeground} />
        </View>
      </Pressable>

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
    <SettingsScreen visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </>
  );
}

const SETTING_TIPS: Record<string, string> = {
  dayDuration:
    "Oyuncuların tartışıp birbirini suçladığı süre. 3 dk hızlı oyunlar için, 5 dk daha derin tartışmalar için.",
  ceteCount:
    "Mahallede kaç Davetsiz Misafir çete üyesi olsun. Az oyuncu → 1, çok oyuncu → 2-3. Yüksek sayı oyunu zorlaştırır.",
  specialRoles:
    "Bu roller oyun havuzuna girer; kapalıysa yerine sıradan Köylü gelir. Her rolün detayını 'Nasıl Oynanır?' bölümünde görebilirsin.",
  nightDuration:
    "Her rolün gece aksiyonunu tamamlaması için verilen süre. Kısa = hız, uzun = daha az baskı.",
  voteDuration:
    "Gündüz linç oylamasının süresi. Kısa = baskı altında karar, uzun = daha fazla düşünme zamanı.",
  rolePackage:
    "Standart: 3 temel mahalle rolü — yeni oyuncular için ideal. Gelişmiş: +4 rol +2 kaos. Tümü: tam 19 rol, deneyimliler için.",
};

function HostSettings({ c, state, emit }: any) {
  const deepLink = `mahalle://join?code=${state.code}`;
  const [openTip, setOpenTip] = useState<string | null>(null);

  function toggleTip(id: string) {
    setOpenTip((prev) => (prev === id ? null : id));
  }

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
    const next = list.includes(id) ? list.filter((x: string) => x !== id) : [...list, id];
    emit("updateSettings", { patch: { activeSpecialRoles: next } });
  };

  const connectedCount: number = state.players.filter((p: any) => p.isConnected).length;
  const canStart: boolean = connectedCount >= 4;

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
          <Pressable style={styles.labelRow} onPress={() => toggleTip("dayDuration")} hitSlop={8}>
            <Text style={[styles.label, { color: c.mutedForeground }]}>Gündüz süresi</Text>
            <Feather name="info" size={13} color={openTip === "dayDuration" ? "#9B7FD4" : c.mutedForeground} />
          </Pressable>
          {openTip === "dayDuration" && (
            <Text style={styles.tipText}>{SETTING_TIPS.dayDuration}</Text>
          )}
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
          <Pressable style={styles.labelRow} onPress={() => toggleTip("ceteCount")} hitSlop={8}>
            <Text style={[styles.label, { color: c.mutedForeground }]}>Çete sayısı</Text>
            <Feather name="info" size={13} color={openTip === "ceteCount" ? "#9B7FD4" : c.mutedForeground} />
          </Pressable>
          {openTip === "ceteCount" && (
            <Text style={styles.tipText}>{SETTING_TIPS.ceteCount}</Text>
          )}
          <View style={styles.rowGap}>
            {[1, 2, 3].map((n) =>
              opt(`${n}`, state.settings.ceteCount === n, () =>
                emit("updateSettings", { patch: { ceteCount: n } }),
              ),
            )}
          </View>
        </View>
        <View>
          <Pressable style={styles.labelRow} onPress={() => toggleTip("specialRoles")} hitSlop={8}>
            <Text style={[styles.label, { color: c.mutedForeground }]}>Aktif özel roller</Text>
            <Feather name="info" size={13} color={openTip === "specialRoles" ? "#9B7FD4" : c.mutedForeground} />
          </Pressable>
          {openTip === "specialRoles" && (
            <Text style={styles.tipText}>{SETTING_TIPS.specialRoles}</Text>
          )}
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
          <Pressable style={styles.labelRow} onPress={() => toggleTip("nightDuration")} hitSlop={8}>
            <Text style={[styles.label, { color: c.mutedForeground }]}>Gece aksiyon süresi</Text>
            <Feather name="info" size={13} color={openTip === "nightDuration" ? "#9B7FD4" : c.mutedForeground} />
          </Pressable>
          {openTip === "nightDuration" && (
            <Text style={styles.tipText}>{SETTING_TIPS.nightDuration}</Text>
          )}
          <View style={styles.rowGap}>
            {opt("10 sn", state.settings.nightActionDurationSec === 10, () =>
              emit("updateSettings", { patch: { nightActionDurationSec: 10 } }),
            )}
            {opt("15 sn", state.settings.nightActionDurationSec === 15, () =>
              emit("updateSettings", { patch: { nightActionDurationSec: 15 } }),
            )}
          </View>
        </View>
        <View>
          <Pressable style={styles.labelRow} onPress={() => toggleTip("voteDuration")} hitSlop={8}>
            <Text style={[styles.label, { color: c.mutedForeground }]}>Oylama süresi</Text>
            <Feather name="info" size={13} color={openTip === "voteDuration" ? "#9B7FD4" : c.mutedForeground} />
          </Pressable>
          {openTip === "voteDuration" && (
            <Text style={styles.tipText}>{SETTING_TIPS.voteDuration}</Text>
          )}
          <View style={styles.rowGap}>
            {opt("30 sn", (state.settings.voteDurationSec ?? 30) === 30, () =>
              emit("updateSettings", { patch: { voteDurationSec: 30 } }),
            )}
            {opt("45 sn", (state.settings.voteDurationSec ?? 30) === 45, () =>
              emit("updateSettings", { patch: { voteDurationSec: 45 } }),
            )}
            {opt("60 sn", (state.settings.voteDurationSec ?? 30) === 60, () =>
              emit("updateSettings", { patch: { voteDurationSec: 60 } }),
            )}
          </View>
        </View>
        <View>
          <Pressable style={styles.labelRow} onPress={() => toggleTip("rolePackage")} hitSlop={8}>
            <Text style={[styles.label, { color: c.mutedForeground }]}>Rol paketi</Text>
            <Feather name="info" size={13} color={openTip === "rolePackage" ? "#9B7FD4" : c.mutedForeground} />
          </Pressable>
          {openTip === "rolePackage" && (
            <Text style={styles.tipText}>{SETTING_TIPS.rolePackage}</Text>
          )}
          <View style={styles.rowGap}>
            {opt("Standart", (state.settings.rolePackage ?? "all") === "standard", () =>
              emit("updateSettings", { patch: { rolePackage: "standard" } }),
            )}
            {opt("Gelişmiş", (state.settings.rolePackage ?? "all") === "advanced", () =>
              emit("updateSettings", { patch: { rolePackage: "advanced" } }),
            )}
            {opt("Tümü", (state.settings.rolePackage ?? "all") === "all", () =>
              emit("updateSettings", { patch: { rolePackage: "all" } }),
            )}
          </View>
          <Text style={styles.packageDesc}>
            {(state.settings.rolePackage ?? "all") === "standard"
              ? "Bekçi, Şifacı, Kapıcı — Yeni oyuncular için ideal."
              : (state.settings.rolePackage ?? "all") === "advanced"
              ? "Tüm mahalle rolleri + Kırık Kalp, Dedikoducu."
              : "Kumarbaz, Anonim, Kahraman Dede dahil tam 19 rol. Kaotik!"}
          </Text>
        </View>
      </View>
      <Btn
        label={canStart
          ? "Oyunu Başlat"
          : `Başlamak için ${4 - connectedCount} kişi daha`}
        disabled={!canStart}
        onPress={() => emit("startGame")}
        style={{ marginTop: 18 }}
      />
    </>
  );
}


const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, gap: 12 },
  // heroWrap: relative container so absolute-positioned icons stay inside it
  heroWrap: {
    position: "relative",
    alignItems: "center",
    marginBottom: 4,
  },
  heroBg: { position: "absolute", left: -18, right: -18, top: -4, height: 460 },
  hero: { alignItems: "center", paddingTop: 10 },
  heroIcons: {
    position: "absolute",
    right: 0,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  iconBtn: {
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "rgba(26,10,62,0.6)",
    borderColor: "#2A1060",
  },
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#F5C84255",
  },
  logoImg: { width: "100%", height: "100%" },
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
    fontSize: 26,
    letterSpacing: 5,
    color: "#F5C842",
    textAlign: "center",
  },
  divider: {
    width: 50,
    height: 2,
    backgroundColor: "#F5C84244",
    borderRadius: 1,
    marginTop: 8,
    marginBottom: 6,
  },
  tag: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 6,
    textAlign: "center",
    paddingHorizontal: 18,
    color: "#7A63B0",
  },

  // ── Home entry card (always dark, not using c.card) ────────────────────────
  entryCard: {
    backgroundColor: "#0F0628",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A1060",
    padding: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  entryLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 1.5,
    color: "#6B4FA8",
    textTransform: "uppercase",
  },
  entryInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A1060",
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: "#E8DEFF",
    backgroundColor: "#160535",
  },
  codeInput: {
    textAlign: "center",
    letterSpacing: 5,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#F5C842",
  },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
  },
  actionBtnPrimary: {
    backgroundColor: "#F5C842",
    borderColor: "#F5C842",
  },
  actionBtnSecondary: {
    backgroundColor: "#160535",
    borderColor: "#2A1060",
  },
  actionBtnLabelPrimary: {
    color: "#0A0614",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  actionBtnLabelSecondary: {
    color: "#C3AEFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  footer: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#3A2560",
    letterSpacing: 0.5,
  },

  // ── In-room / lobby (uses c.* theme tokens) ────────────────────────────────
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  packageDesc: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#4A2E7A", fontStyle: "italic", marginTop: 4 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
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
  // ── Error message (replaces Alert.alert on web) ─────────────────────────────
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FF6B6B18",
    borderWidth: 1,
    borderColor: "#FF6B6B55",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#FF6B6B",
    flex: 1,
  },
  // ── Setting tooltip ──────────────────────────────────────────────────────────
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#9B7FD4",
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
});
