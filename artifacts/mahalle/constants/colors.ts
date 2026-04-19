const palette = {
  // Backgrounds
  bgBase: "#0A0614",
  bgSurface: "#1A0A3E",
  bgCard: "#2A1060",
  bgElevated: "#3B1F8C",

  // Accents
  gold: "#F5C842",
  red: "#C8102E",
  teal: "#1ECBE1",
  lavender: "#9B7FD4",

  // Text
  textPrimary: "#E8DEFF",
  textSecondary: "#9B7FD4",
  textMuted: "#4A2E7A",

  // Borders
  border: "#2A1060",
  borderActive: "#3B1F8C",

  // Faction colors
  factionGood: "#F5C842",    // Mahalle
  factionBad: "#C8102E",     // Davetsiz Misafir çetesi
  factionChaos: "#1ECBE1",   // Kargaşacılar
  factionNeutral: "#9B7FD4", // Yalnız Kurtlar
};

const colors = {
  light: {
    text: palette.textPrimary,
    tint: palette.gold,
    background: palette.bgBase,
    foreground: palette.textPrimary,
    card: palette.bgCard,
    cardForeground: palette.textPrimary,
    primary: palette.gold,
    primaryForeground: palette.bgBase,
    secondary: palette.bgSurface,
    secondaryForeground: palette.textPrimary,
    muted: palette.bgSurface,
    mutedForeground: palette.textSecondary,
    accent: palette.teal,
    accentForeground: palette.bgBase,
    destructive: palette.red,
    destructiveForeground: palette.textPrimary,
    border: palette.borderActive,
    input: palette.bgSurface,
    surface: palette.bgSurface,
    elevated: palette.bgElevated,
    factionGood: palette.factionGood,
    factionBad: palette.factionBad,
    factionChaos: palette.factionChaos,
    factionNeutral: palette.factionNeutral,
  },
  dark: {
    text: palette.textPrimary,
    tint: palette.gold,
    background: palette.bgBase,
    foreground: palette.textPrimary,
    card: palette.bgCard,
    cardForeground: palette.textPrimary,
    primary: palette.gold,
    primaryForeground: palette.bgBase,
    secondary: palette.bgSurface,
    secondaryForeground: palette.textPrimary,
    muted: palette.bgSurface,
    mutedForeground: palette.textSecondary,
    accent: palette.teal,
    accentForeground: palette.bgBase,
    destructive: palette.red,
    destructiveForeground: palette.textPrimary,
    border: palette.borderActive,
    input: palette.bgSurface,
    surface: palette.bgSurface,
    elevated: palette.bgElevated,
    factionGood: palette.factionGood,
    factionBad: palette.factionBad,
    factionChaos: palette.factionChaos,
    factionNeutral: palette.factionNeutral,
  },
  radius: 10,
  brand: palette,
};

export default colors;
