import * as Speech from "expo-speech";

let isMuted = false;
let _loaded = false;

export function initMuted(value: boolean) {
  isMuted = value;
  _loaded = true;
}

export function setMuted(value: boolean) {
  isMuted = value;
  if (value) Speech.stop();
}

export function isSpeaking(): boolean {
  return false;
}

export function speak(text: string) {
  if (!_loaded || isMuted) return;
  if (!text || !text.trim()) return;
  Speech.speak(text, {
    language: "tr-TR",
    rate: 0.95,
    pitch: 1.0,
  });
}

export function stop() {
  Speech.stop();
}
