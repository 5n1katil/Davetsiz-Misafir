import { ROLES, buildRolePool, type RoleDef } from "./roles.js";

export type Phase =
  | "LOBBY"
  | "ROLE_SELECT"
  | "ROLE_REVEAL"
  | "DAY"
  | "VOTE"
  | "VOTE_RUNOFF"
  | "NIGHT"
  | "NIGHT_ROLE"
  | "ENDED";

export interface Player {
  id: string;
  socketId: string | null;
  nickname: string;
  isHost: boolean;
  isAlive: boolean;
  isConnected: boolean;
  roleId: string | null;
  isReady: boolean;
  hasSelectedRole: boolean;
}

export interface RoomSettings {
  dayDurationSec: number;
  voiceEnabled: boolean;
  ceteCount: number;
  activeSpecialRoles: string[];
  nightActionDurationSec: number;
}

export interface RoleChoice {
  playerId: string;
  options: string[];
}

export interface VoteRecord {
  voterId: string;
  targetId: string;
}

export interface NightAction {
  actorId: string;
  targetId: string;
  type: string;
}

export interface MorningEvent {
  kind: "death" | "calm" | "sahte_dernek_lynched" | "info";
  message: string;
  victims?: string[];
}

export interface Room {
  code: string;
  hostId: string;
  phase: Phase;
  players: Player[];
  settings: RoomSettings;
  rolePool: string[];
  roleSelectQueue: string[]; // playerId order
  roleSelectIndex: number;
  currentChoice: RoleChoice | null;
  roleSelectDeadline: number | null;
  phaseDeadline: number | null;
  round: number;
  votes: VoteRecord[];
  voteOpenBy: string[]; // playerIds who pressed open vote
  runoffCandidates: string[];
  nightOrderQueue: { roleId: string; actorIds: string[] }[];
  nightStepIndex: number;
  nightActions: NightAction[];
  ceteVotes: Record<string, string>; // actorId -> targetId
  morningEvents: MorningEvent[];
  graveyard: { playerId: string; nickname: string; roleId: string; cause: string }[];
  graveyardChat: { from: string; nick: string; text: string; ts: number }[];
  voiceQueue: string[];
  winner: string | null;
  winnerLabel: string | null;
  paused: boolean;
}

const rooms = new Map<string, Room>();

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function listRooms(): Room[] {
  return [...rooms.values()];
}

function genCode(): string {
  const words = [
    "KAHVE",
    "SIMIT",
    "DEMLIK",
    "MUHTAR",
    "TAVLA",
    "MAHALLE",
    "BEKCI",
    "FALCI",
    "DERNEK",
    "OCAK",
  ];
  for (let i = 0; i < 30; i++) {
    const w = words[Math.floor(Math.random() * words.length)];
    const n = Math.floor(Math.random() * 90 + 10);
    const code = `${w}${n}`;
    if (!rooms.has(code)) return code;
  }
  return `ODA${Date.now().toString().slice(-5)}`;
}

