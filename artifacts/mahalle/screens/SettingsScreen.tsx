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

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "system", label: "Sistem", icon: "monitor" },
  { value: "light", label: "Açık", icon: "sun" },
  { value: "dark", label: "Koyu", icon: "moon" },
];

export default function SettingsScreen({ visible, onClose }: SettingsScreenProps) {
  const c = useColors();
  const { voiceMuted, toggleVoice, vibrationsEnabled, toggleVibrations, toastsEnabled, toggleToasts, keepAwake, toggleKeepAwake } = useGame();
  const { themePreference, setThemePreference } = useThemePreference();

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
          <Pressable onPress={onClose} hitSlop={12} style={{ padding: 4 }}>
            <Feather name="x" size={22} color={c.mutedForeground} />
          </Pressable>
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
    fontSize: 18,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
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
    fontSize: 15,
  },
  rowSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
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
    fontSize: 12,
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
