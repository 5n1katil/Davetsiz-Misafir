import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "mahalle:theme";

interface ThemeCtx {
  themePreference: ThemePreference;
  setThemePreference: (v: ThemePreference) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function useThemePreference() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useThemePreference must be used inside ThemeProvider");
  return v;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePreference, setThemePrefState] = useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "system") {
          setThemePrefState(v);
        }
      })
      .catch(() => {});
  }, []);

  const setThemePreference = useCallback((v: ThemePreference) => {
    setThemePrefState(v);
    AsyncStorage.setItem(STORAGE_KEY, v).catch(() => {});
  }, []);

  return (
    <Ctx.Provider value={{ themePreference, setThemePreference }}>
      {children}
    </Ctx.Provider>
  );
}