function genPlayerId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function createRoom(socketId: string, nickname: string): Room {
  const code = genCode();
  const hostId = genPlayerId();
  const room: Room = {
    code,
    hostId,
    phase: "LOBBY",
    players: [
      {
        id: hostId,
        socketId,
        nickname,
        isHost: true,
        isAlive: true,
        isConnected: true,
        roleId: null,
        isReady: false,
        hasSelectedRole: false,
      },
    ],
    settings: {
      dayDurationSec: 180,
      voiceEnabled: true,
      ceteCount: 1,
      activeSpecialRoles: ["muhtar", "bekci", "otaci", "falci"],
      nightActionDurationSec: 15,
    },
    rolePool: [],
    roleSelectQueue: [],
    roleSelectIndex: 0,
    currentChoice: null,
    roleSelectDeadline: null,
    phaseDeadline: null,
    round: 0,
    votes: [],
    voteOpenBy: [],
    runoffCandidates: [],
    nightOrderQueue: [],
    nightStepIndex: 0,
    nightActions: [],
    ceteVotes: {},
    morningEvents: [],
    graveyard: [],
    graveyardChat: [],
    voiceQueue: [],
    winner: null,
    winnerLabel: null,
    paused: false,
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(
  code: string,
  socketId: string,
  nickname: string,
): { room: Room; player: Player } | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda bulunamadı" };

  // Reconnect kontrolü: aynı nickname varsa bağlantı yenile
  const existing = room.players.find(
    (p) => p.nickname.toLowerCase() === nickname.toLowerCase(),
  );
  if (existing) {
    existing.socketId = socketId;
    existing.isConnected = true;
    return { room, player: existing };
  }

  if (room.phase !== "LOBBY") return { error: "Oyun başladı, katılamazsın" };
  if (room.players.length >= 30) return { error: "Oda dolu" };

  const player: Player = {
    id: genPlayerId(),
    socketId,
    nickname,
    isHost: false,
    isAlive: true,
    isConnected: true,
    roleId: null,
    isReady: false,
    hasSelectedRole: false,
  };
  room.players.push(player);
  return { room, player };
}

export function leaveRoom(socketId: string): Room | null {
  for (const room of rooms.values()) {
    const p = room.players.find((x) => x.socketId === socketId);
    if (!p) continue;
    if (room.phase === "LOBBY") {
      room.players = room.players.filter((x) => x.id !== p.id);
      if (room.players.length === 0) {
        rooms.delete(room.code);
        return null;
      }
      // Host devri
      if (p.isHost && room.players.length > 0) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
      }
    } else {
      p.isConnected = false;
      p.socketId = null;
    }
    return room;
  }
  return null;
}

export function updateSettings(
  code: string,
  playerId: string,
  patch: Partial<RoomSettings>,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda bulunamadı" };
  if (room.hostId !== playerId) return { error: "Sadece host ayar değiştirir" };
  if (room.phase !== "LOBBY") return { error: "Oyun başladı" };
  room.settings = { ...room.settings, ...patch };
  return room;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function startGame(
  code: string,
  playerId: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda bulunamadı" };
  if (room.hostId !== playerId) return { error: "Sadece host başlatabilir" };
  if (room.players.length < 4) return { error: "En az 4 oyuncu gerek" };

  room.rolePool = shuffle(
    buildRolePool(
      room.players.length,
      room.settings.ceteCount,
      room.settings.activeSpecialRoles,
    ),
  );
  room.roleSelectQueue = shuffle(room.players).map((p) => p.id);
  room.roleSelectIndex = 0;
  room.phase = "ROLE_SELECT";
  startNextRoleChoice(room);
  return room;
}

function startNextRoleChoice(room: Room) {
  if (room.roleSelectIndex >= room.roleSelectQueue.length) {
    room.currentChoice = null;
    room.phase = "ROLE_REVEAL";
    room.phaseDeadline = Date.now() + 60_000;
    return;
  }
  const playerId = room.roleSelectQueue[room.roleSelectIndex];
  const opts = shuffle(room.rolePool).slice(0, Math.min(3, room.rolePool.length));
  room.currentChoice = { playerId, options: opts };
  room.roleSelectDeadline = Date.now() + 25_000;
}

export function chooseRole(
  code: string,
  playerId: string,
  roleIdOrRandom: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  if (room.phase !== "ROLE_SELECT") return { error: "Sıra geçti" };
  if (!room.currentChoice || room.currentChoice.playerId !== playerId)
    return { error: "Sıran değil" };

  let chosen = roleIdOrRandom;
  if (chosen === "__random__") {
    chosen =
      room.currentChoice.options[
        Math.floor(Math.random() * room.currentChoice.options.length)
      ];
  }
  if (!room.currentChoice.options.includes(chosen))
    return { error: "Geçersiz seçim" };

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: "Oyuncu yok" };
  player.roleId = chosen;
  player.hasSelectedRole = true;

  // Pool'dan çıkar
  const idx = room.rolePool.indexOf(chosen);
  if (idx >= 0) room.rolePool.splice(idx, 1);

  room.roleSelectIndex++;
  startNextRoleChoice(room);
  return room;
}

export function tickRoleSelectTimeout(code: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.phase !== "ROLE_SELECT") return null;
  if (!room.currentChoice || !room.roleSelectDeadline) return null;
  if (Date.now() < room.roleSelectDeadline) return null;
  // Otomatik rastgele seç
  const res = chooseRole(code, room.currentChoice.playerId, "__random__");
  if ("error" in res) return null;
  return room;
}

