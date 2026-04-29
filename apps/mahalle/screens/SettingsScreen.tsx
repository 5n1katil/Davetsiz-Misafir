import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useGame } from "@/contexts/GameContext";
import { type ThemePreference, useThemePreference } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { DISCUSSION_MUSIC_MAX_VOLUME, LOBBY_MUSIC_MAX_VOLUME } from "@/lib/backgroundMusic";
import { speakTest } from "@/lib/speech";

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
  onLeaveGame?: () => void;
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "system", label: "Sistem", icon: "monitor" },
  { value: "light", label: "Açık", icon: "sun" },
  { value: "dark", label: "Koyu", icon: "moon" },
];

export default function SettingsScreen({ visible, onClose, onLeaveGame }: SettingsScreenProps) {
  const c = useColors();
  const {
    voiceMuted,
    toggleVoice,
    lobbyMusicEnabled,
    toggleLobbyMusic,
    lobbyMusicVolume,
    setLobbyMusicVolume,
    discussionMusicEnabled,
    toggleDiscussionMusic,
    discussionMusicVolume,
    setDiscussionMusicVolume,
    vibrationsEnabled,
    toggleVibrations,
    toastsEnabled,
    toggleToasts,
    keepAwake,
    toggleKeepAwake,
  } = useGame();
  const { themePreference, setThemePreference } = useThemePreference();
  const lobbyMusicPercent = Math.round((lobbyMusicVolume / LOBBY_MUSIC_MAX_VOLUME) * 100);
  const discussionMusicPercent = Math.round((discussionMusicVolume / DISCUSSION_MUSIC_MAX_VOLUME) * 100);
  const decreaseLobbyMusic = () => setLobbyMusicVolume(Math.max(0, lobbyMusicVolume - 0.01));
  const increaseLobbyMusic = () =>
    setLobbyMusicVolume(Math.min(LOBBY_MUSIC_MAX_VOLUME, lobbyMusicVolume + 0.01));
  const decreaseDiscussionMusic = () =>
    setDiscussionMusicVolume(Math.max(0, discussionMusicVolume - 0.01));
  const increaseDiscussionMusic = () =>
    setDiscussionMusicVolume(Math.min(DISCUSSION_MUSIC_MAX_VOLUME, discussionMusicVolume + 0.01));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: c.background }]}>
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Text style={[styles.title, { color: c.foreground }]}>Cihaz Ayarları</Text>
          <View style={styles.headerActions}>
            {onLeaveGame ? (
              <Pressable onPress={onLeaveGame} hitSlop={12} style={{ padding: 4 }}>
                <Feather name="log-out" size={20} color={c.destructive} />
              </Pressable>
            ) : null}
            <Pressable onPress={onClose} hitSlop={12} style={{ padding: 4 }}>
              <Feather name="x" size={22} color={c.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
            GÖRÜNÜM
          </Text>

          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <View style={styles.rowLeft}>
                <Feather name="layers" size={20} color={c.primary} />
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: c.foreground }]}>Tema</Text>
                  <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
                    Uygulama renk teması
                  </Text>
                </View>
              </View>
              <View style={[styles.segmented, { backgroundColor: c.muted, borderColor: c.border }]}>
                {THEME_OPTIONS.map((opt) => {
                  const active = themePreference === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setThemePreference(opt.value)}
                      style={[
                        styles.segment,
                        active && { backgroundColor: c.primary },
                      ]}
                    >
                      <Feather
                        name={opt.icon as any}
                        size={14}
                        color={active ? c.primaryForeground : c.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.segmentLabel,
                          { color: active ? c.primaryForeground : c.mutedForeground },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
            SES VE HAPTİK
          </Text>

          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconWrap}>
                  <Feather
                    name={lobbyMusicEnabled ? "music" : "volume-x"}
                    size={18}
                    color={lobbyMusicEnabled ? c.primary : c.mutedForeground}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: c.foreground }]}>Ana Arka Plan Müziği</Text>
                  <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
                    Ana sayfa ve oda kurulumu sırasında çalar
                  </Text>
                </View>
              </View>
              <Switch
                value={lobbyMusicEnabled}
                onValueChange={toggleLobbyMusic}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.separator, { backgroundColor: c.border }]} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconWrap}>
                  <Feather name="sliders" size={18} color={c.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: c.foreground }]}>Ana Tema Seviyesi</Text>
                  <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
                    {lobbyMusicPercent}% {lobbyMusicEnabled ? "" : "(kapalı)"}
                  </Text>
                </View>
              </View>
              <View style={styles.volumeControls}>
                <Pressable
                  onPress={decreaseLobbyMusic}
                  disabled={!lobbyMusicEnabled}
                  style={[
                    styles.volumeBtn,
                    { borderColor: c.border, backgroundColor: c.muted },
                    !lobbyMusicEnabled && styles.volumeBtnDisabled,
                  ]}
                >
                  <Text style={[styles.volumeBtnLabel, { color: c.foreground }]}>-</Text>
                </Pressable>
                <View style={[styles.volumeTrack, { backgroundColor: c.muted }]}>
                  <View
                    style={[
                      styles.volumeFill,
                      { width: `${lobbyMusicPercent}%` as any, backgroundColor: c.primary },
                    ]}
                  />
                </View>
                <Pressable
                  onPress={increaseLobbyMusic}
                  disabled={!lobbyMusicEnabled}
                  style={[
                    styles.volumeBtn,
                    { borderColor: c.border, backgroundColor: c.muted },
                    !lobbyMusicEnabled && styles.volumeBtnDisabled,
                  ]}
                >
                  <Text style={[styles.volumeBtnLabel, { color: c.foreground }]}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: c.border }]} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconWrap}>
                  <Feather
                    name={discussionMusicEnabled ? "music" : "volume-x"}
                    size={18}
                    color={discussionMusicEnabled ? c.primary : c.mutedForeground}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: c.foreground }]}>Tartışma/Oylama Müziği</Text>
                  <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
                    Oyun sırasında tartışma ve oylama aşamalarında çalar
                  </Text>
                </View>
              </View>
              <Switch
                value={discussionMusicEnabled}
                onValueChange={toggleDiscussionMusic}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.separator, { backgroundColor: c.border }]} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconWrap}>
                  <Feather name="sliders" size={18} color={c.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: c.foreground }]}>Tartışma/Oylama Seviyesi</Text>
                  <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
                    {discussionMusicPercent}% {discussionMusicEnabled ? "" : "(kapalı)"}
                  </Text>
                </View>
              </View>
              <View style={styles.volumeControls}>
                <Pressable
                  onPress={decreaseDiscussionMusic}
                  disabled={!discussionMusicEnabled}
                  style={[
                    styles.volumeBtn,
                    { borderColor: c.border, backgroundColor: c.muted },
                    !discussionMusicEnabled && styles.volumeBtnDisabled,
                  ]}
                >
                  <Text style={[styles.volumeBtnLabel, { color: c.foreground }]}>-</Text>
                </Pressable>
                <View style={[styles.volumeTrack, { backgroundColor: c.muted }]}>
                  <View
                    style={[
                      styles.volumeFill,
                      { width: `${discussionMusicPercent}%` as any, backgroundColor: c.primary },
                    ]}
                  />
                </View>
                <Pressable
                  onPress={increaseDiscussionMusic}
                  disabled={!discussionMusicEnabled}
                  style={[
                    styles.volumeBtn,
                    { borderColor: c.border, backgroundColor: c.muted },
                    !discussionMusicEnabled && styles.volumeBtnDisabled,
                  ]}
                >
                  <Text style={[styles.volumeBtnLabel, { color: c.foreground }]}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: c.border }]} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconWrap}>
                  <Feather
                    name={voiceMuted ? "volume-x" : "volume-2"}
                    size={18}
                    color={voiceMuted ? c.mutedForeground : c.primary}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: c.foreground }]}>Ses Anlatımı</Text>
                  <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
                    Host cihazındaki oyun duyuruları
                  </Text>
                </View>
              </View>
              <Switch
                value={!voiceMuted}
                onValueChange={toggleVoice}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.separator, { backgroundColor: c.border }]} />

            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconWrap}>
                  <Feather name="volume-2" size={18} color={c.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: c.foreground }]}>Sesi Test Et</Text>
                  <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
                    Türkçe seslendirmeyi deneyin
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => speakTest("Davetsiz Misafir. Mahalle uykuya daldı.")}
                style={[styles.testBtn, { backgroundColor: c.primary + "22", borderColor: c.primary }]}
              >
                <Text style={[styles.testBtnLabel, { color: c.primary }]}>🔊 Test</Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
            HAPTİK
          </Text>

          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconWrap}>
                  <Feather
                    name={vibrationsEnabled ? "smartphone" : "slash"}
                    size={18}
                    color={vibrationsEnabled ? c.primary : c.mutedForeground}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: c.foreground }]}>Titreşim</Text>
                  <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
                    Oyun olaylarında cihazı titret
                  </Text>
                </View>
              </View>
              <Switch
                value={vibrationsEnabled}
                onValueChange={toggleVibrations}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
            BİLDİRİMLER
          </Text>

          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconWrap}>
                  <Feather
                    name={toastsEnabled ? "bell" : "bell-off"}
                    size={18}
                    color={toastsEnabled ? c.primary : c.mutedForeground}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: c.foreground }]}>Oyun Bildirimleri</Text>
                  <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
                    Oyun olaylarında ekranda bildirim göster
                  </Text>
                </View>
              </View>
              <Switch
                value={toastsEnabled}
                onValueChange={toggleToasts}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
            EKRAN
          </Text>

          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <View style={styles.rowLeft}>
                <Feather
                  name="sun"
                  size={20}
                  color={keepAwake ? c.primary : c.mutedForeground}
                />
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: c.foreground }]}>Ekranı Açık Tut</Text>
                  <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
                    Oyun sırasında ekranın kararmasını engelle
                  </Text>
                </View>
              </View>
              <Switch
                value={keepAwake}
                onValueChange={toggleKeepAwake}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <Text style={[styles.hint, { color: c.mutedForeground }]}>
            Bu ayarlar cihazına kaydedilir ve sonraki oturumlarda korunur.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 19,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
    marginLeft: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,31,140,0.18)",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
  },
  rowSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  segmented: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  segment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  segmentLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  testBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  testBtnLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  volumeControls: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  volumeBtn: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  volumeBtnDisabled: {
    opacity: 0.45,
  },
  volumeBtnLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 19,
    lineHeight: 19,
  },
  volumeTrack: {
    borderRadius: 5,
    height: 8,
    overflow: "hidden",
    width: 80,
  },
  volumeFill: {
    borderRadius: 5,
    height: "100%",
  },
});
