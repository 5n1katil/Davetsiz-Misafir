import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useGame } from "@/contexts/GameContext";
import { useColors } from "@/hooks/useColors";
import { useOwnGraveyardCount } from "@/hooks/useGhostActivity";
import { ROLE_DEFS } from "@/constants/roles";

const MAX_LENGTH = 200;

function roleEmoji(roleId: string | null | undefined): string {
  if (!roleId) return "👻";
  const meta = ROLE_DEFS[roleId];
  if (!meta) return "👻";
  return meta.emoji ?? "👻";
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function GraveyardChat() {
  const c = useColors();
  const { state, emit, myPlayerId } = useGame();
  const ownCount = useOwnGraveyardCount();
  const [text, setText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = state?.graveyardChat ?? [];
  const me = state?.players.find((p) => p.id === myPlayerId);
  const amIDead = me ? !me.isAlive : false;

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorMsg(null), 2500);
  };

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_LENGTH) {
      showError(`Mesaj en fazla ${MAX_LENGTH} karakter olabilir`);
      return;
    }
    const res = await emit("graveyardChat", { text: trimmed });
    if (res.ok) {
      setText("");
    } else if (res.error) {
      showError(res.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <View style={[styles.header, { borderColor: c.border }]}>
        <Text style={{ fontSize: 14 }}>⚰️</Text>
        <Text style={[styles.headerText, { color: c.mutedForeground }]}>
          MEZARLIK SOHBETI
        </Text>
        <Text style={[styles.ownCountText, { color: c.mutedForeground }]}>
          {ownCount}
        </Text>
      </View>

      {messages.length === 0 && (
        <View style={styles.emptyWrapper}>
          <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
            Ölüler henüz konuşmadı... 👻
          </Text>
          <Text style={[styles.emptyHint, { color: c.mutedForeground }]}>
            Yalnızca ölenler bu sohbeti görür.
          </Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => `${item.from}-${item.ts}`}
        style={[styles.list, { borderColor: c.border }]}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={styles.messageRow}>
            <Text style={styles.roleEmoji}>{roleEmoji(item.roleId)}</Text>
            <View style={styles.messageBubble}>
              <View style={styles.metaRow}>
                <Text style={[styles.nick, { color: c.primary }]}>{item.nick}</Text>
                <Text style={[styles.timestamp, { color: c.mutedForeground }]}>
                  {formatTime(item.ts)}
                </Text>
              </View>
              <Text style={[styles.msgText, { color: c.foreground }]}>{item.text}</Text>
            </View>
          </View>
        )}
      />

      {errorMsg ? (
        <View style={[styles.errorBanner, { backgroundColor: c.card, borderColor: "#e53e3e" }]}>
          <Feather name="alert-circle" size={13} color="#e53e3e" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {amIDead ? (
        <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.card }]}>
          <TextInput
            style={[styles.input, { color: c.foreground }]}
            placeholder="Bir şeyler yaz..."
            placeholderTextColor={c.mutedForeground}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
            blurOnSubmit={false}
            maxLength={MAX_LENGTH}
          />
          <TouchableOpacity
            onPress={send}
            style={[styles.sendBtn, { backgroundColor: c.primary }]}
            disabled={!text.trim()}
            activeOpacity={0.7}
          >
            <Feather name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.spectatorBadge, { borderColor: c.border }]}>
          <Text style={[styles.spectatorText, { color: c.mutedForeground }]}>
            👁  Yalnızca ölenler yazabilir
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 200,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  headerText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    flex: 1,
  },
  ownCountText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  emptyWrapper: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 4,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  emptyHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "center",
    opacity: 0.7,
  },
  list: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  listContent: {
    padding: 10,
    gap: 8,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  roleEmoji: {
    fontSize: 18,
    marginTop: 2,
  },
  messageBubble: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  nick: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  timestamp: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  msgText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flexShrink: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    paddingVertical: 2,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#e53e3e",
    flexShrink: 1,
  },
  spectatorBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  spectatorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
});
