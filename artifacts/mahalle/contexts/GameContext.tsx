import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { io, Socket } from "socket.io-client";

import { ROLE_DEFS } from "@/constants/roles";
import { speak, setMuted, initMuted, isSpeakingAsync } from "@/lib/speech";
import { haptic, hapticNotification, initVibrationsEnabled, setVibrationsEnabled } from "@/lib/haptics";
import { useColors } from "@/hooks/useColors";
import {
  BG_MUSIC_DEFAULT_VOLUME,
  BG_MUSIC_MAX_VOLUME,
  setBackgroundMusicVolume as applyBackgroundMusicVolume,
} from "@/lib/backgroundMusic";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
const EXPLICIT_SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ?? process.env.EXPO_PUBLIC_API_URL;
const WEB_FALLBACK_SOCKET_URL =
  "https://davetsiz-misafir-staging-production.up.railway.app";
const SOCKET_URL = EXPLICIT_SOCKET_URL
  ? EXPLICIT_SOCKET_URL
  : DOMAIN
    ? `https://${DOMAIN}`
    : Platform.OS === "web"
      ? WEB_FALLBACK_SOCKET_URL
      : "http://localhost";

export interface PlayerView {
  id: string;
  nickname: string;
  isHost: boolean;
  isAlive: boolean;
  isConnected: boolean;
  isReady: boolean;
  roleSelectReady?: boolean;
  hasSelectedRole: boolean;
  selectedRoleId: string | null;
  roleSelectPosition: number | null;
  roleSelectStatus: "waiting" | "picking" | "done";
}

export interface GameState {
  code: string;
  hostId: string;
  phase:
    | "LOBBY"
    | "ROLE_SELECT"
    | "ROLE_REVEAL"
    | "DAY"
    | "VOTE"
    | "VOTE_RUNOFF"
    | "NIGHT"
    | "NIGHT_ROLE"
    | "ENDED";
  round: number;
  settings: {
    dayDurationSec: number;
    voiceEnabled: boolean;
    ceteCount: number;
    activeSpecialRoles: string[];
    nightActionDurationSec: number;
    voteDurationSec: number;
    rolePackage: "standard" | "advanced" | "all";
    disabledRoles: string[];
    roleSelectShowNames: "hidden" | "visible";
    roleDistribution: "random" | "pick";
    roleRevealOnLynch: boolean;
  };
  phaseDeadline: number | null;
  roleSelectDeadline: number | null;
  players: PlayerView[];
  currentChoice: { playerId: string; options: string[] } | null;
  myRole: string | null;
  runoffCandidates: string[];
  nightStep: { roleId: string; actorIds: string[] } | null;
  nightStepIndex: number;
  nightOrderQueue: { roleId: string; actorIds: string[] }[];
  morningEvents: { kind: "death" | "calm" | "saved" | "info" | "sahte_dernek_lynched"; message: string; victims?: string[] }[];
  graveyard: {
    playerId: string;
    nickname: string;
    roleId: string;
    cause: string;
  }[];
  graveyardChat: { from: string; nick: string; text: string; ts: number; roleId: string | null }[];
  ceteVoteCounts: Record<string, number>;
  winner: string | null;
  winnerLabel: string | null;
  voteCount: number;
  voteOpenBy: number;
  voteOpenRequired: number;
  voteTally: Record<string, number>;
  roleSelectPrep?: boolean;
  roleSelectStage?: "prep" | "close_eyes" | "wake_player" | "choosing" | "open_eyes" | null;
  roleSelectReadyCount?: number;
  privateMessages: { msg: string; ts: number }[];
  ceteMembers: { id: string; nickname: string; roleId: string | null }[];
  paused: boolean;
  hocaUsed?: boolean;
  nextLynchReversed?: boolean;
  anonimMarks?: string[];
  anonimLynchedCount?: number;
  kiskanKopyaTarget?: string | null;
  kapiciLockHistory?: Array<{ night: number; targetNickname: string }>;
  personalAchievements?: { playerId: string; roleId: string; label: string }[];
  eventLog?: { type: string; round: number; ts: number; message: string; emoji: string }[];
}

