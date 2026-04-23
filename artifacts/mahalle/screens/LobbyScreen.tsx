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
import { toUpperTR } from "@/lib/utils";
import { useColors } from "@/hooks/useColors";
import HowToPlayScreen from "@/screens/HowToPlayScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import StatsScreen from "@/screens/StatsScreen";

const SCREEN_W = Dimensions.get("window").width;
const LOGO_SIZE = Math.min(SCREEN_W * 0.64, 248);

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
    toggleVibrations,
    vibrationsEnabled,
  } = useGame();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showQR, setShowQR] = useState(false);

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
        <View style={{ flex: 1, backgroundColor: HOME_BG }}>
          {/* ── TOP BAR — ayrı panel, atmosferik arka plandan bağımsız ── */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => setStatsVisible(true)} hitSlop={12} style={styles.topBarBtn} accessibilityLabel="İstatistikler">
              <Feather name="bar-chart-2" size={18} color="#9B7FD4" />
            </Pressable>
            <Pressable onPress={() => setHelpVisible(true)} hitSlop={12} style={styles.topBarBtn} accessibilityLabel="Nasıl oynanır">
              <Feather name="help-circle" size={18} color="#9B7FD4" />
            </Pressable>
            <Pressable onPress={() => setSettingsVisible(true)} hitSlop={12} style={styles.topBarBtn} accessibilityLabel="Ayarlar">
              <Feather name="settings" size={18} color="#9B7FD4" />
            </Pressable>
          </View>

          {/* ── İÇERİK — klavye aware, dikey ortalanmış ── */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              contentContainerStyle={[styles.homeScroll, { paddingBottom: insets.bottom + 32 }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {/* Hero: logo + başlık + etiket */}
              <Animated.View
                style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
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
                    returnKeyType="done"
                    blurOnSubmit
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
                    placeholder="ör. KAHVE47"
                    placeholderTextColor="#4A3570"
                    maxLength={10}
                    autoCapitalize="characters"
                    returnKeyType="go"
                    onSubmitEditing={handleJoin}
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
        </View>

        <StatsScreen visible={statsVisible} onClose={() => setStatsVisible(false)} />
        <HowToPlayScreen visible={helpVisible} onClose={() => setHelpVisible(false)} />
        <SettingsScreen visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      </>
    );
  }

  const isHost = !!(state && myPlayerId === state.hostId);
  const connectedCount = state ? state.players.filter((p: any) => p.isConnected).length : 0;
  const canStart = connectedCount >= 4;

  return (
    <>
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── SECTION 1: Oda Kodu ── */}
      <View style={styles.inSection}>
        <Text style={styles.inSectionLabel}>ODA KODU</Text>
        <Text testID="room-code" style={styles.inCodeText}>{state.code}</Text>
        <Text style={styles.inCodeHint}>Bu kodu arkadaşlarına söyle veya QR kodu tarat</Text>
        <Pressable style={styles.qrToggleBtn} onPress={() => setShowQR((v) => !v)}>
          <Text style={styles.qrToggleText}>{showQR ? "▲ QR Kodu Gizle" : "▼ QR Kodu Göster"}</Text>
        </Pressable>
        {showQR && (
          <View style={styles.qrWrapper}>
            <QRCode
              value={`mahalle://join?code=${state.code}`}
              size={160}
              backgroundColor="#1A0A3E"
              color="#F5C842"
            />
          </View>
        )}
      </View>

      {/* ── SECTION 2: Oyuncu Listesi ── */}
      <View style={styles.inSection}>
        <View style={styles.inSectionHeaderRow}>
          <Text style={styles.inSectionHeading}>Mahalleli</Text>
          <Text style={styles.inPlayerCount}>
            {connectedCount}/30
            {connectedCount < 4 && (
              <Text style={styles.inPlayerCountWarn}> — en az 4 kişi</Text>
            )}
          </Text>
        </View>
        {state.players.map((p: any) => (
          <View key={p.id} testID="player-list" style={styles.inPlayerRow}>
            <View style={[styles.inAvatar, p.isHost && styles.inAvatarHost]}>
              <Text style={styles.inAvatarText}>{toUpperTR(p.nickname[0] ?? "")}</Text>
            </View>
            <Text style={styles.inPlayerName}>
              {p.nickname}
              {p.id === myPlayerId && <Text style={styles.inYouLabel}> • sen</Text>}
            </Text>
            <View style={styles.inPlayerMeta}>
              {p.isHost && (
                <View testID="host-badge" style={styles.inHostBadge}>
                  <Text style={styles.inHostBadgeText}>HOST</Text>
                </View>
              )}
              <View style={[styles.inConnDot, p.isConnected ? styles.inConnDotGreen : styles.inConnDotGray]} />
              {isHost && p.id !== myPlayerId && (
                <Pressable onPress={() => emit("kickPlayer", { targetId: p.id })} hitSlop={8}>
                  <Text style={styles.inKickBtn}>✕</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* ── SECTION 3: Oyun Ayarları ── */}
      {isHost ? (
        <HostSettings state={state} emit={emit} />
      ) : (
        <View style={styles.inGuestNote}>
          <Text style={styles.inGuestNoteText}>⚙️ Oyun ayarlarını yalnızca host görebilir</Text>
        </View>
      )}

      {/* ── FOOTER ── */}
      {isHost ? (
        <Pressable
          style={[styles.inStartBtn, !canStart && styles.inStartBtnDisabled]}
          disabled={!canStart}
          onPress={() => { haptic(Haptics.ImpactFeedbackStyle.Medium); emit("startGame"); }}
        >
          <Text style={styles.inStartBtnText}>
            {canStart ? "🚀 Oyunu Başlat" : `Başlamak için ${Math.max(0, 4 - connectedCount)} kişi daha`}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.inWaitingBox}>
          <Text style={styles.inWaitingText}>⏳ Host oyunu başlatmasını bekliyorsunuz...</Text>
        </View>
      )}
    </ScrollView>
    <SettingsScreen visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </>
  );
}

// ── Rol Grupları ─────────────────────────────────────────────────────────────
const MAHALLE_SPECIAL_ROLES = [
  { id: "muhtar", name: "Muhtar", emoji: "🎖️" },
  { id: "bekci", name: "Bekçi", emoji: "🔦" },
  { id: "otaci", name: "Şifacı Teyze", emoji: "🌿" },
  { id: "falci", name: "Falcı", emoji: "🔮" },
  { id: "kapici", name: "Kapıcı", emoji: "🧹" },
  { id: "muhabir", name: "Muhabir", emoji: "📰" },
  { id: "tiyatrocu", name: "Tiyatrocu", emoji: "🎭" },
  { id: "hoca", name: "Hoca", emoji: "📿" },
];
const CETE_OPTIONAL_ROLES = [
  { id: "sahte_dernek", name: "Politikacı", emoji: "😇" },
  { id: "icten_pazarlikli", name: "İçten Pazarlıklı", emoji: "🐍" },
];
const KAOS_ROLES = [
  { id: "kumarbaz", name: "Kumarbaz", emoji: "🎰" },
  { id: "kiskanc_komsu", name: "Kıskanç Komşu", emoji: "🧂" },
  { id: "kirik_kalp", name: "Kırık Kalp", emoji: "💔" },
  { id: "dedikoducu", name: "Dedikoducu", emoji: "🗣️" },
];
const TARAFSIZ_ROLES = [
  { id: "anonim", name: "Anonim", emoji: "🎭" },
  { id: "kahraman_dede", name: "Kahraman Dede", emoji: "🪬" },
];

// Paket içerikleri — paket değişince disabledRoles otomatik hesaplanır
const PACKAGE_ROLES = {
  standard: {
    mahalle: ["bekci", "otaci", "kapici"],
    cete: [] as string[],
    kaos: [] as string[],
    tarafsiz: [] as string[],
  },
  advanced: {
    mahalle: ["bekci", "otaci", "kapici", "falci", "muhtar", "muhabir", "hoca"],
    cete: ["sahte_dernek", "icten_pazarlikli"],
    kaos: ["kirik_kalp", "dedikoducu"],
    tarafsiz: [] as string[],
  },
  all: {
    mahalle: ["bekci", "otaci", "kapici", "falci", "muhtar", "muhabir", "hoca", "tiyatrocu"],
    cete: ["sahte_dernek", "icten_pazarlikli"],
    kaos: ["kumarbaz", "kiskanc_komsu", "kirik_kalp", "dedikoducu"],
    tarafsiz: ["anonim", "kahraman_dede"],
  },
} as const;

const ALL_SPECIAL_ROLE_IDS = [
  ...PACKAGE_ROLES.all.mahalle,
  ...PACKAGE_ROLES.all.cete,
  ...PACKAGE_ROLES.all.kaos,
  ...PACKAGE_ROLES.all.tarafsiz,
];

const ROLE_LOOKUP: Record<string, { id: string; name: string; emoji: string }> =
  Object.fromEntries(
    [...MAHALLE_SPECIAL_ROLES, ...CETE_OPTIONAL_ROLES, ...KAOS_ROLES, ...TARAFSIZ_ROLES].map(
      (r) => [r.id, r]
    )
  );

// ── SettingRow — yeniden kullanılabilir ayar satırı ───────────────────────────
function SettingRow({
  label,
  tooltip,
  options,
  labels,
  value,
  unit,
  onChange,
}: {
  label: string;
  tooltip: string;
  options: (string | number)[];
  labels?: string[];
  value: string | number;
  unit?: string;
  onChange: (v: string | number) => void;
}) {
  const [showTip, setShowTip] = useState(false);
  return (
    <View style={styles.srRow}>
      <View style={styles.srLabelRow}>
        <Text style={styles.srLabel}>{label}</Text>
        <Pressable style={styles.srTipBtn} onPress={() => setShowTip((v) => !v)} hitSlop={8}>
          <Text style={styles.srTipBtnText}>?</Text>
        </Pressable>
      </View>
      {showTip && (
        <View style={styles.srTipBox}>
          <Text style={styles.srTipText}>{tooltip}</Text>
        </View>
      )}
      <View style={styles.srOptionRow}>
        {options.map((opt, i) => (
          <Pressable
            key={String(opt)}
            style={[styles.srOptionBtn, value === opt && styles.srOptionBtnActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.srOptionBtnText, value === opt && styles.srOptionBtnTextActive]}>
              {labels?.[i] ?? `${opt}${unit ?? ""}`}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ── RoleToggle — rol açma/kapama butonu ───────────────────────────────────────
function RoleToggle({
  role,
  active,
  onToggle,
}: {
  role: { id: string; name: string; emoji: string };
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={[styles.rtToggle, active ? styles.rtToggleOn : styles.rtToggleOff]}
      onPress={onToggle}
    >
      <Text style={styles.rtEmoji}>{role.emoji}</Text>
      <Text style={[styles.rtName, !active && styles.rtNameOff]}>{role.name}</Text>
      <Text style={styles.rtStatus}>{active ? "✓" : "○"}</Text>
    </Pressable>
  );
}

// ── HostSettings — accordion ayarlar paneli ───────────────────────────────────
function HostSettings({ state, emit }: any) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showRoleTip, setShowRoleTip] = useState(false);
  const [showRoleToggleTip, setShowRoleToggleTip] = useState(false);
  const [rolesAccordionOpen, setRolesAccordionOpen] = useState(false);

  const settings = state.settings;
  const disabledRoles: string[] = settings.disabledRoles ?? [];
  const pkg: "standard" | "advanced" | "all" = settings.rolePackage ?? "all";

  const update = (key: string, value: unknown) =>
    emit("updateSettings", { patch: { [key]: value } });

  const toggleRole = (id: string) => {
    const next = disabledRoles.includes(id)
      ? disabledRoles.filter((r: string) => r !== id)
      : [...disabledRoles, id];
    update("disabledRoles", next);
  };

  const handlePackageChange = (newPkg: "standard" | "advanced" | "all") => {
    const allowed = PACKAGE_ROLES[newPkg];
    const allAllowed = [
      ...allowed.mahalle,
      ...allowed.cete,
      ...allowed.kaos,
      ...allowed.tarafsiz,
    ];
    const newDisabled = ALL_SPECIAL_ROLE_IDS.filter((id) => !allAllowed.includes(id));
    emit("updateSettings", { patch: { rolePackage: newPkg, disabledRoles: newDisabled } });
  };

  const pkgInfo = {
    standard: { label: "Standart", desc: "Bekçi, Şifacı, Kapıcı — Yeni oyuncular için ideal.", tag: "YENİ OYUNCULAR" },
    advanced: { label: "Gelişmiş", desc: "Tüm mahalle rolleri + Kırık Kalp, Dedikoducu.", tag: "ÖNERİLEN" },
    all: { label: "Tümü", desc: "Kumarbaz, Anonim, Kahraman Dede dahil 19 rol.", tag: "KAOTİK" },
  };

  return (
    <View style={styles.inSection}>
      <Pressable
        style={styles.hsHeader}
        onPress={() => setSettingsOpen((v) => !v)}
      >
        <Text style={styles.inSectionHeading}>⚙️ {toUpperTR("oyun ayarları")}</Text>
        <Text style={styles.hsChevron}>{settingsOpen ? "▲" : "▼"}</Text>
      </Pressable>

      {settingsOpen && (
        <View style={styles.hsBody}>
          {/* Zamanlama ayarları */}
          <SettingRow
            label="Gündüz Süresi"
            tooltip="Her turda tartışma için ne kadar süren olsun? 3 dk hızlı oyunlar için, 5 dk daha sakin tartışmalar için idealdir."
            options={[180, 300]}
            labels={["3 dakika", "5 dakika"]}
            value={settings.dayDurationSec}
            onChange={(v) => update("dayDurationSec", v)}
          />

          <SettingRow
            label="Oylama Süresi"
            tooltip="Linç oylaması için her oyuncunun ne kadar süresi var? Süre dolunca oy kullanmayanlar sayılmaz."
            options={[30, 45, 60]}
            unit="sn"
            value={settings.voteDurationSec ?? 30}
            onChange={(v) => update("voteDurationSec", v)}
          />

          <SettingRow
            label="Gece Aksiyon Süresi"
            tooltip="Her rolün gece eylemini seçmesi için verilen süre. Az süre oyunu hızlandırır ama düşünme fırsatı azalır."
            options={[10, 12, 15, 20]}
            unit="sn"
            value={settings.nightActionDurationSec ?? 12}
            onChange={(v) => update("nightActionDurationSec", v)}
          />

          <SettingRow
            label="Sesli Yönlendirme"
            tooltip="Host'un telefonu hoparlörle gece aksiyonlarını sesli okur. Aynı odadaki herkes duyar. Kapatırsan yalnızca ekran animasyonu olur."
            options={["on", "off"]}
            labels={["Açık", "Kapalı"]}
            value={settings.voiceEnabled !== false ? "on" : "off"}
            onChange={(v) => update("voiceEnabled", v === "on")}
          />

          <SettingRow
            label="Rol Seçiminde İsimler"
            tooltip="Gizli: oyuncular sırayla sadece numara görür, kim hangi rolü aldı belli olmaz. Görünür: herkes adını görür."
            options={["hidden", "visible"]}
            labels={["Gizli", "Görünür"]}
            value={settings.roleSelectShowNames ?? "hidden"}
            onChange={(v) => update("roleSelectShowNames", v)}
          />

          <View style={styles.hsDivider} />

          {/* Rol Dağıtım Modu */}
          <SettingRow
            label="Rol Dağıtım Modu"
            tooltip="Rastgele: Herkes oyun başında otomatik rol alır, seçim ekranı açılmaz. Sıralı Seçim: Oyuncular sırayla 3 kart arasından kendi rolünü seçer, kim seçtiği gizli kalır."
            options={["random", "pick"]}
            labels={["Rastgele Dağıt", "Sıralı Seçim"]}
            value={settings.roleDistribution ?? "pick"}
            onChange={(v) => update("roleDistribution", v)}
          />
          <View style={styles.distributionInfoCard}>
            {(settings.roleDistribution ?? "pick") === "random" ? (
              <>
                <Text style={styles.distributionInfoIcon}>🎲</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.distributionInfoTitle}>Rastgele Dağıtım</Text>
                  <Text style={styles.distributionInfoDesc}>
                    Oyun başlar başlamaz herkes rolünü anında öğrenir. Hızlı oyunlar için ideal.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.distributionInfoIcon}>🎴</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.distributionInfoTitle}>Sıralı Seçim</Text>
                  <Text style={styles.distributionInfoDesc}>
                    Oyuncular sırayla 3 kart arasından seçim yapar. Kim seçiyor, gizli kalır.
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.hsDivider} />

          {/* Rol Paketi — kart tasarımı */}
          <View style={styles.srRow}>
            <View style={styles.srLabelRow}>
              <Text style={styles.srLabel}>{toUpperTR("rol paketi")}</Text>
              <Pressable style={styles.srTipBtn} onPress={() => setShowRoleTip((v) => !v)} hitSlop={8}>
                <Text style={styles.srTipBtnText}>?</Text>
              </Pressable>
            </View>
            {showRoleTip && (
              <View style={styles.srTipBox}>
                <Text style={styles.srTipText}>
                  Oyunda hangi roller havuzuna dahil olsun? Paketi seçince roller otomatik ayarlanır. İstersen aşağıdan tek tek özelleştirebilirsin.
                </Text>
              </View>
            )}
            {(["standard", "advanced", "all"] as const).map((p) => {
              const isActive = pkg === p;
              const info = pkgInfo[p];
              return (
                <Pressable
                  key={p}
                  style={[styles.packageCard, isActive && styles.packageCardActive]}
                  onPress={() => handlePackageChange(p)}
                >
                  <View style={styles.packageCardLeft}>
                    <View style={styles.packageCardRadio}>
                      {isActive && <View style={styles.packageCardRadioDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.packageCardLabel, isActive && styles.packageCardLabelActive]}>
                        {info.label}
                      </Text>
                      <Text style={styles.packageCardDesc}>{info.desc}</Text>
                    </View>
                  </View>
                  <View style={[styles.packageCardTag, isActive && styles.packageCardTagActive]}>
                    <Text style={[styles.packageCardTagText, isActive && styles.packageCardTagTextActive]}>
                      {info.tag}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.hsDivider} />

          {/* Aktif Özel Roller — accordion */}
          <View style={styles.srRow}>
            <Pressable
              style={styles.accordionHeader}
              onPress={() => setRolesAccordionOpen((v) => !v)}
            >
              <View style={styles.srLabelRow}>
                <Text style={styles.srLabel}>{toUpperTR("aktif özel roller")}</Text>
                <Pressable style={styles.srTipBtn} onPress={() => setShowRoleToggleTip((v) => !v)} hitSlop={8}>
                  <Text style={styles.srTipBtnText}>?</Text>
                </Pressable>
              </View>
              <Text style={styles.accordionChevron}>{rolesAccordionOpen ? "▲" : "▼"}</Text>
            </Pressable>
            {showRoleToggleTip && (
              <View style={styles.srTipBox}>
                <Text style={styles.srTipText}>
                  Seçili paketteki rolleri tek tek açıp kapatabilirsin. Kapatılan roller hiç kimseye atanmaz.
                </Text>
              </View>
            )}

            {rolesAccordionOpen && (
              <View style={styles.accordionBody}>
                {[
                  { group: "mahalle" as const, label: "Mahalle", color: "#F5C842", dot: "🟡" },
                  { group: "cete" as const, label: "Çete", color: "#C8102E", dot: "🔴" },
                  { group: "kaos" as const, label: "Kargaşacılar", color: "#1ECBE1", dot: "🩵" },
                  { group: "tarafsiz" as const, label: "Yalnız Kurtlar", color: "#9B7FD4", dot: "🟣" },
                ].map(({ group, label, color, dot }) => {
                  const groupRoles = PACKAGE_ROLES[pkg][group];
                  if (groupRoles.length === 0) return null;
                  return (
                    <View key={group} style={styles.roleGroup}>
                      <Text style={[styles.roleGroupLabel, { color }]}>{dot} {label}</Text>
                      <View style={styles.roleToggleGrid}>
                        {groupRoles.map((roleId) => {
                          const roleDef = ROLE_LOOKUP[roleId];
                          if (!roleDef) return null;
                          const isEnabled = !disabledRoles.includes(roleId);
                          return (
                            <Pressable
                              key={roleId}
                              style={[
                                styles.roleToggleChip,
                                isEnabled
                                  ? { borderColor: color, backgroundColor: color + "15" }
                                  : styles.roleToggleChipOff,
                              ]}
                              onPress={() => toggleRole(roleId)}
                            >
                              <Text style={styles.roleToggleEmoji}>{roleDef.emoji}</Text>
                              <Text style={[styles.roleToggleName, !isEnabled && styles.roleToggleNameOff]}>
                                {roleDef.name}
                              </Text>
                              <Text style={[styles.roleToggleCheck, { color: isEnabled ? color : "#4A2E7A" }]}>
                                {isEnabled ? "✓" : "○"}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, gap: 12 },

  // ── Ana ekran üst bar ────────────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: HOME_BG,
    gap: 8,
  },
  topBarBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#2A1060",
    backgroundColor: "#0E0228",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },

  // ── Ana ekran scrollview içeriği — dikey ortalanmış ─────────────────────────
  homeScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    gap: 14,
    paddingTop: 8,
  },

  // ── Legacy (heroWrap kullanılmıyor artık ama diğer kod referans edebilir) ────
  heroWrap: {
    position: "relative",
    alignItems: "center",
    marginBottom: 4,
  },
  heroBg: { position: "absolute", left: -18, right: -18, top: -4, height: 460 },
  heroTopGlow: {
    position: "absolute",
    left: -18,
    right: -18,
    top: -24,
    height: 200,
  },
  hero: { alignItems: "center", paddingTop: 8 },
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
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 2,
    borderColor: "#F5C84288",
    shadowColor: "#F5C842",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImg: { width: "100%", height: "100%" },
  logoFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: LOGO_SIZE * 0.28,
  },
  logoGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F5C84244",
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
    letterSpacing: 4,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
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

  // ── Legacy (kept for home screen error UI) ──────────────────────────────────
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
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },

  // ── In-room sections ──────────────────────────────────────────────────────────
  inSection: {
    backgroundColor: "#1A0A3E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A1060",
    padding: 16,
    marginBottom: 8,
  },
  inSectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#9B7FD4",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  inCodeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    letterSpacing: 10,
    color: "#F5C842",
    marginTop: 4,
    marginBottom: 4,
  },
  inCodeHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#9B7FD4",
    marginBottom: 10,
  },
  qrToggleBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3B1F8C",
    backgroundColor: "#0A0614",
    marginBottom: 4,
  },
  qrToggleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#9B7FD4",
  },
  qrWrapper: { alignItems: "center", marginTop: 12 },

  // Player list
  inSectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inSectionHeading: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 1.5,
    color: "#9B7FD4",
    textTransform: "uppercase",
  },
  inPlayerCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#9B7FD4",
  },
  inPlayerCountWarn: {
    color: "#F5A842",
  },
  inPlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2A1060",
  },
  inAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2A1060",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3B1F8C",
  },
  inAvatarHost: {
    borderColor: "#F5C842",
    backgroundColor: "#3B1F18",
  },
  inAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#E8DEFF",
  },
  inPlayerName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#E8DEFF",
    flex: 1,
  },
  inYouLabel: {
    color: "#9B7FD4",
    fontFamily: "Inter_400Regular",
  },
  inPlayerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inHostBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: "#F5C842",
    borderRadius: 5,
  },
  inHostBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#0A0614",
    letterSpacing: 0.5,
  },
  inConnDot: { width: 8, height: 8, borderRadius: 4 },
  inConnDotGreen: { backgroundColor: "#1ECBE1" },
  inConnDotGray: { backgroundColor: "#3B1F8C" },
  inKickBtn: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#C8102E",
    paddingHorizontal: 4,
  },

  // Guest note
  inGuestNote: {
    backgroundColor: "#1A0A3E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A1060",
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  inGuestNoteText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#4A2E7A",
  },

  // Start / wait footer
  inStartBtn: {
    backgroundColor: "#F5C842",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  inStartBtnDisabled: {
    backgroundColor: "#2A1060",
    borderWidth: 1,
    borderColor: "#3B1F8C",
  },
  inStartBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#0A0614",
    letterSpacing: 1,
  },
  inWaitingBox: {
    backgroundColor: "#1A0A3E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A1060",
    padding: 18,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  inWaitingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#9B7FD4",
  },

  // ── HostSettings accordion ──────────────────────────────────────────────────
  hsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hsChevron: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#9B7FD4",
  },
  hsBody: { marginTop: 16, gap: 16 },
  hsDivider: {
    height: 1,
    backgroundColor: "#2A1060",
    marginVertical: 4,
  },
  hsRolePkgBtn: {
    borderWidth: 1,
    borderColor: "#3B1F8C",
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    backgroundColor: "#0A0614",
  },
  hsRolePkgBtnActive: {
    borderColor: "#F5C842",
    backgroundColor: "#2A1060",
  },
  hsRolePkgBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#9B7FD4",
  },
  hsRolePkgBtnTextActive: { color: "#F5C842" },
  hsRolePkgDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#4A2E7A",
    marginTop: 3,
    fontStyle: "italic",
  },
  hsRoleGroupLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#9B7FD4",
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  hsRoleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  // ── SettingRow ──────────────────────────────────────────────────────────────
  srRow: { gap: 4 },
  srLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  srLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#E8DEFF",
  },
  srTipBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4A2E7A",
    alignItems: "center",
    justifyContent: "center",
  },
  srTipBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#9B7FD4",
  },
  srTipBox: {
    backgroundColor: "#2A1060",
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#F5C842",
  },
  srTipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#9B7FD4",
    lineHeight: 18,
  },
  srOptionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  srOptionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3B1F8C",
    backgroundColor: "#0A0614",
  },
  srOptionBtnActive: {
    backgroundColor: "#F5C842",
    borderColor: "#F5C842",
  },
  srOptionBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#9B7FD4",
  },
  srOptionBtnTextActive: {
    color: "#0A0614",
    fontFamily: "Inter_700Bold",
  },

  // ── RoleToggle (legacy — kept for compatibility) ─────────────────────────────
  rtToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
  },
  rtToggleOn: {
    backgroundColor: "#1A0A3E",
    borderColor: "#F5C842",
  },
  rtToggleOff: {
    backgroundColor: "#0A0614",
    borderColor: "#2A1060",
    opacity: 0.5,
  },
  rtEmoji: { fontSize: 14 },
  rtName: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#E8DEFF",
  },
  rtNameOff: { color: "#4A2E7A" },
  rtStatus: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#F5C842",
    marginLeft: 2,
  },

  // ── Rol Dağıtım Modu bilgi kartı ────────────────────────────────────────────
  distributionInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#1A0A3E",
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#F5C842",
    marginTop: 8,
  },
  distributionInfoIcon: { fontSize: 24 },
  distributionInfoTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#E8DEFF",
    marginBottom: 2,
  },
  distributionInfoDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#9B7FD4",
    lineHeight: 16,
  },

  // ── Paket kartları ──────────────────────────────────────────────────────────
  packageCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A0A3E",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A1060",
    padding: 14,
    marginBottom: 8,
  },
  packageCardActive: {
    borderColor: "#F5C842",
    backgroundColor: "#2A1060",
  },
  packageCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  packageCardRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#4A2E7A",
    alignItems: "center",
    justifyContent: "center",
  },
  packageCardRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#F5C842",
  },
  packageCardLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#9B7FD4",
  },
  packageCardLabelActive: { color: "#F5C842" },
  packageCardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#4A2E7A",
    marginTop: 2,
  },
  packageCardTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: "#0A0614",
    borderWidth: 1,
    borderColor: "#2A1060",
  },
  packageCardTagActive: {
    borderColor: "#F5C842",
    backgroundColor: "#2A1060",
  },
  packageCardTagText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: "#4A2E7A",
    letterSpacing: 1,
  },
  packageCardTagTextActive: { color: "#F5C842" },

  // ── Rol toggle accordion ────────────────────────────────────────────────────
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  accordionChevron: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#4A2E7A",
  },
  accordionBody: { paddingTop: 8 },
  roleGroup: { marginBottom: 12 },
  roleGroupLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  roleToggleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  roleToggleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    margin: 3,
  },
  roleToggleChipOff: {
    borderColor: "#2A1060",
    backgroundColor: "#0A0614",
    opacity: 0.5,
  },
  roleToggleEmoji: { fontSize: 14 },
  roleToggleName: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#E8DEFF",
  },
  roleToggleNameOff: { color: "#4A2E7A" },
  roleToggleCheck: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    marginLeft: 2,
  },
});
