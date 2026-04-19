import * as Haptics from "expo-haptics";

let _enabled = true;
let _loaded = false;

export function initVibrationsEnabled(val: boolean) {
  _enabled = val;
  _loaded = true;
}

export function setVibrationsEnabled(val: boolean) {
  _enabled = val;
}

export function haptic(style: Haptics.ImpactFeedbackStyle) {
  if (!_loaded || !_enabled) return;
  Haptics.impactAsync(style);
}

export function hapticNotification(type: Haptics.NotificationFeedbackType) {
  if (!_loaded || !_enabled) return;
  Haptics.notificationAsync(type);
}