export function setReady(
  code: string,
  playerId: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  if (room.phase !== "ROLE_REVEAL") return { error: "Faz uygun değil" };
  const p = room.players.find((x) => x.id === playerId);
  if (!p) return { error: "Oyuncu yok" };
  p.isReady = true;

  if (room.players.every((x) => x.isReady)) {
    enterDayPhase(room, true);
  }
  return room;
}

function enterDayPhase(room: Room, firstDay: boolean) {
  room.round += 1;
  room.phase = "DAY";
  room.votes = [];
  room.voteOpenBy = [];
  room.phaseDeadline = Date.now() + room.settings.dayDurationSec * 1000;
  if (firstDay) {
    room.morningEvents = [
      {
        kind: "info",
        message:
          "İlk sabah oldu. Mahalleye dikkat — herkes birbirini tartıyor.",
      },
    ];
    room.voiceQueue.push(
      `Mahalle meydanında toplanın. ${Math.round(
        room.settings.dayDurationSec / 60,
      )} dakikanız var. Suçluyu bulun.`,
    );
  }
}

export function proposeVote(
  code: string,
  playerId: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  if (room.phase !== "DAY") return { error: "Faz uygun değil" };
  if (!room.voteOpenBy.includes(playerId)) room.voteOpenBy.push(playerId);
  const alive = room.players.filter((p) => p.isAlive && p.isConnected);
  if (room.voteOpenBy.length >= Math.ceil(alive.length / 2)) {
    openVote(room, alive.map((p) => p.id));
  }
  return room;
}

function openVote(room: Room, candidateIds: string[]) {
  room.phase = "VOTE";
  room.votes = [];
  room.runoffCandidates = candidateIds;
  room.phaseDeadline = Date.now() + 30_000;
  room.voiceQueue.push(
    "Oylama başlıyor. Telefonlarınızdan oyunuzu kullanın. Otuz saniye.",
  );
}

export function castVote(
  code: string,
  voterId: string,
  targetId: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  if (room.phase !== "VOTE" && room.phase !== "VOTE_RUNOFF")
    return { error: "Oylama açık değil" };
  const voter = room.players.find((p) => p.id === voterId);
  if (!voter || !voter.isAlive) return { error: "Oy veremezsin" };
  if (!room.runoffCandidates.includes(targetId))
    return { error: "Hedef geçersiz" };
  // Önceki oyu temizle
  room.votes = room.votes.filter((v) => v.voterId !== voterId);
  room.votes.push({ voterId, targetId });
  return room;
}

export function tickPhaseTimeout(code: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;
  if (!room.phaseDeadline) return null;
  if (Date.now() < room.phaseDeadline) return null;

  if (room.phase === "DAY") {
    const alive = room.players.filter((p) => p.isAlive);
    openVote(room, alive.map((p) => p.id));
    return room;
  }
  if (room.phase === "VOTE") {
    resolveVote(room, false);
    return room;
  }
  if (room.phase === "VOTE_RUNOFF") {
    resolveVote(room, true);
    return room;
  }
  if (room.phase === "ROLE_REVEAL") {
    enterDayPhase(room, true);
    return room;
  }
  if (room.phase === "NIGHT_ROLE") {
    advanceNightStep(room);
    return room;
  }
  return null;
}