export interface SystemToast {
  message: string;
  id: number;
  icon?: string;
  onPress?: () => void;
  alwaysShow?: boolean;
}

interface GameCtx {
  socket: Socket | null;
  connected: boolean;
  state: GameState | null;
  myPlayerId: string | null;
  myNickname: string | null;
  setNickname: (n: string) => void;
  createRoom: (nickname: string) => Promise<{ ok: boolean; error?: string }>;
  joinRoom: (
    code: string,
    nickname: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  emit: (event: string, payload?: any) => Promise<{ ok: boolean; error?: string }>;
  leave: () => Promise<void>;
  voiceMuted: boolean;
  toggleVoice: () => void;
  backgroundMusicEnabled: boolean;
  toggleBackgroundMusic: () => void;
  backgroundMusicVolume: number;
  setBackgroundMusicVolume: (value: number) => void;
  vibrationsEnabled: boolean;
  toggleVibrations: () => void;
  toastsEnabled: boolean;
  toggleToasts: () => void;
  keepAwake: boolean;
  toggleKeepAwake: () => void;
  systemToast: SystemToast | null;
  dismissToast: () => void;
  hostJustReceived: boolean;
  clearHostJustReceived: () => void;
  openHostPanelTrigger: number;
  nightResultMessages: { msg: string; ts: number }[];
  clearNightResult: () => void;
}

const Ctx = createContext<GameCtx | null>(null);
const LAST_ROOM_CODE_KEY = "mahalle:lastRoomCode";
const BG_MUSIC_VOLUME_SCALE_KEY = "mahalle:bgMusicVolumeScale";
const BG_MUSIC_LEGACY_MAX_VOLUME = 0.12;

export function useGame() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGame must be used inside GameProvider");
  return v;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const c = useColors();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const myPlayerIdRef = useRef<string | null>(null);
  const [myNickname, setMyNickname] = useState<string | null>(null);
  const [voiceMuted, setVoiceMutedState] = useState(false);
  const [backgroundMusicEnabled, setBackgroundMusicEnabledState] = useState(true);
  const [backgroundMusicVolume, setBackgroundMusicVolumeState] = useState(BG_MUSIC_DEFAULT_VOLUME);
  const [vibrationsEnabled, setVibrationsEnabledState] = useState(true);
  const [toastsEnabled, setToastsEnabledState] = useState(true);
  const [keepAwake, setKeepAwakeState] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [systemToast, setSystemToast] = useState<SystemToast | null>(null);
  const [hostJustReceived, setHostJustReceived] = useState(false);
  const [openHostPanelTrigger, setOpenHostPanelTrigger] = useState(0);
  const hostNotifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [spectatorKeepAwake, setSpectatorKeepAwake] = useState<boolean | null>(null);
  const [showSpectatorPrompt, setShowSpectatorPrompt] = useState(false);
  const lastPhaseRef = useRef<string | null>(null);
  const wasAliveRef = useRef<boolean | null>(null);
  const stateRef = useRef<GameState | null>(null);
  stateRef.current = state;
  const [nightResultMessages, setNightResultMessages] = useState<{ msg: string; ts: number }[]>([]);
  const lastSeenTsRef = useRef<number>(0);
  const autoJoinTriedRef = useRef(false);

  useEffect(() => {
    if (!state || !myPlayerId) return;
    const me = state.players.find((p) => p.id === myPlayerId);
    const isAlive = me?.isAlive ?? true;
    if (wasAliveRef.current === true && !isAlive) {
      haptic(Haptics.ImpactFeedbackStyle.Heavy);
      setSpectatorKeepAwake(null);
      setShowSpectatorPrompt(true);
    }
    wasAliveRef.current = isAlive;
  }, [state?.players, myPlayerId]);

