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

const lightPalette = {
  bgBase: "#F4F0FF",
  bgSurface: "#E8DFFF",
  bgCard: "#DDD5F9",
  bgElevated: "#C9BBEE",

  gold: "#B8860B",
  red: "#C8102E",
  teal: "#0A8FA0",
  lavender: "#6B4FA8",

  textPrimary: "#1A0A3E",
  textSecondary: "#5A3F96",
  textMuted: "#8B78C2",

  border: "#C9BBEE",
  borderActive: "#9B7FD4",

  factionGood: "#B8860B",
  factionBad: "#C8102E",
  factionChaos: "#0A8FA0",
  factionNeutral: "#6B4FA8",
};

const colors = {
  light: {
    text: lightPalette.textPrimary,
    tint: lightPalette.gold,
    background: lightPalette.bgBase,
    foreground: lightPalette.textPrimary,
    card: lightPalette.bgCard,
    cardForeground: lightPalette.textPrimary,
    primary: lightPalette.gold,
    primaryForeground: lightPalette.bgBase,
    secondary: lightPalette.bgSurface,
    secondaryForeground: lightPalette.textPrimary,
    muted: lightPalette.bgSurface,
    mutedForeground: lightPalette.textSecondary,
    accent: lightPalette.teal,
    accentForeground: lightPalette.bgBase,
    destructive: lightPalette.red,
    destructiveForeground: lightPalette.textPrimary,
    border: lightPalette.borderActive,
    input: lightPalette.bgSurface,
    surface: lightPalette.bgSurface,
    elevated: lightPalette.bgElevated,
    factionGood: lightPalette.factionGood,
    factionBad: lightPalette.factionBad,
    factionChaos: lightPalette.factionChaos,
    factionNeutral: lightPalette.factionNeutral,
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
