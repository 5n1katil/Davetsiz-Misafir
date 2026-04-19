import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "node:http";
import { logger } from "../lib/logger.js";
import {
  advanceFromNightIntro,
  castVote,
  chooseRole,
  consumeVoiceQueue,
  createRoom,
  endDayEarly,
  getRoom,
  joinRoom,
  kickPlayer,
  leaveRoom,
  listRooms,
  pauseGame,
  proposeVote,
  publicView,
  restartGame,
  resumeGame,
  sendGraveyardChat,
  setReady,
  startGame,
  submitNightAction,
  tickPhaseTimeout,
  tickRoleSelectTimeout,
  transferHost,
  updateSettings,
} from "./gameEngine.js";

interface Session {
  playerId: string;
  roomCode: string;
}

export function attachSocketServer(http: HTTPServer) {
  const io = new IOServer(http, {
    path: "/api/socket.io",
    cors: { origin: "*" },
    transports: ["websocket", "polling"],
  });

  const sessions = new Map<string, Session>();

  function broadcast(code: string) {
    const room = getRoom(code);
    if (!room) return;
    for (const p of room.players) {
      if (!p.socketId) continue;
      const view = publicView(room, p.id);
      io.to(p.socketId).emit("state", view);
    }
    // Voice queue → host only
    const host = room.players.find((p) => p.id === room.hostId);
    const voice = consumeVoiceQueue(code);
    if (host?.socketId && voice.length > 0) {
      io.to(host.socketId).emit("voice", voice);
    }
  }

  // Tick loop
  setInterval(() => {
    for (const room of listRooms()) {
      const r1 = tickRoleSelectTimeout(room.code);
      const r2 = tickPhaseTimeout(room.code);
      if (r1 || r2) broadcast(room.code);
    }
  }, 500);

  io.on("connection", (socket) => {
    logger.info({ id: socket.id }, "socket connected");

    socket.on("createRoom", ({ nickname }, cb) => {
      try {
        const room = createRoom(socket.id, String(nickname).slice(0, 20));
        sessions.set(socket.id, { playerId: room.hostId, roomCode: room.code });
        socket.join(room.code);
        cb?.({ ok: true, code: room.code, playerId: room.hostId });
        broadcast(room.code);
      } catch (e: any) {
        cb?.({ ok: false, error: e?.message ?? "hata" });
      }
    });

    socket.on("joinRoom", ({ code, nickname }, cb) => {
      const res = joinRoom(
        String(code).toUpperCase(),
        socket.id,
        String(nickname).slice(0, 20),
      );
      if ("error" in res) {
        cb?.({ ok: false, error: res.error });
        return;
      }
      sessions.set(socket.id, {
        playerId: res.player.id,
        roomCode: res.room.code,
      });
      socket.join(res.room.code);
      cb?.({ ok: true, code: res.room.code, playerId: res.player.id });
      broadcast(res.room.code);
    });

    socket.on("updateSettings", ({ patch }, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = updateSettings(s.roomCode, s.playerId, patch);
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("startGame", (_p, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = startGame(s.roomCode, s.playerId);
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("chooseRole", ({ roleId }, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = chooseRole(s.roomCode, s.playerId, roleId);
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("setReady", (_p, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = setReady(s.roomCode, s.playerId);
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("proposeVote", (_p, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = proposeVote(s.roomCode, s.playerId);
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("endDayEarly", (_p, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = endDayEarly(s.roomCode, s.playerId);
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("castVote", ({ targetId }, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = castVote(s.roomCode, s.playerId, targetId);
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("startNight", (_p, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = advanceFromNightIntro(s.roomCode);
      if (!res) return cb?.({ ok: false, error: "geçersiz" });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("nightAction", ({ targetId }, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = submitNightAction(s.roomCode, s.playerId, targetId);
      if (typeof res === "object" && "error" in res)
        return cb?.({ ok: false, error: res.error });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("graveyardChat", ({ text }, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = sendGraveyardChat(s.roomCode, s.playerId, String(text));
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("restartGame", (_p, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = restartGame(s.roomCode, s.playerId);
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("pauseGame", (_p, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = pauseGame(s.roomCode, s.playerId);
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("resumeGame", (_p, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = resumeGame(s.roomCode, s.playerId);
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("transferHost", ({ newHostId }, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = transferHost(s.roomCode, s.playerId, String(newHostId));
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("kickPlayer", ({ targetId }, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = kickPlayer(s.roomCode, s.playerId, String(targetId));
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      // Find, notify, and forcibly disconnect the kicked player
      const target = [...sessions.entries()].find(
        ([, v]) => v.roomCode === s.roomCode && v.playerId === targetId,
      );
      if (target) {
        const [kickedSocketId] = target;
        // Remove session immediately so future events are rejected
        sessions.delete(kickedSocketId);
        // Notify client then close connection
        io.to(kickedSocketId).emit("kicked", { reason: "Host sizi odadan çıkardı." });
        setTimeout(() => {
          const kickedSock = io.sockets.sockets.get(kickedSocketId);
          if (kickedSock) kickedSock.disconnect(true);
        }, 300);
      }
      cb?.({ ok: true });
      broadcast(s.roomCode);
    });

    socket.on("disconnect", () => {
      const s = sessions.get(socket.id);
      sessions.delete(socket.id);
      const room = leaveRoom(socket.id);
      if (room) broadcast(room.code);
      else if (s) {
        // room may still exist
        broadcast(s.roomCode);
      }
    });
  });

  return io;
}
