import { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";

export function useGhostActivity(): number {
  const { state, myPlayerId } = useGame();
  const baselineRef = useRef<number | null>(null);
  const [count, setCount] = useState(0);

  const phase = state?.phase ?? null;

  useEffect(() => {
    baselineRef.current = state?.graveyardChat.length ?? 0;
    setCount(0);
  }, [phase]);

  useEffect(() => {
    if (baselineRef.current === null) return;
    const current = state?.graveyardChat.length ?? 0;
    const newCount = Math.max(0, current - baselineRef.current);
    setCount(newCount);
  }, [state?.graveyardChat.length]);

  const me = state?.players.find((p) => p.id === myPlayerId);
  const isAlive = me?.isAlive ?? false;

  return isAlive ? count : 0;
}

export function useOwnGraveyardCount(): number {
  const { state, myPlayerId } = useGame();
  const baselineRef = useRef<number | null>(null);
  const [count, setCount] = useState(0);

  const phase = state?.phase ?? null;

  const ownMessages = state?.graveyardChat.filter((m) => m.from === myPlayerId) ?? [];

  useEffect(() => {
    baselineRef.current = ownMessages.length;
    setCount(0);
  }, [phase, myPlayerId]);

  useEffect(() => {
    if (baselineRef.current === null) return;
    const newCount = Math.max(0, ownMessages.length - baselineRef.current);
    setCount(newCount);
  }, [ownMessages.length]);

  return count;
}
