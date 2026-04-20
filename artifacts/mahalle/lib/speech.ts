import * as Speech from "expo-speech";

let isMuted = false;
let _loaded = false;
let _trVoiceId: string | undefined;
let _voiceChecked = false;

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
  resolveTurkishVoice().then((voiceId) => {
    Speech.speak(text, {
      language: "tr-TR",
      rate: 0.85,
      pitch: 1.0,
      volume: 1.0,
      ...(voiceId ? { voice: voiceId } : {}),
    });
  });
}

export async function speakTest(text: string): Promise<void> {
  const isSpeaking = await Speech.isSpeakingAsync();
  if (isSpeaking) Speech.stop();
  const voiceId = await resolveTurkishVoice();
  Speech.speak(text, {
    language: "tr-TR",
    rate: 0.85,
    pitch: 1.0,
    volume: 1.0,
    ...(voiceId ? { voice: voiceId } : {}),
  });
}

export function stop() {
  Speech.stop();
}
