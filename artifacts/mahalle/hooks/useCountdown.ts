import { useEffect, useRef, useState } from "react";

export function useCountdown(deadline: number | null, paused = false): number {
  const [remaining, setRemaining] = useState<number>(() => {
    if (!deadline) return 0;
    return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
  });

  const frozenRef = useRef<number | null>(null);

  useEffect(() => {
    if (!deadline) {
      setRemaining(0);
      frozenRef.current = null;
      return;
    }

    if (paused) {
      if (frozenRef.current === null) {
        frozenRef.current = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
        setRemaining(frozenRef.current);
      }
      return;
    }

    frozenRef.current = null;

    const tick = () => {
      const r = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setRemaining(r);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline, paused]);

  return remaining;
}
