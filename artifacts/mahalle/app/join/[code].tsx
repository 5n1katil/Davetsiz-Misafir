import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import * as Linking from "expo-linking";

import { useGame } from "@/contexts/GameContext";

export default function JoinByCode() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { state } = useGame();

  useEffect(() => {
    const roomCode = String(code ?? "").toUpperCase().trim();
    if (!roomCode) {
      router.replace("/");
      return;
    }
    const url = Linking.createURL("join", { queryParams: { code: roomCode } });
    Linking.openURL(url).catch(() => {
      router.replace("/");
    });
  }, [code]);

  if (state) return null;
  return null;
}