  useEffect(() => {
    if (!state) return;
    const prev = lastPhaseRef.current;
    const next = state.phase;
    if ((prev === "VOTE" || prev === "VOTE_RUNOFF") && next === "DAY") {
      haptic(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (prev !== "ENDED" && next === "ENDED") {
      haptic(Haptics.ImpactFeedbackStyle.Heavy);
      if (state.winner && myPlayerId) {
        const myGraveEntry = state.graveyard.find((g) => g.playerId === myPlayerId);
        const myRoleId = state.myRole ?? myGraveEntry?.roleId ?? "mahalle_sakini";
        const myRoleDef = ROLE_DEFS[myRoleId];
        const myTeam = myRoleDef?.team ?? "iyi";
        const won = myTeam === state.winner;
        setTimeout(() => {
          hapticNotification(
            won
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Error,
          );
        }, 400);
      }
    }
    if (
      (prev === "NIGHT" || prev === "NIGHT_ROLE") &&
      next === "DAY" &&
      state.privateMessages.length > 0
    ) {
      const newMsgs = state.privateMessages.filter((m) => m.ts > lastSeenTsRef.current);
      lastSeenTsRef.current = Math.max(...state.privateMessages.map((m) => m.ts));
      if (newMsgs.length > 0) {
        setNightResultMessages(newMsgs);
      }
    }
    lastPhaseRef.current = next;
  }, [state?.phase, myPlayerId]);

  // Detect new private messages that arrive during NIGHT_ROLE (immediate results for Bekçi/Falcı)
  useEffect(() => {
    if (!state || state.phase !== "NIGHT_ROLE" || !myPlayerId) return;
    if (state.privateMessages.length === 0) return;
    const newMsgs = state.privateMessages.filter((m) => m.ts > lastSeenTsRef.current);
    if (newMsgs.length > 0) {
      lastSeenTsRef.current = Math.max(...state.privateMessages.map((m) => m.ts));
      setNightResultMessages(newMsgs);
    }
  }, [state?.privateMessages, state?.phase, myPlayerId]);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("mahalle:nickname"),
      AsyncStorage.getItem("mahalle:vibrationsEnabled"),
      AsyncStorage.getItem("mahalle:voiceMuted"),
      AsyncStorage.getItem("mahalle:bgMusicEnabled"),
      AsyncStorage.getItem("mahalle:bgMusicVolume"),
      AsyncStorage.getItem(BG_MUSIC_VOLUME_SCALE_KEY),
      AsyncStorage.getItem("mahalle:toastsEnabled"),
      AsyncStorage.getItem("mahalle:keepAwake"),
    ])
      .then(([n, vib, mute, bgEnabled, bgVolume, bgVolumeScale, toasts, ka]) => {
        setMyNickname(n ?? "");
        const enabled = vib !== "false";
        initVibrationsEnabled(enabled);
        setVibrationsEnabledState(enabled);
        if (mute === "true") {
          setVoiceMutedState(true);
          setMuted(true);
        }
        setBackgroundMusicEnabledState(bgEnabled !== "false");
        if (bgVolume == null) {
          setBackgroundMusicVolumeState(BG_MUSIC_DEFAULT_VOLUME);
          applyBackgroundMusicVolume(BG_MUSIC_DEFAULT_VOLUME);
          AsyncStorage.setItem("mahalle:bgMusicVolume", String(BG_MUSIC_DEFAULT_VOLUME));
          AsyncStorage.setItem(BG_MUSIC_VOLUME_SCALE_KEY, "v2");
        } else {
          const parsedVolume = Number(bgVolume);
          if (Number.isFinite(parsedVolume)) {
            const migrated =
              bgVolumeScale === "v2" || parsedVolume > BG_MUSIC_LEGACY_MAX_VOLUME
                ? parsedVolume
                : (parsedVolume / BG_MUSIC_LEGACY_MAX_VOLUME) * BG_MUSIC_DEFAULT_VOLUME;
            const clamped = Math.max(0, Math.min(BG_MUSIC_MAX_VOLUME, migrated));
            setBackgroundMusicVolumeState(clamped);
            applyBackgroundMusicVolume(clamped);
            AsyncStorage.setItem("mahalle:bgMusicVolume", String(clamped));
            AsyncStorage.setItem(BG_MUSIC_VOLUME_SCALE_KEY, "v2");
          } else {
            setBackgroundMusicVolumeState(BG_MUSIC_DEFAULT_VOLUME);
            applyBackgroundMusicVolume(BG_MUSIC_DEFAULT_VOLUME);
            AsyncStorage.setItem("mahalle:bgMusicVolume", String(BG_MUSIC_DEFAULT_VOLUME));
            AsyncStorage.setItem(BG_MUSIC_VOLUME_SCALE_KEY, "v2");
          }
        }
        setToastsEnabledState(toasts !== "false");
        setKeepAwakeState(ka === "true");
        setPrefsLoaded(true);
      })
      .catch(() => {
        initVibrationsEnabled(true);
        setPrefsLoaded(true);
      });
    AsyncStorage.getItem("mahalle:voiceMuted")
      .then((v) => {
        const muted = v === "true";
        initMuted(muted);
        setVoiceMutedState(muted);
      })
      .catch(() => {
        initMuted(false);
      });
  }, []);

  useEffect(() => {
    if (!state || state.phase === "LOBBY" || state.phase === "ENDED") {
      setSpectatorKeepAwake(null);
      setShowSpectatorPrompt(false);
      wasAliveRef.current = null;
    }
  }, [state?.phase, state]);

  const keepAwakeActiveRef = useRef(false);
  useEffect(() => {
    const isActivePhase =
      state?.phase !== undefined &&
      state.phase !== "LOBBY" &&
      state.phase !== "ENDED";
    const me = state?.players.find((p) => p.id === myPlayerId);
    const isAlive = me?.isAlive ?? true;
    const isHost = me?.isHost ?? false;
    const isParticipating = isAlive || isHost;
    const isSpectating = !isAlive && !isHost;
    const shouldKeepAwake =
      isActivePhase &&
      ((keepAwake && isParticipating) || (isSpectating && spectatorKeepAwake === true));
    if (shouldKeepAwake) {
      activateKeepAwakeAsync();
      keepAwakeActiveRef.current = true;
    } else if (keepAwakeActiveRef.current) {
      deactivateKeepAwake();
      keepAwakeActiveRef.current = false;
    }
  }, [keepAwake, spectatorKeepAwake, state?.phase, state?.players, myPlayerId]);

  useEffect(() => {
    if (myNickname === null) return;
    AsyncStorage.setItem("mahalle:nickname", myNickname);
  }, [myNickname]);

  useEffect(() => {
    if (!prefsLoaded) return;
    const s = io(SOCKET_URL, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    s.on("connect", () => {
      setConnected(true);
    });
    s.on("disconnect", (reason: string) => {
      setConnected(false);
      if (reason !== "io client disconnect") {
        setSystemToast({ message: "Bağlantı kesildi, yeniden bağlanılıyor...", id: Date.now(), icon: "wifi-off" });
      }
    });
    s.on("connect_error", () => {
      setSystemToast({ message: "Sunucuya bağlanılamıyor", id: Date.now(), icon: "alert-circle" });
    });
    s.io.on("reconnect", () => {
      setSystemToast({ message: "Bağlantı yeniden kuruldu", id: Date.now(), icon: "wifi" });
    });
    s.io.on("reconnect_failed", () => {
      setSystemToast({ message: "Bağlantı kurulamadı. Uygulamayı yeniden başlat.", id: Date.now(), icon: "alert-circle" });
    });
    s.on("state", (st: GameState) => {
      setState(st);
      AsyncStorage.setItem(LAST_ROOM_CODE_KEY, st.code).catch(() => {});
    });
    s.on("voice", (lines: string[]) => {
      for (const line of lines) speak(line);
      if (lines.length > 0) {
        setSystemToast({ message: "Anlatım başladı", id: Date.now(), icon: "volume-2" });
      }
    });
    s.on("kicked", (payload?: { reason?: string }) => {
      setState(null);
      myPlayerIdRef.current = null;
      setMyPlayerId(null);
      autoJoinTriedRef.current = true;
      AsyncStorage.removeItem(LAST_ROOM_CODE_KEY).catch(() => {});
      if (payload?.reason) {
        setSystemToast({ message: payload.reason, id: Date.now(), icon: "log-out" });
      }
      setHostJustReceived(false);
      if (hostNotifyTimerRef.current) {
        clearTimeout(hostNotifyTimerRef.current);
        hostNotifyTimerRef.current = null;
      }
    });
    s.on("hostTransferred", ({ newHostId, message }: { newHostId: string; nickname: string; message: string }) => {
      setSystemToast({ message, id: Date.now() });
      if (newHostId && myPlayerIdRef.current === newHostId) {
        setHostJustReceived(true);
        if (hostNotifyTimerRef.current) clearTimeout(hostNotifyTimerRef.current);
        hostNotifyTimerRef.current = setTimeout(() => {
          setSystemToast({
            message: "Sen artık oyun yöneticisisin! 👑",
            id: Date.now(),
            onPress: () => setOpenHostPanelTrigger((n) => n + 1),
          });
          hostNotifyTimerRef.current = null;
        }, 4500);
      }
    });
    s.on("host_restored", (_payload: { nightStepIndex: number }) => {
      setHostJustReceived(true);
      setSystemToast({
        message: "Yönetici olarak geri döndün 👑",
        id: Date.now(),
        onPress: () => setOpenHostPanelTrigger((n) => n + 1),
      });
    });
    s.on("host_transferred_away", ({ message }: { message: string }) => {
      setSystemToast({ message, id: Date.now() });
    });
    setSocket(s);
    return () => {
      s.disconnect();
      if (hostNotifyTimerRef.current) {
        clearTimeout(hostNotifyTimerRef.current);
        hostNotifyTimerRef.current = null;
      }
    };
  }, [prefsLoaded]);

  useEffect(() => {
    if (!prefsLoaded || !connected || !socket) return;
    if (state) return;
    if (autoJoinTriedRef.current) return;
    if (!myNickname || !myNickname.trim()) return;
    autoJoinTriedRef.current = true;
    AsyncStorage.getItem(LAST_ROOM_CODE_KEY)
      .then((roomCode) => {
        if (!roomCode) return;
        socket.emit(
          "joinRoom",
          { code: roomCode.trim().toUpperCase(), nickname: myNickname.trim() },
          (res: any) => {
            if (res?.ok && res.playerId) {
              myPlayerIdRef.current = res.playerId;
              setMyPlayerId(res.playerId);
              setSystemToast({
                message: `Oyuna geri bağlandın (${roomCode.toUpperCase()})`,
                id: Date.now(),
                icon: "refresh-cw",
              });
            } else {
              AsyncStorage.removeItem(LAST_ROOM_CODE_KEY).catch(() => {});
            }
          },
        );
      })
      .catch(() => {});
  }, [prefsLoaded, connected, socket, state, myNickname]);

  const emit = useCallback(
    (event: string, payload: any = {}) =>
      new Promise<{ ok: boolean; error?: string }>((resolve) => {
        if (!socket) return resolve({ ok: false, error: "Bağlı değil" });
        socket.emit(event, payload, (res: any) => {
          resolve(res ?? { ok: true });
        });
      }),
    [socket],
  );

  const setMyPlayerIdAndRef = useCallback((id: string | null) => {
    myPlayerIdRef.current = id;
    setMyPlayerId(id);
  }, []);

  const createRoom = useCallback(
    async (nickname: string) => {
      const res = await emit("createRoom", { nickname });
      if (res.ok && (res as any).playerId) {
        setMyPlayerIdAndRef((res as any).playerId);
        const code = (res as any).code;
        if (code) await AsyncStorage.setItem(LAST_ROOM_CODE_KEY, String(code).toUpperCase());
      }
      return res;
    },
    [emit, setMyPlayerIdAndRef],
  );

  const joinRoom = useCallback(
    async (code: string, nickname: string) => {
      const res = await emit("joinRoom", {
        code: code.trim().toUpperCase(),
        nickname,
      });
      if (res.ok && (res as any).playerId) {
        setMyPlayerIdAndRef((res as any).playerId);
        await AsyncStorage.setItem(LAST_ROOM_CODE_KEY, code.trim().toUpperCase());
      }
      return res;
    },
    [emit, setMyPlayerIdAndRef],
  );

  const leave = useCallback(async () => {
    await AsyncStorage.removeItem(LAST_ROOM_CODE_KEY);
    setState(null);
    setMyPlayerIdAndRef(null);
    autoJoinTriedRef.current = true;
    setHostJustReceived(false);
    if (hostNotifyTimerRef.current) {
      clearTimeout(hostNotifyTimerRef.current);
      hostNotifyTimerRef.current = null;
    }
    if (socket) {
      await new Promise<void>((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          resolve();
        };
        const t = setTimeout(finish, 1200);
        socket.emit("quitRoom", {}, () => {
          clearTimeout(t);
          finish();
        });
      });
      socket.disconnect();
      socket.connect();
    }
  }, [socket]);

  const isMidGame = useCallback(() => {
    const phase = stateRef.current?.phase;
    return phase !== undefined && phase !== "LOBBY" && phase !== "ENDED";
  }, []);

  const toggleVoice = useCallback(async () => {
    const speaking = await isSpeakingAsync();
    setVoiceMutedState((v) => {
      const next = !v;
      setMuted(next);
      AsyncStorage.setItem("mahalle:voiceMuted", String(next));
      if (isMidGame()) {
        if (next && speaking) {
          setSystemToast({ message: "Anlatım kesildi", id: Date.now(), icon: "volume-x", alwaysShow: true });
        } else {
          setSystemToast({
            message: next ? "Ses Anlatımı kapatıldı" : "Ses Anlatımı açıldı",
            id: Date.now(),
            icon: next ? "volume-x" : "volume-2",
            alwaysShow: true,
          });
        }
      }
      return next;
    });
  }, [isMidGame]);

  const toggleBackgroundMusic = useCallback(() => {
    setBackgroundMusicEnabledState((prev) => {
      const next = !prev;
      AsyncStorage.setItem("mahalle:bgMusicEnabled", String(next));
      if (isMidGame()) {
        setSystemToast({
          message: next ? "Arka Plan Müziği açıldı" : "Arka Plan Müziği kapatıldı",
          id: Date.now(),
          icon: next ? "music" : "volume-x",
          alwaysShow: true,
        });
      }
      return next;
    });
  }, [isMidGame]);

  const setBackgroundMusicVolume = useCallback((value: number) => {
    const next = Math.max(0, Math.min(BG_MUSIC_MAX_VOLUME, value));
    setBackgroundMusicVolumeState(next);
    applyBackgroundMusicVolume(next);
    AsyncStorage.setItem("mahalle:bgMusicVolume", String(next));
  }, []);

  const toggleVibrations = useCallback(() => {
    setVibrationsEnabledState((prev) => {
      const next = !prev;
      setVibrationsEnabled(next);
      AsyncStorage.setItem("mahalle:vibrationsEnabled", String(next));
      if (isMidGame()) {
        setSystemToast({
          message: next ? "Titreşim açıldı" : "Titreşim kapatıldı",
          id: Date.now(),
          icon: "smartphone",
          alwaysShow: true,
        });
      }
      return next;
    });
  }, [isMidGame]);

  const toggleToasts = useCallback(() => {
    setToastsEnabledState((prev) => {
      const next = !prev;
      AsyncStorage.setItem("mahalle:toastsEnabled", String(next));
      if (isMidGame()) {
        setSystemToast({
          message: next ? "Oyun Bildirimleri açıldı" : "Oyun Bildirimleri kapatıldı",
          id: Date.now(),
          icon: next ? "bell" : "bell-off",
          alwaysShow: true,
        });
      }
      return next;
    });
  }, [isMidGame]);

  const toggleKeepAwake = useCallback(() => {
    setKeepAwakeState((prev) => {
      const next = !prev;
      AsyncStorage.setItem("mahalle:keepAwake", String(next));
      if (isMidGame()) {
        setSystemToast({
          message: next ? "Ekranı Açık Tut açıldı" : "Ekranı Açık Tut kapatıldı",
          id: Date.now(),
          icon: "sun",
          alwaysShow: true,
        });
      }
      return next;
    });
  }, [isMidGame]);

  const dismissToast = useCallback(() => {
    setSystemToast(null);
  }, []);

  const clearHostJustReceived = useCallback(() => {
    setHostJustReceived(false);
  }, []);

  const clearNightResult = useCallback(() => {
    setNightResultMessages([]);
  }, []);

  const value = useMemo<GameCtx>(
    () => ({
      socket,
      connected,
      state,
      myPlayerId,
      myNickname,
      setNickname: setMyNickname,
      createRoom,
      joinRoom,
      emit,
      leave,
      voiceMuted,
      toggleVoice,
      backgroundMusicEnabled,
      toggleBackgroundMusic,
      backgroundMusicVolume,
      setBackgroundMusicVolume,
      vibrationsEnabled,
      toggleVibrations,
      toastsEnabled,
      toggleToasts,
      keepAwake,
      toggleKeepAwake,
      systemToast: systemToast?.alwaysShow ? systemToast : (toastsEnabled ? systemToast : null),
      dismissToast,
      hostJustReceived,
      clearHostJustReceived,
      openHostPanelTrigger,
      nightResultMessages,
      clearNightResult,
    }),
    [
      socket,
      connected,
      state,
      myPlayerId,
      myNickname,
      createRoom,
      joinRoom,
      emit,
      leave,
      voiceMuted,
      toggleVoice,
      backgroundMusicEnabled,
      toggleBackgroundMusic,
      backgroundMusicVolume,
      setBackgroundMusicVolume,
      vibrationsEnabled,
      toggleVibrations,
      toastsEnabled,
      toggleToasts,
      keepAwake,
      toggleKeepAwake,
      systemToast,
      dismissToast,
      hostJustReceived,
      clearHostJustReceived,
      openHostPanelTrigger,
      nightResultMessages,
      clearNightResult,
    ],
  );

  function handleSpectatorPromptChoice(keepAwakeWhileSpectating: boolean) {
    setSpectatorKeepAwake(keepAwakeWhileSpectating);
    setShowSpectatorPrompt(false);
  }

  return (
    <Ctx.Provider value={value}>
      {children}
      <Modal
        visible={showSpectatorPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => handleSpectatorPromptChoice(false)}
      >
        <View style={promptStyles.overlay}>
          <View style={[promptStyles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[promptStyles.title, { color: c.foreground }]}>
              Elendikten Sonra Ekran
            </Text>
            <Text style={[promptStyles.body, { color: c.mutedForeground }]}>
              Oyunu izlerken ekranın açık kalmasını ister misin?
            </Text>
            <View style={promptStyles.buttons}>
              <Pressable
                style={[promptStyles.btn, { backgroundColor: c.primary }]}
                onPress={() => {
                  haptic(Haptics.ImpactFeedbackStyle.Light);
                  handleSpectatorPromptChoice(true);
                }}
              >
                <Text style={[promptStyles.btnText, { color: c.primaryForeground }]}>
                  Evet, açık kalsın
                </Text>
              </Pressable>
              <Pressable
                style={[promptStyles.btn, { backgroundColor: "transparent", borderWidth: 1, borderColor: c.border }]}
                onPress={() => {
                  haptic(Haptics.ImpactFeedbackStyle.Light);
                  handleSpectatorPromptChoice(false);
                }}
              >
                <Text style={[promptStyles.btnText, { color: c.foreground }]}>
                  Hayır, kapansın
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Ctx.Provider>
  );
}

const promptStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    textAlign: "center",
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  buttons: {
    marginTop: 8,
    gap: 10,
  },
  btn: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  btnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
