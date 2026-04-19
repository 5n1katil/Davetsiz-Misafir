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

const MAX_LENGTH = 200;

export function GraveyardChat() {
  const c = useColors();
  const { state, emit } = useGame();
  const [text, setText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = state?.graveyardChat ?? [];

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
        <Feather name="message-circle" size={14} color={c.mutedForeground} />
        <Text style={[styles.headerText, { color: c.mutedForeground }]}>
          MEZARLIK SOHBETI
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => `${item.from}-${item.ts}`}
        style={[styles.list, { borderColor: c.border }]}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={styles.messageRow}>
            <Text style={[styles.nick, { color: c.primary }]}>
              {item.nick}
            </Text>
            <Text style={[styles.msgText, { color: c.foreground }]}>
              {"  "}{item.text}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
            Henüz mesaj yok. Merhaba de!
          </Text>
        }
      />

      {errorMsg ? (
        <View style={[styles.errorBanner, { backgroundColor: c.card, borderColor: "#e53e3e" }]}>
          <Feather name="alert-circle" size={13} color="#e53e3e" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

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
  },
  list: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  listContent: {
    padding: 10,
    gap: 6,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 2,
  },
  nick: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  msgText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flexShrink: 1,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
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
});
