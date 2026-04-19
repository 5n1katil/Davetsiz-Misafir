import { useColorScheme } from "react-native";

import colors from "@/constants/colors";
import { useThemePreference } from "@/contexts/ThemeContext";

/**
 * Returns the design tokens for the current color scheme, plus the resolved
 * theme name ("light" | "dark") so callers can adapt chrome (status bar, etc.)
 *
 * Resolves in this order:
 *  1. If the user has chosen "light" or "dark" in Settings, use that.
 *  2. If the user chose "system" (default), follow the device appearance setting.
 */
export function useColors() {
  const scheme = useColorScheme();
  const { themePreference } = useThemePreference();

  const resolvedTheme: "light" | "dark" =
    themePreference === "system"
      ? (scheme ?? "dark")
      : themePreference;

  const palette = resolvedTheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius, resolvedTheme };
}
