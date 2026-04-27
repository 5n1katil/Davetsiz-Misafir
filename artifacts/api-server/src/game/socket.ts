import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "node:http";
import { logger } from "../lib/logger.js";
import {
  advanceFromNightIntro,
  castVote,
  chooseRole,
  consumeVoiceQueue,
  createRoom,
  deleteRoom,
  endDayEarly,
  getRoom,
  joinRoom,
  kickPlayer,
  leaveRoom,
  quitRoomByPlayer,
  listRooms,
  pauseGame,
  proposeVote,
  publicView,
  restartGame,
  resumeGame,
  sendGraveyardChat,
  setRoleSelectReady,
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

      // Orijinal host geri bağlandıysa yalnızca onun soketine bildirim gönder.
      // ORDERING: broadcast() above already consumes the re-queued voice prompt
      // and delivers it to the restored host's socket via the "voice" event.
      // host_restored is sent AFTER broadcast so the client's host UI state
      // (hostJustReceived) is set before any subsequent state updates arrive.
      // nightStepIndex is included so the client can defensively verify that
      // TTS was expected for this step and re-request if the voice event was
      // somehow missed (e.g. a race between reconnect and broadcast).
      if (res.hostRestored) {
        // Geçici host'u bilgilendir: asıl yönetici geri döndü
        if (res.tempHostId) {
          const tempHostEntry = [...sessions.entries()].find(
            ([, v]) => v.roomCode === res.room.code && v.playerId === res.tempHostId,
          );
          if (tempHostEntry) {
            io.to(tempHostEntry[0]).emit("host_transferred_away", {
              message: "Asıl yönetici geri döndü, yöneticilik iade edildi.",
            });
          }
        }
        socket.emit("host_restored", {
          nightStepIndex: res.room.nightStepIndex,
        });
      }
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

    socket.on("setRoleSelectReady", (_p, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = setRoleSelectReady(s.roomCode, s.playerId);
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

    socket.on("nightAction", ({ targetId, targetId2 }, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const res = submitNightAction(s.roomCode, s.playerId, targetId, targetId2);
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
      const normalizedNewHostId = String(newHostId);
      const res = transferHost(s.roomCode, s.playerId, normalizedNewHostId);
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      const newHost = res.players.find((p) => p.id === normalizedNewHostId);
      if (newHost) {
        io.to(s.roomCode).emit("hostTransferred", {
          newHostId: normalizedNewHostId,
          nickname: newHost.nickname,
          message: `${newHost.nickname} oyun yöneticisi oldu`,
        });
      }
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

    socket.on("quitRoom", (_p, cb) => {
      const s = sessions.get(socket.id);
      if (!s) return cb?.({ ok: false, error: "session yok" });
      const roomBefore = getRoom(s.roomCode);
      const isHostQuit = roomBefore?.hostId === s.playerId;
      if (isHostQuit) {
        for (const [sid, sess] of sessions.entries()) {
          if (sess.roomCode !== s.roomCode || sid === socket.id) continue;
          io.to(sid).emit("kicked", { reason: "Host odadan çıktı. Oyun kapatıldı." });
        }
      }
      const res = quitRoomByPlayer(s.roomCode, s.playerId);
      if ("error" in res) return cb?.({ ok: false, error: res.error });
      sessions.delete(socket.id);
      socket.leave(s.roomCode);
      cb?.({ ok: true });
      if (res.room) {
        if (res.newHost) {
          io.to(res.room.code).emit("hostTransferred", {
            newHostId: res.newHost.id,
            nickname: res.newHost.nickname,
            message: `${res.newHost.nickname} oyun yöneticisi oldu`,
          });
        }
        broadcast(res.room.code);
      }
    });

    socket.on("disconnect", () => {
      const s = sessions.get(socket.id);
      sessions.delete(socket.id);
      const { room, newHost } = leaveRoom(socket.id);
      if (room) {
        if (newHost) {
          io.to(room.code).emit("hostTransferred", {
            newHostId: newHost.id,
            nickname: newHost.nickname,
            message: `${newHost.nickname} oyun yöneticisi oldu`,
          });
        }
        broadcast(room.code);
      } else if (s) {
        // room may still exist
        broadcast(s.roomCode);
      }
    });
  });

  // ── Hafıza sızıntısı önlemi: saatte bir bayat odaları temizle ──────────
  const ROOM_TTL_MS = (Number(process.env["ROOM_TTL_HOURS"]) || 4) * 60 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const room of listRooms()) {
      const isStale =
        room.phase === "ENDED" ||
        (room.phase === "LOBBY" && room.players.every((p) => !p.isConnected));
      const age = now - (room.createdAt ?? now);
      if (isStale || age > ROOM_TTL_MS) {
        io.to(room.code).disconnectSockets(false);
        deleteRoom(room.code);
        logger.info({ code: room.code, reason: isStale ? "stale" : "ttl" }, "Room cleaned up");
      }
    }
  }, 60 * 60 * 1000);

  return io;
}
