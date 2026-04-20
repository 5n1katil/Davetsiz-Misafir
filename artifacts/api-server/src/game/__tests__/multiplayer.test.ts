import { createServer } from "node:http";
import { io as ioClient, Socket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { attachSocketServer } from "../socket.js";

function waitFor(socket: Socket, event: string, timeoutMs = 4000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for '${event}'`)), timeoutMs);
    socket.once(event, (data: any) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function waitForPhase(socket: Socket, phase: string, timeoutMs = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for phase '${phase}'`)), timeoutMs);
    const handler = (data: any) => {
      if (data.phase === phase) {
        clearTimeout(timer);
        socket.off("state", handler);
        resolve(data);
      }
    };
    socket.on("state", handler);
  });
}

function emitAck(socket: Socket, event: string, payload: any = {}): Promise<any> {
  return new Promise((resolve) => socket.emit(event, payload, resolve));
}

describe("Multiplayer socket akışı", () => {
  let port: number;
  let cleanups: Array<() => void> = [];

  beforeEach(async () => {
    const httpServer = createServer();
    attachSocketServer(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    port = (httpServer.address() as any).port;
    cleanups.push(() => { httpServer.close(); });
  });

  afterEach(async () => {
    for (const fn of cleanups.reverse()) fn();
    cleanups = [];
  });

  function connect(): Socket {
    const s = ioClient(`http://localhost:${port}`, {
      path: "/api/socket.io",
      transports: ["websocket"],
      autoConnect: true,
    });
    cleanups.push(() => { if (s.connected) s.disconnect(); });
    return s;
  }

  it("Host oda kurar, guest katılır, ikisi lobide görünür", async () => {
    const host = connect();
    await waitFor(host, "connect");

    const firstStateP = waitFor(host, "state");
    const createRes = await emitAck(host, "createRoom", { nickname: "Host" });
    expect(createRes.ok).toBe(true);
    const { code } = createRes;

    const hostState = await firstStateP;
    expect(hostState.players).toHaveLength(1);

    const guest = connect();
    await waitFor(guest, "connect");

    const guestStateP = waitFor(guest, "state");
    const joinRes = await emitAck(guest, "joinRoom", { code, nickname: "Misafir" });
    expect(joinRes.ok).toBe(true);

    const guestState = await guestStateP;
    const nicknames = guestState.players.map((p: any) => p.nickname);
    expect(nicknames).toContain("Host");
    expect(nicknames).toContain("Misafir");
  });

  it("Host disconnect → guest geçici host olur", async () => {
    const host = connect();
    await waitFor(host, "connect");

    const firstStateP = waitFor(host, "state");
    const createRes = await emitAck(host, "createRoom", { nickname: "Host" });
    const { code } = createRes;
    await firstStateP;

    const guest = connect();
    await waitFor(guest, "connect");
    const guestStateP = waitFor(guest, "state");
    await emitAck(guest, "joinRoom", { code, nickname: "Misafir" });
    await guestStateP;

    const hostChangedP = waitFor(guest, "state", 5000);
    host.disconnect();

    const newState = await hostChangedP;
    const guestPlayer = newState.players.find((p: any) => p.nickname === "Misafir");
    expect(guestPlayer?.isHost).toBe(true);
  });

  it("Aynı nick ile yeniden katılan oyuncu odada bulunur", async () => {
    const host = connect();
    await waitFor(host, "connect");

    const firstStateP = waitFor(host, "state");
    const createRes = await emitAck(host, "createRoom", { nickname: "AliAbi" });
    const { code } = createRes;
    await firstStateP;

    // Add a second player so room stays alive after host disconnects
    const keeper = connect();
    await waitFor(keeper, "connect");
    const kStateP = waitFor(keeper, "state");
    await emitAck(keeper, "joinRoom", { code, nickname: "KepçeKorucu" });
    await kStateP;

    host.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    const reconnected = connect();
    await waitFor(reconnected, "connect");
    const rStateP = waitFor(reconnected, "state");
    const rejoinRes = await emitAck(reconnected, "joinRoom", { code, nickname: "AliAbi" });
    expect(rejoinRes.ok).toBe(true);

    const finalState = await rStateP;
    const player = finalState.players.find((p: any) => p.nickname === "AliAbi");
    expect(player).toBeDefined();
    expect(finalState.players).toHaveLength(2);
  });

  it("4 oyuncuyla oyun başlatılır ve ROLE_SELECT fazına geçilir", async () => {
    let roomCode = "";

    const h = connect();
    await waitFor(h, "connect");

    const h1P = waitFor(h, "state");
    const createRes = await emitAck(h, "createRoom", { nickname: "Oyuncu1" });
    expect(createRes.ok).toBe(true);
    roomCode = createRes.code;
    await h1P;

    for (let i = 2; i <= 4; i++) {
      const g = connect();
      await waitFor(g, "connect");
      const gStateP = waitFor(g, "state");
      const res = await emitAck(g, "joinRoom", { code: roomCode, nickname: `Oyuncu${i}` });
      expect(res.ok).toBe(true);
      await gStateP;
    }

    // Register persistent listener for ROLE_SELECT before emitting startGame
    const roleSelectP = waitForPhase(h, "ROLE_SELECT");
    const startRes = await emitAck(h, "startGame", {});
    expect(startRes.ok).toBe(true);

    const gameState = await roleSelectP;
    expect(gameState.phase).toBe("ROLE_SELECT");
    expect(gameState.players).toHaveLength(4);
  });

  it("Tanımsız event → ack ile hata döner (sunucu çökmez)", async () => {
    const s = connect();
    await waitFor(s, "connect");

    const res = await emitAck(s, "joinRoom", { code: "ZZZZZZ", nickname: "Test" });
    expect(res.ok).toBe(false);
    expect(res.error).toBeDefined();
  });
});
