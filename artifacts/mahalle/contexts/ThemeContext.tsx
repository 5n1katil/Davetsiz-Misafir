import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "mahalle:theme";

interface ThemeCtx {
  themePreference: ThemePreference;
  setThemePreference: (v: ThemePreference) => void;
  transitionCount: number;
  prevBg: string;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function useThemePreference() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useThemePreference must be used inside ThemeProvider");
  return v;
}

function resolveBackground(pref: ThemePreference, scheme: "light" | "dark"): string {
  const resolved = pref === "system" ? scheme : pref;
  return resolved === "dark" ? colors.dark.background : colors.light.background;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = (useColorScheme() ?? "dark") as "light" | "dark";
  const [themePreference, setThemePrefState] = useState<ThemePreference>("system");
  const [transitionCount, setTransitionCount] = useState(0);
  const [prevBg, setPrevBg] = useState(() => resolveBackground("system", scheme));
  const currentBgRef = useRef(resolveBackground("system", scheme));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "system") {
          setThemePrefState(v);
          currentBgRef.current = resolveBackground(v, scheme);
        }
      })
      .catch(() => {});
  }, []);

  const setThemePreference = useCallback(
    (v: ThemePreference) => {
      const oldBg = currentBgRef.current;
      const newBg = resolveBackground(v, scheme);

      if (oldBg !== newBg) {
        setPrevBg(oldBg);
        setTransitionCount((c) => c + 1);
      }

      currentBgRef.current = newBg;
      setThemePrefState(v);
      AsyncStorage.setItem(STORAGE_KEY, v).catch(() => {});
    },
    [scheme]
  );

  return (
    <Ctx.Provider value={{ themePreference, setThemePreference, transitionCount, prevBg }}>
      {children}
    </Ctx.Provider>
  );
}
