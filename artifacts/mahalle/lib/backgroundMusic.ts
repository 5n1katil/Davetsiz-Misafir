import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { Asset } from "expo-asset";
import { Platform } from "react-native";

let configured = false;
let sound: Audio.Sound | null = null;
let loaded = false;
let loadPromise: Promise<void> | null = null;
let currentPlaying = false;
let desiredEnabled = false;
export const BG_MUSIC_MAX_VOLUME = 0.12;
export const BG_MUSIC_DEFAULT_VOLUME = BG_MUSIC_MAX_VOLUME / 2;
const BG_MUSIC_OUTPUT_ATTENUATION = 0.2;
let targetVolume = BG_MUSIC_DEFAULT_VOLUME;
let webAudio: HTMLAudioElement | null = null;
let musicUri: string | null = null;

function getOutputVolume(level: number) {
  return Math.max(0, Math.min(1, level * BG_MUSIC_OUTPUT_ATTENUATION));
}

async function resolveMusicUri(): Promise<string> {
  if (musicUri) return musicUri;
  const moduleRef = require("../assets/audio/main-theme.wav");
  const asset = Asset.fromModule(moduleRef);
  if (!asset.downloaded) {
    await asset.downloadAsync();
  }
  musicUri = asset.localUri ?? asset.uri ?? "";
  if (!musicUri) {
    throw new Error("Music asset URI could not be resolved");
  }
  return musicUri;
}

async function ensureConfigured() {
  if (configured) return;
  configured = true;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    // Best effort. Some platforms may not support every mode.
  }
}

async function ensureLoaded() {
  if (loaded) return;
  if (loadPromise) {
    await loadPromise;
    return;
  }
  loadPromise = (async () => {
    if (Platform.OS === "web") {
      if (webAudio) return;
      const uri = await resolveMusicUri();
      webAudio = new window.Audio(uri);
      webAudio.loop = true;
      webAudio.preload = "auto";
      webAudio.volume = getOutputVolume(targetVolume);
      loaded = true;
      return;
    }
    await ensureConfigured();
    if (sound) {
      loaded = true;
      return;
    }
    const uri = await resolveMusicUri();
    const created = await Audio.Sound.createAsync(
      { uri },
      {
        isLooping: true,
        volume: getOutputVolume(targetVolume),
        shouldPlay: false,
      },
    );
    sound = created.sound;
    loaded = true;
  })();
  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
}

export async function setBackgroundMusicEnabled(enabled: boolean) {
  desiredEnabled = enabled;
  try {
    await ensureLoaded();
    if (Platform.OS === "web") {
      if (!webAudio) return;
      webAudio.volume = getOutputVolume(targetVolume);
      if (enabled) {
        await webAudio.play();
      } else {
        webAudio.pause();
      }
      currentPlaying = enabled;
      return;
    }
    if (!sound) return;
    await sound.setStatusAsync({
      isLooping: true,
      volume: getOutputVolume(targetVolume),
      shouldPlay: enabled,
    });
    currentPlaying = enabled;
  } catch {
    currentPlaying = false;
    // Do not break gameplay if music load/play fails (e.g. web autoplay restrictions).
  }
}

export async function setBackgroundMusicVolume(level: number) {
  // Background music should stay subtle; hard cap the maximum.
  targetVolume = Math.max(0, Math.min(BG_MUSIC_MAX_VOLUME, level));
  try {
    await ensureLoaded();
    if (Platform.OS === "web") {
      if (!webAudio) return;
      webAudio.volume = getOutputVolume(targetVolume);
      return;
    }
    if (!sound) return;
    await sound.setStatusAsync({ volume: getOutputVolume(targetVolume) });
  } catch {
    // noop
  }
}

export async function retryBackgroundMusicAfterUserGesture() {
  if (!desiredEnabled) return;
  await setBackgroundMusicEnabled(true);
}

export async function stopBackgroundMusic() {
  currentPlaying = false;
  if (Platform.OS === "web") {
    if (!webAudio) return;
    webAudio.pause();
    webAudio.currentTime = 0;
    return;
  }
  if (!sound) return;
  try {
    await sound.stopAsync();
  } catch {
    // noop
  }
}

export async function unloadBackgroundMusic() {
  currentPlaying = false;
  if (Platform.OS === "web") {
    if (!webAudio) return;
    webAudio.pause();
    webAudio.src = "";
    webAudio = null;
    loaded = false;
    return;
  }
  if (!sound) return;
  try {
    await sound.unloadAsync();
  } catch {
    // noop
  } finally {
    sound = null;
    loaded = false;
  }
}

export function isBackgroundMusicPlaying() {
  return currentPlaying;
}