function resolveVote(room: Room, isRunoff: boolean) {
  // Oy ağırlığı uygula (Muhtar 1.5)
  const tally: Record<string, number> = {};
  for (const v of room.votes) {
    const voter = room.players.find((p) => p.id === v.voterId);
    if (!voter || !voter.isAlive) continue;
    const role = voter.roleId ? ROLES[voter.roleId] : null;
    const w = role?.voteWeight ?? 1;
    tally[v.targetId] = (tally[v.targetId] ?? 0) + w;
  }
  if (Object.keys(tally).length === 0) {
    room.morningEvents.push({
      kind: "info",
      message: "Kimse oy kullanmadı, kimse elenmedi.",
    });
    startNight(room);
    return;
  }
  const max = Math.max(...Object.values(tally));
  const top = Object.entries(tally)
    .filter(([, c]) => c === max)
    .map(([id]) => id);

  if (top.length === 1) {
    const target = room.players.find((p) => p.id === top[0]);
    if (target) {
      target.isAlive = false;
      const role = target.roleId ? ROLES[target.roleId] : null;
      room.graveyard.push({
        playerId: target.id,
        nickname: target.nickname,
        roleId: target.roleId ?? "?",
        cause: "Linç edildi",
      });
      room.morningEvents.push({
        kind: "info",
        message: `${target.nickname} mahalleden uzaklaştırıldı. Rolü: ${
          role?.name ?? "?"
        }`,
      });
      room.voiceQueue.push(
        `Mahalle kararını verdi. ${target.nickname} uzaklaştırılıyor. Rolü: ${
          role?.name ?? "bilinmiyor"
        }.`,
      );

      if (target.roleId === "sahte_dernek") {
        endGame(room, "kotu", "Sahte Dernek Başkanı linç edildi! Davetsiz Misafir kazandı.");
        return;
      }
    }
    if (checkWin(room)) return;
    startNight(room);
    return;
  }

  // Berabere
  if (!isRunoff) {
    room.phase = "VOTE_RUNOFF";
    room.runoffCandidates = top;
    room.votes = [];
    room.phaseDeadline = Date.now() + 15_000;
    room.voiceQueue.push("Oylar eşit. İkinci tur başlıyor.");
    return;
  }
  room.morningEvents.push({
    kind: "info",
    message: "Oylar yine eşit. Bu sefer kimse elenmedi.",
  });
  room.voiceQueue.push("Oylar yine eşit. Bu sefer kimse elenmedi.");
  startNight(room);
}

function startNight(room: Room) {
  room.phase = "NIGHT";
  room.nightActions = [];
  room.ceteVotes = {};
  room.voiceQueue.push(
    "Mahalle uykuya daldı... Gece çöktü sokaklara. Gözlerinizi kapatın.",
  );
  // Gece sırası: aktif rollere göre kuyruk oluştur
  const queue: { roleId: string; actorIds: string[] }[] = [];

  // Çete (3)
  const ceteAlive = room.players.filter(
    (p) => p.isAlive && p.roleId && ROLES[p.roleId].isMafia,
  );
  if (ceteAlive.length > 0) {
    queue.push({ roleId: "_cete", actorIds: ceteAlive.map((p) => p.id) });
  }

  // Otacı, Bekçi, Falcı sırasıyla
  for (const rid of ["otaci", "bekci", "falci"]) {
    const actors = room.players.filter(
      (p) => p.isAlive && p.roleId === rid,
    );
    if (actors.length > 0) {
      queue.push({ roleId: rid, actorIds: actors.map((a) => a.id) });
    }
  }

  room.nightOrderQueue = queue;
  room.nightStepIndex = 0;
  room.phaseDeadline = Date.now() + 2000; // kısa "gözlerinizi kapatın" animasyonu
}

export function advanceFromNightIntro(code: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.phase !== "NIGHT") return null;
  advanceNightStep(room);
  return room;
}

function advanceNightStep(room: Room) {
  if (room.nightStepIndex >= room.nightOrderQueue.length) {
    resolveMorning(room);
    return;
  }
  const step = room.nightOrderQueue[room.nightStepIndex];
  room.phase = "NIGHT_ROLE";
  room.phaseDeadline =
    Date.now() + room.settings.nightActionDurationSec * 1000;
  if (step.roleId === "_cete") {
    room.voiceQueue.push(ROLES.tefeci_basi.voiceCallTr);
  } else {
    const r = ROLES[step.roleId];
    if (r) room.voiceQueue.push(r.voiceCallTr);
  }
}

export function submitNightAction(
  code: string,
  actorId: string,
  targetId: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  if (room.phase !== "NIGHT_ROLE") return { error: "Şu an aksiyon yok" };
  const actor = room.players.find((p) => p.id === actorId);
  if (!actor || !actor.isAlive || !actor.roleId)
    return { error: "Aksiyon hakkın yok" };
  const step = room.nightOrderQueue[room.nightStepIndex];
  if (!step) return { error: "Faz hatası" };

  if (step.roleId === "_cete") {
    if (!ROLES[actor.roleId].isMafia) return { error: "Çete üyesi değilsin" };
    room.ceteVotes[actorId] = targetId;
    // Tüm çete oy verdi mi?
    if (Object.keys(room.ceteVotes).length >= step.actorIds.length) {
      finishNightStep(room);
    }
    return room;
  }

  if (actor.roleId !== step.roleId) return { error: "Sıran değil" };
  room.nightActions.push({
    actorId,
    targetId,
    type: ROLES[actor.roleId].nightAction ?? "",
  });
  finishNightStep(room);
  return room;
}

