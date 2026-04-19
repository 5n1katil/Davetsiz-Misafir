import { useEffect, useState } from "react";

export function useCountdown(deadline: number | null): number {
  const [remaining, setRemaining] = useState<number>(() => {
    if (!deadline) return 0;
    return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!deadline) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const r = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setRemaining(r);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
}
