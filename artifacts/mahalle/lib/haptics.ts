import * as Haptics from "expo-haptics";

let _enabled = true;

export function setVibrationsEnabled(val: boolean) {
  _enabled = val;
}

export function haptic(style: Haptics.ImpactFeedbackStyle) {
  if (!_enabled) return;
  Haptics.impactAsync(style);
}
