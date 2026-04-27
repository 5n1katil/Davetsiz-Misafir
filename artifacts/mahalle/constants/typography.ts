import { Dimensions, PixelRatio } from "react-native";

type TextRole =
  | "micro"
  | "caption"
  | "label"
  | "body"
  | "bodyStrong"
  | "title"
  | "headline";

const BASE_SIZE: Record<TextRole, number> = {
  micro: 11,
  caption: 13,
  label: 14,
  body: 16,
  bodyStrong: 17,
  title: 20,
  headline: 24,
};

function adaptiveMultiplier() {
  const { width } = Dimensions.get("window");
  const fontScale = PixelRatio.getFontScale();
  const widthMultiplier = width <= 360 ? 1.15 : width <= 420 ? 1.1 : 1.05;
  const accessibilityMultiplier = fontScale > 1 ? Math.min(1.12, fontScale) : 1;
  return widthMultiplier * accessibilityMultiplier;
}

export function scaleText(size: number) {
  return Math.round(size * adaptiveMultiplier());
}

export function textRole(role: TextRole) {
  return scaleText(BASE_SIZE[role]);
}