function finishNightStep(room: Room) {
  room.nightStepIndex++;
  advanceNightStep(room);
}

function resolveMorning(room: Room) {
  // Çete hedefi
  let ceteTarget: string | null = null;
  if (Object.keys(room.ceteVotes).length > 0) {
    const tally: Record<string, number> = {};
    for (const t of Object.values(room.ceteVotes)) {
      tally[t] = (tally[t] ?? 0) + 1;
    }
    const max = Math.max(...Object.values(tally));
    const top = Object.entries(tally).filter(([, c]) => c === max).map(([id]) => id);
    ceteTarget = top[Math.floor(Math.random() * top.length)];
  }

  // Otacı koruma
  const protectedIds = new Set<string>();
  for (const a of room.nightActions) {
    if (a.type === "koruma") protectedIds.add(a.targetId);
  }

  const morningMsgs: string[] = [];
  const victims: string[] = [];

  if (ceteTarget) {
    if (protectedIds.has(ceteTarget)) {
      morningMsgs.push("Bu sabah mahalle sakindir. Kimse kaybolmamış.");
    } else {
      const v = room.players.find((p) => p.id === ceteTarget);
      if (v) {
        v.isAlive = false;
        const role = v.roleId ? ROLES[v.roleId] : null;
        room.graveyard.push({
          playerId: v.id,
          nickname: v.nickname,
          roleId: v.roleId ?? "?",
          cause: `Çete tarafından öldürüldü (${role?.name ?? "?"})`,
        });
        victims.push(v.nickname);
        morningMsgs.push(`Bu sabah ${v.nickname} kaybolmuş.`);
      }
    }
  } else {
    morningMsgs.push("Bu sabah mahalle sakindir.");
  }

  // Bekçi sorgu sonuçları
  for (const a of room.nightActions) {
    if (a.type === "sorgu_ekip") {
      const target = room.players.find((p) => p.id === a.targetId);
      const actor = room.players.find((p) => p.id === a.actorId);
      if (target && actor) {
        const team = target.roleId ? ROLES[target.roleId].team : "iyi";
        actor.isReady = false; // re-use to indicate has unread info? we'll use a separate channel
        // not stored anywhere; let's add a private message system below
        pushPrivate(room, actor.id, `🔦 Bekçi raporu: ${target.nickname} → ${
          team === "iyi" ? "İYİ EKIP" : "KÖTÜ EKIP (çete)"
        }`);
      }
    }
    if (a.type === "sorgu_rol") {
      const target = room.players.find((p) => p.id === a.targetId);
      const actor = room.players.find((p) => p.id === a.actorId);
      if (target && actor) {
        const role = target.roleId ? ROLES[target.roleId] : null;
        const wrong = Math.random() < 0.2;
        let display: RoleDef | null = role;
        if (wrong) {
          const all = Object.values(ROLES).filter((r) => r.id !== role?.id);
          display = all[Math.floor(Math.random() * all.length)];
        }
        pushPrivate(
          room,
          actor.id,
          `🔮 Falcı vizyonu: ${target.nickname} → ${display?.emoji ?? ""} ${
            display?.name ?? "?"
          }`,
        );
      }
    }
  }

  // Sabah duyurusu
  const mainMsg = morningMsgs.join(" ");
  room.morningEvents = [{ kind: "info", message: mainMsg, victims }];
  room.voiceQueue.push("Mahalle uyanıyor... " + mainMsg);

  if (checkWin(room)) return;
  enterDayPhase(room, false);
}

function pushPrivate(room: Room, _playerId: string, _msg: string) {
  // simplified: events stored in nightActions extra map - we'll use morningEvents with a private channel
  // Implement via a separate map
  if (!privateMessages.has(room.code)) privateMessages.set(room.code, []);
  privateMessages.get(room.code)!.push({ playerId: _playerId, msg: _msg, ts: Date.now() });
}

const privateMessages = new Map<
  string,
  { playerId: string; msg: string; ts: number }[]
>();

