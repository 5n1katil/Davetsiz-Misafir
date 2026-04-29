import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { Asset } from "expo-asset";
import { Platform } from "react-native";

type MusicChannel = "lobby" | "discussion";

let configured = false;
const nativeSounds: Record<MusicChannel, Audio.Sound | null> = {
  lobby: null,
  discussion: null,
};
const loaded: Record<MusicChannel, boolean> = {
  lobby: false,
  discussion: false,
};
const loadPromises: Record<MusicChannel, Promise<void> | null> = {
  lobby: null,
  discussion: null,
};
const currentPlaying: Record<MusicChannel, boolean> = {
  lobby: false,
  discussion: false,
};
const desiredEnabled: Record<MusicChannel, boolean> = {
  lobby: true,
  discussion: true,
};
export const LOBBY_MUSIC_MAX_VOLUME = 0.12;
export const DISCUSSION_MUSIC_MAX_VOLUME = 0.12;
export const LOBBY_MUSIC_DEFAULT_VOLUME = LOBBY_MUSIC_MAX_VOLUME / 2;
export const DISCUSSION_MUSIC_DEFAULT_VOLUME = DISCUSSION_MUSIC_MAX_VOLUME / 2;
// Keep UI at 0-100 while output stays comfortably in background.
const MUSIC_OUTPUT_ATTENUATION = 0.5;
const targetVolume: Record<MusicChannel, number> = {
  lobby: LOBBY_MUSIC_DEFAULT_VOLUME,
  discussion: DISCUSSION_MUSIC_DEFAULT_VOLUME,
};
const webAudio: Record<MusicChannel, HTMLAudioElement | null> = {
  lobby: null,
  discussion: null,
};
const musicUris: Record<MusicChannel, string | null> = {
  lobby: null,
  discussion: null,
};

function getOutputVolume(level: number) {
  return Math.max(0, Math.min(1, level * MUSIC_OUTPUT_ATTENUATION));
}

function getMusicModule(channel: MusicChannel) {
  return channel === "lobby"
    ? require("../assets/audio/main-theme.wav")
    : require("../assets/audio/discussion-theme.wav");
}

async function resolveMusicUri(channel: MusicChannel): Promise<string> {
  if (musicUris[channel]) return musicUris[channel]!;
  const moduleRef = getMusicModule(channel);
  const asset = Asset.fromModule(moduleRef);
  if (!asset.downloaded) {
    await asset.downloadAsync();
  }
  musicUris[channel] = asset.localUri ?? asset.uri ?? "";
  if (!musicUris[channel]) {
    throw new Error("Music asset URI could not be resolved");
  }
  return musicUris[channel]!;
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

async function ensureLoaded(channel: MusicChannel) {
  if (loaded[channel]) return;
  if (loadPromises[channel]) {
    await loadPromises[channel];
    return;
  }
  loadPromises[channel] = (async () => {
    if (Platform.OS === "web") {
      if (webAudio[channel]) return;
      const uri = await resolveMusicUri(channel);
      webAudio[channel] = new window.Audio(uri);
      webAudio[channel]!.loop = true;
      webAudio[channel]!.preload = "auto";
      webAudio[channel]!.volume = getOutputVolume(targetVolume[channel]);
      loaded[channel] = true;
      return;
    }
    await ensureConfigured();
    if (nativeSounds[channel]) {
      loaded[channel] = true;
      return;
    }
    const uri = await resolveMusicUri(channel);
    const created = await Audio.Sound.createAsync(
      { uri },
      {
        isLooping: true,
        volume: getOutputVolume(targetVolume[channel]),
        shouldPlay: false,
      },
    );
    nativeSounds[channel] = created.sound;
    loaded[channel] = true;
  })();
  try {
    await loadPromises[channel];
  } finally {
    loadPromises[channel] = null;
  }
}

async function setChannelEnabled(channel: MusicChannel, enabled: boolean) {
  desiredEnabled[channel] = enabled;
  try {
    await ensureLoaded(channel);
    if (Platform.OS === "web") {
      if (!webAudio[channel]) return;
      webAudio[channel]!.volume = getOutputVolume(targetVolume[channel]);
      if (enabled) {
        await webAudio[channel]!.play();
      } else {
        webAudio[channel]!.pause();
      }
      currentPlaying[channel] = enabled;
      return;
    }
    if (!nativeSounds[channel]) return;
    await nativeSounds[channel]!.setStatusAsync({
      isLooping: true,
      volume: getOutputVolume(targetVolume[channel]),
      shouldPlay: enabled,
    });
    currentPlaying[channel] = enabled;
  } catch {
    currentPlaying[channel] = false;
    // Do not break gameplay if music load/play fails (e.g. web autoplay restrictions).
  }
}

async function setChannelVolume(channel: MusicChannel, level: number, maxVolume: number) {
  targetVolume[channel] = Math.max(0, Math.min(maxVolume, level));
  try {
    await ensureLoaded(channel);
    if (Platform.OS === "web") {
      if (!webAudio[channel]) return;
      webAudio[channel]!.volume = getOutputVolume(targetVolume[channel]);
      return;
    }
    if (!nativeSounds[channel]) return;
    await nativeSounds[channel]!.setStatusAsync({ volume: getOutputVolume(targetVolume[channel]) });
  } catch {
    // noop
  }
}

export async function setLobbyMusicEnabled(enabled: boolean) {
  await setChannelEnabled("lobby", enabled);
}

export async function setDiscussionMusicEnabled(enabled: boolean) {
  await setChannelEnabled("discussion", enabled);
}

export async function setLobbyMusicVolume(level: number) {
  await setChannelVolume("lobby", level, LOBBY_MUSIC_MAX_VOLUME);
}

export async function setDiscussionMusicVolume(level: number) {
  await setChannelVolume("discussion", level, DISCUSSION_MUSIC_MAX_VOLUME);
}

export async function retryMusicAfterUserGesture() {
  const tasks: Promise<void>[] = [];
  if (desiredEnabled.lobby) tasks.push(setLobbyMusicEnabled(true));
  if (desiredEnabled.discussion) tasks.push(setDiscussionMusicEnabled(true));
  await Promise.all(tasks);
}

export async function unloadAllMusic() {
  const channels: MusicChannel[] = ["lobby", "discussion"];
  for (const channel of channels) {
    currentPlaying[channel] = false;
    if (Platform.OS === "web") {
      if (!webAudio[channel]) continue;
      webAudio[channel]!.pause();
      webAudio[channel]!.src = "";
      webAudio[channel] = null;
      loaded[channel] = false;
      continue;
    }
    if (!nativeSounds[channel]) continue;
    try {
      await nativeSounds[channel]!.unloadAsync();
    } catch {
      // noop
    } finally {
      nativeSounds[channel] = null;
      loaded[channel] = false;
    }
  }
}

export function isMusicPlaying(channel: MusicChannel) {
  return currentPlaying[channel];
}
