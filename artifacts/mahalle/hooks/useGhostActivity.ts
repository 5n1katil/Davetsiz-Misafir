import { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";

export function useGhostActivity() {
  const { state, myPlayerId } = useGame();
  const baselineRef = useRef<number | null>(null);
  const [hasActivity, setHasActivity] = useState(false);

  const phase = state?.phase ?? null;

  useEffect(() => {
    baselineRef.current = state?.graveyardChat.length ?? 0;
    setHasActivity(false);
  }, [phase]);

  useEffect(() => {
    if (baselineRef.current === null) return;
    const current = state?.graveyardChat.length ?? 0;
    if (current > baselineRef.current) {
      setHasActivity(true);
    }
  }, [state?.graveyardChat.length]);

  const me = state?.players.find((p) => p.id === myPlayerId);
  const isAlive = me?.isAlive ?? false;

  return isAlive ? hasActivity : false;
}
