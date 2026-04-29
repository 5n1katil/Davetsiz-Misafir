import * as Speech from "expo-speech";

let isMuted = false;
let _loaded = false;
let _trVoiceId: string | undefined;
let _voiceChecked = false;
const BASE_SPEECH_OPTIONS = {
  language: "tr-TR" as const,
  // Slightly slower with a touch lower pitch sounds less robotic in Turkish.
  rate: 0.78,
  pitch: 0.92,
  volume: 1.0,
};

function normalizeForSpeech(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s*([,.;!?])/g, "$1")
    .replace(/[:]/g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function resolveTurkishVoice(): Promise<string | undefined> {
  if (_voiceChecked) return _trVoiceId;
  _voiceChecked = true;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const enhanced = voices.find(
      (v) => v.language === "tr-TR" && v.quality === Speech.VoiceQuality.Enhanced,
    );
    const standard = voices.find((v) => v.language === "tr-TR");
    const partial = voices.find((v) => v.language?.startsWith("tr"));
    _trVoiceId = (enhanced ?? standard ?? partial)?.identifier;
  } catch {
    _trVoiceId = undefined;
  }
  return _trVoiceId;
}

export function initMuted(value: boolean) {
  isMuted = value;
  _loaded = true;
  resolveTurkishVoice().catch(() => {});
}

export function setMuted(value: boolean) {
  isMuted = value;
  if (value) Speech.stop();
}

export async function isSpeakingAsync(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

export function speak(text: string): void {
  if (!_loaded || isMuted) return;
  if (!text || !text.trim()) return;
  const normalized = normalizeForSpeech(text);
  resolveTurkishVoice().then((voiceId) => {
    Speech.speak(normalized, {
      ...BASE_SPEECH_OPTIONS,
      ...(voiceId ? { voice: voiceId } : {}),
    });
  });
}

export async function speakTest(text: string): Promise<void> {
  const isSpeaking = await Speech.isSpeakingAsync();
  if (isSpeaking) Speech.stop();
  const voiceId = await resolveTurkishVoice();
  Speech.speak(normalizeForSpeech(text), {
    ...BASE_SPEECH_OPTIONS,
    ...(voiceId ? { voice: voiceId } : {}),
  });
}

export function stop() {
  Speech.stop();
}