export function getPrivateMessagesFor(
  code: string,
  playerId: string,
): { msg: string; ts: number }[] {
  const all = privateMessages.get(code) ?? [];
  return all.filter((m) => m.playerId === playerId);
}

function checkWin(room: Room): boolean {
  const aliveBad = room.players.filter(
    (p) => p.isAlive && p.roleId && ROLES[p.roleId].isMafia,
  ).length;
  const aliveGood = room.players.filter(
    (p) => p.isAlive && p.roleId && !ROLES[p.roleId].isMafia,
  ).length;

  if (aliveBad === 0) {
    endGame(
      room,
      "iyi",
      "Mahalle zafere ulaştı! Tüm karanlık güçler temizlendi.",
    );
    return true;
  }
  if (aliveBad >= aliveGood) {
    endGame(room, "kotu", "Davetsiz Misafir kazandı — Mahalle ele geçirildi.");
    return true;
  }
  return false;
}

function endGame(room: Room, winner: string, label: string) {
  room.phase = "ENDED";
  room.winner = winner;
  room.winnerLabel = label;
  room.phaseDeadline = null;
  room.voiceQueue.push(label);
}

export function sendGraveyardChat(
  code: string,
  playerId: string,
  text: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  const p = room.players.find((x) => x.id === playerId);
  if (!p || p.isAlive) return { error: "Yalnızca ölüler chat kullanır" };
  room.graveyardChat.push({
    from: p.id,
    nick: p.nickname,
    text: text.slice(0, 200),
    ts: Date.now(),
  });
  return room;
}

export function consumeVoiceQueue(code: string): string[] {
  const room = rooms.get(code);
  if (!room) return [];
  const q = [...room.voiceQueue];
  room.voiceQueue = [];
  return q;
}

export function restartGame(
  code: string,
  playerId: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  if (room.hostId !== playerId) return { error: "Sadece host" };
  room.phase = "LOBBY";
  room.round = 0;
  room.players.forEach((p) => {
    p.isAlive = true;
    p.roleId = null;
    p.isReady = false;
    p.hasSelectedRole = false;
  });
  room.graveyard = [];
  room.graveyardChat = [];
  room.nightActions = [];
  room.morningEvents = [];
  room.votes = [];
  room.voiceQueue = [];
  room.winner = null;
  room.winnerLabel = null;
  privateMessages.delete(code);
  return room;
}

export function publicView(room: Room, viewerPlayerId: string | null) {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    round: room.round,
    settings: room.settings,
    phaseDeadline: room.phaseDeadline,
    roleSelectDeadline: room.roleSelectDeadline,
    players: room.players.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      isHost: p.isHost,
      isAlive: p.isAlive,
      isConnected: p.isConnected,
      isReady: p.isReady,
      hasSelectedRole: p.hasSelectedRole,
    })),
    currentChoice:
      room.currentChoice && room.currentChoice.playerId === viewerPlayerId
        ? room.currentChoice
        : room.currentChoice
        ? { playerId: room.currentChoice.playerId, options: [] }
        : null,
    myRole: viewerPlayerId
      ? room.players.find((p) => p.id === viewerPlayerId)?.roleId ?? null
      : null,
    runoffCandidates: room.runoffCandidates,
    nightStep: room.nightOrderQueue[room.nightStepIndex] ?? null,
    nightStepIndex: room.nightStepIndex,
    nightOrderQueue: room.nightOrderQueue,
    morningEvents: room.morningEvents,
    graveyard: room.graveyard,
    graveyardChat: room.graveyardChat,
    winner: room.winner,
    winnerLabel: room.winnerLabel,
    voteCount: room.votes.length,
    voteOpenBy: room.voteOpenBy.length,
    privateMessages: viewerPlayerId
      ? getPrivateMessagesFor(room.code, viewerPlayerId)
      : [],
    ceteMembers:
      viewerPlayerId &&
      room.players.find((p) => p.id === viewerPlayerId)?.roleId &&
      ROLES[room.players.find((p) => p.id === viewerPlayerId)!.roleId!]?.isMafia
        ? room.players
            .filter((p) => p.roleId && ROLES[p.roleId].isMafia)
            .map((p) => ({ id: p.id, nickname: p.nickname, roleId: p.roleId }))
        : [],
  };
}
