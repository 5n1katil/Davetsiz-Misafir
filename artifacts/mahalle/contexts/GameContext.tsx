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
import { io, Socket } from "socket.io-client";

import { ROLE_DEFS } from "@/constants/roles";
import { speak, setMuted, initMuted, isSpeakingAsync } from "@/lib/speech";
import { haptic, hapticNotification, initVibrationsEnabled, setVibrationsEnabled } from "@/lib/haptics";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
const SOCKET_URL = DOMAIN ? `https://${DOMAIN}` : "http://localhost";

export interface PlayerView {
  id: string;
  nickname: string;
  isHost: boolean;
  isAlive: boolean;
  isConnected: boolean;
  isReady: boolean;
  hasSelectedRole: boolean;
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
  morningEvents: { kind: string; message: string; victims?: string[] }[];
  graveyard: {
    playerId: string;
    nickname: string;
    roleId: string;
    cause: string;
  }[];
  graveyardChat: { from: string; nick: string; text: string; ts: number }[];
  winner: string | null;
  winnerLabel: string | null;
  voteCount: number;
  voteOpenBy: number;
  privateMessages: { msg: string; ts: number }[];
  ceteMembers: { id: string; nickname: string; roleId: string | null }[];
  paused: boolean;
}

export interface SystemToast {
  message: string;
  id: number;
  icon?: string;
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
  leave: () => void;
  voiceMuted: boolean;
  toggleVoice: () => void;
  vibrationsEnabled: boolean;
  toggleVibrations: () => void;
  toastsEnabled: boolean;
  toggleToasts: () => void;
  keepAwake: boolean;
  toggleKeepAwake: () => void;
  systemToast: SystemToast | null;
  dismissToast: () => void;
}

const Ctx = createContext<GameCtx | null>(null);

export function useGame() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGame must be used inside GameProvider");
  return v;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [myNickname, setMyNickname] = useState<string | null>(null);
  const [voiceMuted, setVoiceMutedState] = useState(false);
  const [vibrationsEnabled, setVibrationsEnabledState] = useState(true);
  const [toastsEnabled, setToastsEnabledState] = useState(true);
  const [keepAwake, setKeepAwakeState] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [systemToast, setSystemToast] = useState<SystemToast | null>(null);
  const lastPhaseRef = useRef<string | null>(null);
  const wasAliveRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!state || !myPlayerId) return;
    const me = state.players.find((p) => p.id === myPlayerId);
    const isAlive = me?.isAlive ?? true;
    if (wasAliveRef.current === true && !isAlive) {
      haptic(Haptics.ImpactFeedbackStyle.Heavy);
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
        const myRoleId = state.myRole ?? myGraveEntry?.roleId ?? "koylu";
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
    lastPhaseRef.current = next;
  }, [state?.phase, myPlayerId]);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("mahalle:nickname"),
      AsyncStorage.getItem("mahalle:vibrationsEnabled"),
      AsyncStorage.getItem("mahalle:voiceMuted"),
      AsyncStorage.getItem("mahalle:toastsEnabled"),
      AsyncStorage.getItem("mahalle:keepAwake"),
    ])
      .then(([n, vib, mute, toasts, ka]) => {
        setMyNickname(n ?? "");
        const enabled = vib !== "false";
        initVibrationsEnabled(enabled);
        setVibrationsEnabledState(enabled);
        if (mute === "true") {
          setVoiceMutedState(true);
          setMuted(true);
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

  const keepAwakeActiveRef = useRef(false);
  useEffect(() => {
    const isActivePhase =
      state?.phase !== undefined &&
      state.phase !== "LOBBY" &&
      state.phase !== "ENDED";
    const me = state?.players.find((p) => p.id === myPlayerId);
    const isParticipating = me ? me.isAlive || me.isHost : true;
    if (keepAwake && isActivePhase && isParticipating) {
      activateKeepAwakeAsync();
      keepAwakeActiveRef.current = true;
    } else if (keepAwakeActiveRef.current) {
      deactivateKeepAwake();
      keepAwakeActiveRef.current = false;
    }
  }, [keepAwake, state?.phase, state?.players, myPlayerId]);

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
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("state", (st: GameState) => {
      setState(st);
    });
    s.on("voice", (lines: string[]) => {
      for (const line of lines) speak(line);
      if (lines.length > 0) {
        setSystemToast({ message: "Anlatım başladı", id: Date.now(), icon: "volume-2" });
      }
    });
    s.on("kicked", () => {
      setState(null);
      setMyPlayerId(null);
    });
    s.on("hostTransferred", ({ message }: { nickname: string; message: string }) => {
      setSystemToast({ message, id: Date.now() });
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [prefsLoaded]);

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

  const createRoom = useCallback(
    async (nickname: string) => {
      const res = await emit("createRoom", { nickname });
      if (res.ok && (res as any).playerId) setMyPlayerId((res as any).playerId);
      return res;
    },
    [emit],
  );

  const joinRoom = useCallback(
    async (code: string, nickname: string) => {
      const res = await emit("joinRoom", {
        code: code.trim().toUpperCase(),
        nickname,
      });
      if (res.ok && (res as any).playerId) setMyPlayerId((res as any).playerId);
      return res;
    },
    [emit],
  );

  const leave = useCallback(() => {
    setState(null);
    setMyPlayerId(null);
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  }, [socket]);

  const toggleVoice = useCallback(async () => {
    const speaking = await isSpeakingAsync();
    setVoiceMutedState((v) => {
      const next = !v;
      setMuted(next);
      AsyncStorage.setItem("mahalle:voiceMuted", String(next));
      if (next && speaking) {
        setSystemToast({ message: "Anlatım kesildi", id: Date.now(), icon: "volume-x" });
      } else {
        setSystemToast({
          message: next ? "Ses kapatıldı" : "Ses açıldı",
          id: Date.now(),
          icon: next ? "volume-x" : "volume-2",
        });
      }
      return next;
    });
  }, []);

  const toggleVibrations = useCallback(() => {
    setVibrationsEnabledState((prev) => {
      const next = !prev;
      setVibrationsEnabled(next);
      AsyncStorage.setItem("mahalle:vibrationsEnabled", String(next));
      setSystemToast({
        message: next ? "Titreşim açıldı" : "Titreşim kapatıldı",
        id: Date.now(),
        icon: "smartphone",
      });
      return next;
    });
  }, []);

  const toggleToasts = useCallback(() => {
    setToastsEnabledState((prev) => {
      const next = !prev;
      AsyncStorage.setItem("mahalle:toastsEnabled", String(next));
      return next;
    });
  }, []);

  const toggleKeepAwake = useCallback(() => {
    setKeepAwakeState((prev) => {
      const next = !prev;
      AsyncStorage.setItem("mahalle:keepAwake", String(next));
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => {
    setSystemToast(null);
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
      vibrationsEnabled,
      toggleVibrations,
      toastsEnabled,
      toggleToasts,
      keepAwake,
      toggleKeepAwake,
      systemToast: toastsEnabled ? systemToast : null,
      dismissToast,
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
      vibrationsEnabled,
      toggleVibrations,
      toastsEnabled,
      toggleToasts,
      keepAwake,
      toggleKeepAwake,
      systemToast,
      dismissToast,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
