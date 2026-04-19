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
  pausedAt: number | null;

  // ── 18-Rol Genişletilmiş Durum ──────────────────────────────────────────
  hokaUsed: boolean;                          // Hoca tek kullanımlık bayrağı
  lockedHouses: string[];                     // Kapıcı kilitli ev (playerId)
  anonimMarks: Record<string, string[]>;      // anonimId -> [işaretlenen playerIds]
  anonimLynchedCounts: Record<string, number>;// anonimId -> linç edilen işaretli sayısı
  kirikKalpBonds: Record<string, string>;     // kirikKalpId -> aşık playerId
  tiyatrocuFakeRoles: Record<string, string>; // tiyatrocuId -> sahte roleId
  kumarbazPairs: [string, string][];          // takas edilen çiftler (geçmiş)
  nextLynchReversed: boolean;                 // Dedikoducu sonraki linç ters
  kiskanKopyaTargets: Record<string, string>; // kiskancId -> kopyalanacak playerId
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
    pausedAt: null,
    hokaUsed: false,
    lockedHouses: [],
    anonimMarks: {},
    anonimLynchedCounts: {},
    kirikKalpBonds: {},
    tiyatrocuFakeRoles: {},
    kumarbazPairs: [],
    nextLynchReversed: false,
    kiskanKopyaTargets: {},
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

export function leaveRoom(
  socketId: string,
): { room: Room | null; newHost?: { id: string; nickname: string } } {
  for (const room of rooms.values()) {
    const p = room.players.find((x) => x.socketId === socketId);
    if (!p) continue;
    if (room.phase === "LOBBY") {
      room.players = room.players.filter((x) => x.id !== p.id);
      if (room.players.length === 0) {
        rooms.delete(room.code);
        return { room: null };
      }
      // Host devri
      if (p.isHost && room.players.length > 0) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
        return { room, newHost: { id: room.players[0].id, nickname: room.players[0].nickname } };
      }
    } else {
      p.isConnected = false;
      p.socketId = null;
      // Auto-transfer host when the host disconnects mid-game
      if (p.isHost) {
        const candidate = room.players.find((x) => x.id !== p.id && x.isAlive && x.isConnected);
        if (candidate) {
          p.isHost = false;
          candidate.isHost = true;
          room.hostId = candidate.id;
          return { room, newHost: { id: candidate.id, nickname: candidate.nickname } };
        }
      }
    }
    return { room };
  }
  return { room: null };
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

  room.rolePool = shuffle(buildRolePool(room.players.length));
  room.roleSelectQueue = shuffle(room.players).map((p) => p.id);
  room.roleSelectIndex = 0;
  room.phase = "ROLE_SELECT";

  // Reset 18-rol state
  room.hokaUsed = false;
  room.lockedHouses = [];
  room.anonimMarks = {};
  room.anonimLynchedCounts = {};
  room.kirikKalpBonds = {};
  room.tiyatrocuFakeRoles = {};
  room.kumarbazPairs = [];
  room.nextLynchReversed = false;
  room.kiskanKopyaTargets = {};

  // Tiyatrocu'nun sahte rollerini şimdi ata (rol seçilmeden önce)
  // Kırık Kalp bağı oyun başladıktan sonra (roller dağıtılınca) atanacak
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
  if (room.paused) return null;
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
    // Kırık Kalp bağını ata: her Kırık Kalp için rastgele başka bir oyuncu seç
    const kirikKalpPlayers = room.players.filter((p) => p.roleId === "kirik_kalp");
    const allOthers = room.players.filter((p) => p.roleId !== "kirik_kalp");
    for (const kk of kirikKalpPlayers) {
      if (allOthers.length > 0) {
        const loved = allOthers[Math.floor(Math.random() * allOthers.length)];
        room.kirikKalpBonds[kk.id] = loved.id;
        // Kırık Kalp'e özel mesaj: "Aşığın: [nickname]"
        pushPrivate(room, kk.id, `💔 Kırık Kalp: Aşığın → ${loved.nickname}`);
      }
    }

    // Tiyatrocu sahte rolünü ata
    const allRoleIds = Object.keys(ROLES).filter((id) => id !== "tiyatrocu" && id !== "koylu");
    const tiyatrocuPlayers = room.players.filter((p) => p.roleId === "tiyatrocu");
    for (const t of tiyatrocuPlayers) {
      const fakeId = allRoleIds[Math.floor(Math.random() * allRoleIds.length)];
      room.tiyatrocuFakeRoles[t.id] = fakeId;
      pushPrivate(room, t.id, `🎭 Tiyatrocu: Sahte rolün → ${ROLES[fakeId]?.name ?? fakeId}`);
    }

    // Anonim başlangıç veri hazırlığı
    const anonimPlayers = room.players.filter((p) => p.roleId === "anonim");
    for (const a of anonimPlayers) {
      room.anonimMarks[a.id] = [];
      room.anonimLynchedCounts[a.id] = 0;
    }

    // İçten Pazarlıklı: çete üyelerine kimliklerini bildir
    const ictenPlayers = room.players.filter((p) => p.roleId === "icten_pazarlikli");
    for (const ip of ictenPlayers) {
      const ceteMsgs = room.players
        .filter((p) => ROLES[p.roleId ?? ""]?.isMafia && p.id !== ip.id)
        .map((p) => p.nickname)
        .join(", ");
      if (ceteMsgs) {
        pushPrivate(room, ip.id, `🐍 İçten Pazarlıklı: Çete üyelerin → ${ceteMsgs}`);
      }
    }

    room.morningEvents = [
      {
        kind: "info",
        message: "İlk sabah oldu. Mahalleye dikkat — herkes birbirini tartıyor.",
      },
    ];
    room.voiceQueue.push(
      `Mahalle meydanında toplanın. ${Math.round(
        room.settings.dayDurationSec / 60,
      )} dakikanız var. Suçluyu bulun.`,
    );
  }
}

export function endDayEarly(
  code: string,
  hostId: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  if (room.hostId !== hostId) return { error: "Sadece host" };
  if (room.phase !== "DAY") return { error: "Faz uygun değil" };
  const alive = room.players.filter((p) => p.isAlive);
  openVote(room, alive.map((p) => p.id));
  return room;
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
  if (room.paused) return null;
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

export function pauseGame(
  code: string,
  playerId: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  if (room.hostId !== playerId) return { error: "Sadece host" };
  if (room.paused) return { error: "Zaten duraklatıldı" };
  room.paused = true;
  room.pausedAt = Date.now();
  return room;
}

export function resumeGame(
  code: string,
  playerId: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  if (room.hostId !== playerId) return { error: "Sadece host" };
  if (!room.paused) return { error: "Zaten devam ediyor" };
  const elapsed = room.pausedAt ? Date.now() - room.pausedAt : 0;
  if (room.phaseDeadline) room.phaseDeadline += elapsed;
  if (room.roleSelectDeadline) room.roleSelectDeadline += elapsed;
  room.paused = false;
  room.pausedAt = null;
  return room;
}

export function transferHost(
  code: string,
  currentHostId: string,
  newHostId: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  if (room.hostId !== currentHostId) return { error: "Sadece host devredebilir" };
  if (currentHostId === newHostId) return { error: "Zaten hostsun" };
  const newHost = room.players.find((p) => p.id === newHostId);
  if (!newHost) return { error: "Oyuncu bulunamadı" };
  if (!newHost.isAlive) return { error: "Ölü oyuncuya host devredilemez" };
  const oldHost = room.players.find((p) => p.id === currentHostId);
  if (oldHost) oldHost.isHost = false;
  newHost.isHost = true;
  room.hostId = newHostId;
  return room;
}

export function kickPlayer(
  code: string,
  hostId: string,
  targetId: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  if (room.hostId !== hostId) return { error: "Sadece host" };
  if (hostId === targetId) return { error: "Kendini çıkaramazsın" };
  if (!["LOBBY", "DAY"].includes(room.phase))
    return { error: "Bu fazda çıkarma yapılamaz" };
  const idx = room.players.findIndex((p) => p.id === targetId);
  if (idx === -1) return { error: "Oyuncu bulunamadı" };
  room.players.splice(idx, 1);
  return room;
}

function resolveVote(room: Room, isRunoff: boolean) {
  // Dedikoducu bayrağı: oy yönünü ters çevir mi?
  const reversed = room.nextLynchReversed;
  room.nextLynchReversed = false;

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
    room.morningEvents.push({ kind: "info", message: "Kimse oy kullanmadı, kimse elenmedi." });
    startNight(room);
    return;
  }

  const max = Math.max(...Object.values(tally));

  // reversed: en az oyu alan elenir (oy almayan hayatta oyuncular dahil)
  let top: string[];
  if (reversed) {
    // Tüm hayatta oyuncuların oy sayısını belirle (oy almayan = 0)
    const aliveCandidates = room.players.filter((p) => p.isAlive);
    const fullTally: Record<string, number> = {};
    for (const p of aliveCandidates) {
      fullTally[p.id] = tally[p.id] ?? 0;
    }
    const min = Math.min(...Object.values(fullTally));
    top = Object.entries(fullTally).filter(([, c]) => c === min).map(([id]) => id);
  } else {
    top = Object.entries(tally).filter(([, c]) => c === max).map(([id]) => id);
  }

  if (reversed) {
    room.morningEvents.push({ kind: "info", message: "⚡ Dedikoducu etkisi: oylar tersine döndü! En az oyu alan elendi." });
    room.voiceQueue.push("Dedikoducu konuştu. Oylar tersine döndü.");
  }

  if (top.length === 1) {
    const target = room.players.find((p) => p.id === top[0]);
    if (target) {
      // Dedikoducu gündüz linç edilirse oylama tersine döner (kendisi elenir ama sıradaki ters de söz konusu değil)
      if (target.roleId === "dedikoducu" && !reversed) {
        room.nextLynchReversed = true;
      }
      target.isAlive = false;
      const role = target.roleId ? ROLES[target.roleId] : null;

      // Tiyatrocu sahte rol göster
      const displayRoleId = target.roleId === "tiyatrocu" && room.tiyatrocuFakeRoles[target.id]
        ? room.tiyatrocuFakeRoles[target.id]
        : target.roleId;
      const displayRole = displayRoleId ? ROLES[displayRoleId] : null;

      room.graveyard.push({
        playerId: target.id,
        nickname: target.nickname,
        roleId: displayRoleId ?? "?",
        cause: "Linç edildi",
      });

      // Muhabir öldü mü? Notlarını aç
      if (target.roleId === "muhabir") {
        const notes = privateMessages.get(room.code)?.filter((m) => m.playerId === target.id) ?? [];
        for (const note of notes) {
          room.morningEvents.push({ kind: "info", message: `📰 Muhabir notları: ${note.msg}` });
        }
      }

      room.morningEvents.push({
        kind: "info",
        message: `${target.nickname} mahalleden uzaklaştırıldı. Rolü: ${displayRole?.name ?? "?"}`,
      });
      room.voiceQueue.push(
        `Mahalle kararını verdi. ${target.nickname} uzaklaştırılıyor. Rolü: ${displayRole?.name ?? "bilinmiyor"}.`,
      );

      // Politikacı linç → çete anında kazanır
      if (target.roleId === "sahte_dernek") {
        endGame(room, "kotu", "Politikacı linç edildi! Davetsiz Misafir kazandı.");
        return;
      }

      // Anonim işaret sayısını güncelle
      for (const [anonimId, marks] of Object.entries(room.anonimMarks)) {
        if (marks.includes(target.id)) {
          room.anonimLynchedCounts[anonimId] = (room.anonimLynchedCounts[anonimId] ?? 0) + 1;
        }
      }

      // Kırık Kalp bağ ölümü
      checkKirikKalpDeath(room, target.id, "Aşığı linç edildi.");
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
  room.morningEvents.push({ kind: "info", message: "Oylar yine eşit. Bu sefer kimse elenmedi." });
  room.voiceQueue.push("Oylar yine eşit. Bu sefer kimse elenmedi.");
  startNight(room);
}

function checkKirikKalpDeath(room: Room, deadPlayerId: string, cause: string) {
  for (const [kkId, lovedId] of Object.entries(room.kirikKalpBonds)) {
    if (lovedId === deadPlayerId) {
      const kk = room.players.find((p) => p.id === kkId);
      if (kk && kk.isAlive) {
        kk.isAlive = false;
        room.graveyard.push({
          playerId: kk.id,
          nickname: kk.nickname,
          roleId: kk.roleId ?? "?",
          cause: `Kırık Kalp: ${cause}`,
        });
        room.morningEvents.push({
          kind: "info",
          message: `💔 ${kk.nickname} aşığından sonra yaşayamadı ve öldü.`,
        });
        room.voiceQueue.push(`${kk.nickname} aşığını kaybetti. Kırık Kalp artık yok.`);
      }
    }
  }
}

function startNight(room: Room) {
  room.phase = "NIGHT";
  room.nightActions = [];
  room.ceteVotes = {};
  room.lockedHouses = [];
  room.kiskanKopyaTargets = {};
  room.voiceQueue.push(
    "Mahalle uykuya daldı... Gece çöktü sokaklara. Gözlerinizi kapatın.",
  );

  // Gece kuyruğu: nightOrder'a göre sıralı (Kumarbaz:1, Kıskanç:2, Çete:3, Kapıcı:4,
  // Şifacı:5, Bekçi:6, Falcı:7, Hoca:8, Kahraman Dede:9, Anonim:10)
  const queue: { roleId: string; actorIds: string[] }[] = [];

  // 1: Kumarbaz
  for (const rid of ["kumarbaz"]) {
    const actors = room.players.filter((p) => p.isAlive && p.roleId === rid);
    if (actors.length > 0) queue.push({ roleId: rid, actorIds: actors.map((a) => a.id) });
  }

  // 2: Kıskanç Komşu (hedef seçimi)
  for (const rid of ["kiskanc_komsu"]) {
    const actors = room.players.filter((p) => p.isAlive && p.roleId === rid);
    if (actors.length > 0) queue.push({ roleId: rid, actorIds: actors.map((a) => a.id) });
  }

  // 3: Çete toplu oylama
  const ceteAlive = room.players.filter(
    (p) => p.isAlive && p.roleId && ROLES[p.roleId].isMafia,
  );
  if (ceteAlive.length > 0) {
    queue.push({ roleId: "_cete", actorIds: ceteAlive.map((p) => p.id) });
  }

  // 4: Kapıcı
  for (const rid of ["kapici"]) {
    const actors = room.players.filter((p) => p.isAlive && p.roleId === rid);
    if (actors.length > 0) queue.push({ roleId: rid, actorIds: actors.map((a) => a.id) });
  }

  // 5: Şifacı Teyze (otaci)
  for (const rid of ["otaci"]) {
    const actors = room.players.filter((p) => p.isAlive && p.roleId === rid);
    if (actors.length > 0) queue.push({ roleId: rid, actorIds: actors.map((a) => a.id) });
  }

  // 6: Bekçi
  for (const rid of ["bekci"]) {
    const actors = room.players.filter((p) => p.isAlive && p.roleId === rid);
    if (actors.length > 0) queue.push({ roleId: rid, actorIds: actors.map((a) => a.id) });
  }

  // 7: Falcı
  for (const rid of ["falci"]) {
    const actors = room.players.filter((p) => p.isAlive && p.roleId === rid);
    if (actors.length > 0) queue.push({ roleId: rid, actorIds: actors.map((a) => a.id) });
  }

  // 8: Hoca (yalnızca kullanılmadıysa)
  if (!room.hokaUsed) {
    const actors = room.players.filter((p) => p.isAlive && p.roleId === "hoca");
    if (actors.length > 0) queue.push({ roleId: "hoca", actorIds: actors.map((a) => a.id) });
  }

  // 9: Kahraman Dede
  for (const rid of ["kahraman_dede"]) {
    const actors = room.players.filter((p) => p.isAlive && p.roleId === rid);
    if (actors.length > 0) queue.push({ roleId: rid, actorIds: actors.map((a) => a.id) });
  }

  // 10: Anonim
  for (const rid of ["anonim"]) {
    const actors = room.players.filter((p) => p.isAlive && p.roleId === rid);
    if (actors.length > 0) queue.push({ roleId: rid, actorIds: actors.map((a) => a.id) });
  }

  // 11: Kıskanç Komşu kopya uygulama (önceki hedef seçimine göre otomatik)
  const kiskancAlive = room.players.filter((p) => p.isAlive && p.roleId === "kiskanc_komsu");
  if (kiskancAlive.length > 0) {
    queue.push({ roleId: "_kiskanc_kopya", actorIds: kiskancAlive.map((a) => a.id) });
  }

  room.nightOrderQueue = queue;
  room.nightStepIndex = 0;
  room.phaseDeadline = Date.now() + 2000; // kısa "gözlerinizi kapatın" animasyonu
}

export function advanceFromNightIntro(code: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.phase === "DAY") {
    // Host shortcut: skip day discussion and enter night immediately
    startNight(room);
    return room;
  }
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

  // _kiskanc_kopya: otomatik kopya uygulama adımı (kullanıcı girişi gerekmez)
  if (step.roleId === "_kiskanc_kopya") {
    executeKiskancKopya(room);
    room.nightStepIndex++;
    advanceNightStep(room);
    return;
  }

  room.phase = "NIGHT_ROLE";
  room.phaseDeadline =
    Date.now() + room.settings.nightActionDurationSec * 1000;
  if (step.roleId === "_cete") {
    room.voiceQueue.push(ROLES.tefeci_basi.voiceCallTr);
  } else {
    const r = ROLES[step.roleId];
    if (r && r.voiceCallTr) room.voiceQueue.push(r.voiceCallTr);
  }
}

function executeKiskancKopya(room: Room) {
  for (const [kiskancId, targetPlayerId] of Object.entries(room.kiskanKopyaTargets)) {
    const targetPlayer = room.players.find((p) => p.id === targetPlayerId);
    if (!targetPlayer || !targetPlayer.isAlive) continue;

    // Hedefin bu gece yaptığı eylem (çete öldürmesi kopyalanamaz)
    const copiedAction = room.nightActions.find(
      (a) => a.actorId === targetPlayerId &&
        a.type !== "cete_oylama" &&
        a.type !== "swap" &&
        a.type !== "bagimsiz_oldurme",
    );
    if (!copiedAction) continue;

    const kiskancActor = room.players.find((p) => p.id === kiskancId);
    if (!kiskancActor || !kiskancActor.isAlive) continue;

    // Kopyalanan eylemi Kıskanç Komşu adına nightActions'a ekle
    // (resolveMorning bunları işleyecek)
    room.nightActions.push({
      actorId: kiskancId,
      targetId: copiedAction.targetId,
      type: copiedAction.type + "_kopya", // etiket: asıl işleme özel
    });
  }
}

export function submitNightAction(
  code: string,
  actorId: string,
  targetId: string,
  targetId2?: string, // Kumarbaz için ikinci hedef
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  if (room.phase !== "NIGHT_ROLE") return { error: "Şu an aksiyon yok" };
  const actor = room.players.find((p) => p.id === actorId);
  if (!actor || !actor.isAlive || !actor.roleId)
    return { error: "Aksiyon hakkın yok" };
  const step = room.nightOrderQueue[room.nightStepIndex];
  if (!step) return { error: "Faz hatası" };

  // Çete toplu oylaması
  if (step.roleId === "_cete") {
    if (!ROLES[actor.roleId].isMafia) return { error: "Çete üyesi değilsin" };
    const t = room.players.find((p) => p.id === targetId);
    if (!t || !t.isAlive) return { error: "Geçersiz hedef" };
    if (ROLES[actor.roleId].isMafia && t.roleId && ROLES[t.roleId]?.isMafia)
      return { error: "Çete kendi üyesini öldüremez" };
    room.ceteVotes[actorId] = targetId;
    if (Object.keys(room.ceteVotes).length >= step.actorIds.length) {
      finishNightStep(room);
    }
    return room;
  }

  if (!step.actorIds.includes(actorId)) return { error: "Sıran değil" };

  const roleId = actor.roleId;
  const t1 = room.players.find((p) => p.id === targetId);

  // Kumarbaz: iki hedef seçer (takas)
  if (roleId === "kumarbaz") {
    if (!targetId2) return { error: "Kumarbaz iki hedef seçmeli" };
    if (targetId === actorId || targetId2 === actorId) return { error: "Kendini seçemezsin" };
    if (targetId === targetId2) return { error: "Farklı iki oyuncu seçmeli" };
    const t2 = room.players.find((p) => p.id === targetId2);
    if (!t1 || !t1.isAlive || !t2 || !t2.isAlive) return { error: "Geçersiz hedef" };
    room.nightActions.push({ actorId, targetId, type: "swap" });
    room.nightActions.push({ actorId, targetId: targetId2, type: "swap" });
    finishNightStep(room);
    return room;
  }

  // Kıskanç Komşu: kopyalanacak kişiyi seç
  if (roleId === "kiskanc_komsu") {
    if (!t1 || !t1.isAlive) return { error: "Geçersiz hedef" };
    if (targetId === actorId) return { error: "Kendini kopyalayamazsın" };
    room.kiskanKopyaTargets[actorId] = targetId;
    room.nightActions.push({ actorId, targetId, type: "kopya_hedef" });
    finishNightStep(room);
    return room;
  }

  // Hoca: tek kullanımlık, eğer kullanılmışsa geç
  if (roleId === "hoca") {
    if (room.hokaUsed) {
      finishNightStep(room);
      return room;
    }
    if (!t1 || !t1.isAlive) return { error: "Geçersiz hedef" };
    room.hokaUsed = true;
    room.nightActions.push({ actorId, targetId, type: "koruma_guclu" });
    finishNightStep(room);
    return room;
  }

  // Kapıcı: ev kilitle
  if (roleId === "kapici") {
    if (targetId === actorId) return { error: "Kendi evini kilitleyemezsin" };
    if (!t1 || !t1.isAlive) return { error: "Geçersiz hedef" };
    room.nightActions.push({ actorId, targetId, type: "kilit" });
    finishNightStep(room);
    return room;
  }

  // Diğer roller için genel işlem
  if (!t1 || !t1.isAlive) return { error: "Geçersiz hedef" };
  const actionType = ROLES[roleId]?.nightAction ?? "";
  room.nightActions.push({ actorId, targetId, type: actionType });
  finishNightStep(room);
  return room;
}

function finishNightStep(room: Room) {
  room.nightStepIndex++;
  advanceNightStep(room);
}

function resolveMorning(room: Room) {
  room.morningEvents = [];
  const victims: string[] = [];

  // ── ADIM 1: Kumarbaz takası ──────────────────────────────────────────────
  const swapActions = room.nightActions.filter((a) => a.type === "swap");
  if (swapActions.length === 2 && swapActions[0].actorId === swapActions[1].actorId) {
    const p1 = room.players.find((p) => p.id === swapActions[0].targetId);
    const p2 = room.players.find((p) => p.id === swapActions[1].targetId);
    if (p1 && p2 && p1.isAlive && p2.isAlive) {
      const tmp = p1.roleId;
      p1.roleId = p2.roleId;
      p2.roleId = tmp;
      room.kumarbazPairs.push([p1.id, p2.id]);
      // Kumarbaz'a bildir
      const kumarbaz = room.players.find((p) => p.id === swapActions[0].actorId);
      if (kumarbaz) {
        pushPrivate(room, kumarbaz.id, `🎰 Kumarbaz: ${p1.nickname} ve ${p2.nickname} rolleri takas edildi.`);
      }
      room.morningEvents.push({ kind: "info", message: `Gece içinde iki kişinin kaderi yer değiştirdi...` });
    }
  }

  // ── ADIM 2: Kapıcı kilitleri uygula (kilit_kopya dahil) ─────────────────
  for (const a of room.nightActions) {
    if (a.type === "kilit" || a.type === "kilit_kopya") {
      room.lockedHouses.push(a.targetId);
    }
  }

  // ── ADIM 3: Korumalar ────────────────────────────────────────────────────
  // Şifacı Teyze (engellenir kapı kilitliyse); _kopya türü dahil
  const protectedIds = new Set<string>();
  for (const a of room.nightActions) {
    if (a.type === "koruma" || a.type === "koruma_kopya") {
      if (!room.lockedHouses.includes(a.targetId)) {
        protectedIds.add(a.targetId);
      }
    }
  }
  // Hoca (Kapıcı kilidini aşar); _kopya türü dahil
  for (const a of room.nightActions) {
    if (a.type === "koruma_guclu" || a.type === "koruma_guclu_kopya") {
      protectedIds.add(a.targetId); // Hoca kilidi aşar
    }
  }

  // ── ADIM 4: Çete hedefi belirle ──────────────────────────────────────────
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

  // İçten Pazarlıklı: çeteye bu geceki rastgele bir oyuncunun rolünü sızdır
  const ictenPlayer = room.players.find((p) => p.isAlive && p.roleId === "icten_pazarlikli");
  if (ictenPlayer) {
    const spyTargets = room.players.filter((p) => p.isAlive && !ROLES[p.roleId ?? ""]?.isMafia && p.id !== ictenPlayer.id);
    if (spyTargets.length > 0) {
      const spy = spyTargets[Math.floor(Math.random() * spyTargets.length)];
      const ceteMembers = room.players.filter((p) => ROLES[p.roleId ?? ""]?.isMafia);
      for (const cm of ceteMembers) {
        pushPrivate(room, cm.id, `🐍 İçten Pazarlıklı raporu: ${spy.nickname} → ${ROLES[spy.roleId ?? ""]?.name ?? "?"}`);
      }
    }
  }

  // ── ADIM 5: Çete öldürme ─────────────────────────────────────────────────
  if (ceteTarget) {
    // Çete hedefi kilitli evde mi? (Kapıcı etkisi)
    const isLocked = room.lockedHouses.includes(ceteTarget);
    // Hoca güçlü koruma kapı kilidini de aşar, ama çete açısından kilit engel
    const isProtected = protectedIds.has(ceteTarget);

    if (isLocked && !isProtected) {
      room.morningEvents.push({ kind: "calm", message: "Bu sabah mahalle sakindir. Kimse kaybolmamış." });
    } else if (isProtected) {
      room.morningEvents.push({ kind: "calm", message: "Bu sabah mahalle sakindir. Kimse kaybolmamış." });
    } else {
      const v = room.players.find((p) => p.id === ceteTarget);
      if (v && v.isAlive) {
        killPlayer(room, v, "Çete tarafından öldürüldü", victims);
      }
    }
  } else {
    room.morningEvents.push({ kind: "calm", message: "Bu sabah mahalle sakindir." });
  }

  // ── ADIM 6: Kahraman Dede bağımsız öldürme ───────────────────────────────
  for (const a of room.nightActions) {
    if (a.type === "bagimsiz_oldurme") {
      const kdTarget = room.players.find((p) => p.id === a.targetId);
      if (kdTarget && kdTarget.isAlive) {
        // Kahraman Dede Kapıcı tarafından engellenemez
        if (protectedIds.has(kdTarget.id)) {
          room.morningEvents.push({ kind: "info", message: `${kdTarget.nickname} bu gece korunuyordu.` });
        } else {
          killPlayer(room, kdTarget, "Kahraman Dede tarafından öldürüldü", victims);
        }
      }
    }
  }

  // ── ADIM 7: Bekçi sorgu sonuçları (kopya dahil) ──────────────────────────
  for (const a of room.nightActions) {
    if (a.type === "sorgu_ekip" || a.type === "sorgu_ekip_kopya") {
      if (room.lockedHouses.includes(a.targetId)) continue; // kilit engel
      const target = room.players.find((p) => p.id === a.targetId);
      const actor = room.players.find((p) => p.id === a.actorId);
      if (target && actor) {
        let team = target.roleId ? ROLES[target.roleId].team : "iyi";
        // İçten Pazarlıklı aldatmaca: "iyi" göster
        if (target.roleId === "icten_pazarlikli") team = "iyi" as typeof team;
        const prefix = a.type === "sorgu_ekip_kopya" ? "🧂 Kıskanç kopya (Bekçi)" : "🔦 Bekçi raporu";
        pushPrivate(
          room, actor.id,
          `${prefix}: ${target.nickname} → ${team === "kotu" ? "KÖTÜ EKİP (çete)" : "İYİ EKİP"}`,
        );
      }
    }
  }

  // ── ADIM 8: Falcı rol sorgusu (kopya dahil) ───────────────────────────────
  for (const a of room.nightActions) {
    if (a.type === "sorgu_rol" || a.type === "sorgu_rol_kopya") {
      if (room.lockedHouses.includes(a.targetId)) continue; // kilit engel
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
        const prefix = a.type === "sorgu_rol_kopya" ? "🧂 Kıskanç kopya (Falcı)" : "🔮 Falcı vizyonu";
        pushPrivate(
          room, actor.id,
          `${prefix}: ${target.nickname} → ${display?.emoji ?? ""} ${display?.name ?? "?"}`,
        );
      }
    }
  }

  // ── ADIM 10: Anonim işaretleme ────────────────────────────────────────────
  for (const a of room.nightActions) {
    if (a.type === "isaretle") {
      const anonimId = a.actorId;
      if (!room.anonimMarks[anonimId]) room.anonimMarks[anonimId] = [];
      if (!room.anonimMarks[anonimId].includes(a.targetId)) {
        room.anonimMarks[anonimId].push(a.targetId);
      }
    }
  }

  // ── ADIM 11: Kırık Kalp zinciri ───────────────────────────────────────────
  // (Bekçi/Falcı sorgu aktörleri zaten hayatta olduğu için gerek yok; ancak ölen aktörler olabilir)
  // Kırık Kalp bağ ölümleri killPlayer() içinde zaten çağrılıyor

  // ── SABAH DUYURUSU ────────────────────────────────────────────────────────
  if (victims.length === 0 && !room.morningEvents.some((e) => e.kind === "death")) {
    room.morningEvents.push({ kind: "calm", message: "Bu sabah mahalle sakindir. Kimse kaybolmamış." });
  }
  const voiceMsg = victims.length > 0
    ? `Mahalle uyanıyor... Bu sabah kayıplar var: ${victims.join(", ")}.`
    : "Mahalle uyanıyor... Bu sabah herkes sağ salim.";
  room.voiceQueue.push(voiceMsg);

  if (checkWin(room)) return;
  enterDayPhase(room, false);
}

function killPlayer(room: Room, player: Player, cause: string, victims: string[]) {
  if (!player.isAlive) return;
  player.isAlive = false;

  // Tiyatrocu: sahte rol göster
  const displayRoleId = player.roleId === "tiyatrocu" && room.tiyatrocuFakeRoles[player.id]
    ? room.tiyatrocuFakeRoles[player.id]
    : player.roleId;
  const displayRole = displayRoleId ? ROLES[displayRoleId] : null;

  room.graveyard.push({
    playerId: player.id,
    nickname: player.nickname,
    roleId: displayRoleId ?? "?",
    cause: `${cause} (${displayRole?.name ?? "?"})`,
  });
  victims.push(player.nickname);
  room.morningEvents.push({
    kind: "death",
    message: `Bu sabah ${player.nickname} kaybolmuş. Rolü: ${displayRole?.name ?? "?"}`,
    victims: [player.nickname],
  });

  // Muhabir öldü mü? Notlarını aç
  if (player.roleId === "muhabir") {
    const notes = privateMessages.get(room.code)?.filter((m) => m.playerId === player.id) ?? [];
    for (const note of notes) {
      room.morningEvents.push({ kind: "info", message: `📰 Muhabir notları: ${note.msg}` });
    }
  }

  // Dedikoducu gece öldürüldü → sonraki linç ters
  if (player.roleId === "dedikoducu") {
    room.nextLynchReversed = true;
    room.morningEvents.push({ kind: "info", message: "🗣️ Dedikoducu bu gece öldü. Bugünkü linç oylaması tersine dönecek!" });
    room.voiceQueue.push("Dedikoducu aramızdan ayrıldı. Bugünkü oylama tersine dönecek.");
  }

  // Kırık Kalp zinciri
  checkKirikKalpDeath(room, player.id, cause);
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
  const alivePlayers = room.players.filter((p) => p.isAlive);
  const aliveCount = alivePlayers.length;

  // ── Anonim kazanma: 3 işaretli linç edildi + hayatta ───────────────────
  for (const [anonimId, lynchedCount] of Object.entries(room.anonimLynchedCounts)) {
    if (lynchedCount >= 3) {
      const anonim = room.players.find((p) => p.id === anonimId);
      if (anonim && anonim.isAlive) {
        endGame(room, "anonim", `Anonim kazandı! İşaretlediği 3 kişi mahalleden uzaklaştırıldı.`);
        return true;
      }
    }
  }

  // ── Kumarbaz kazanma: son 3'te ──────────────────────────────────────────
  if (aliveCount <= 3) {
    const kumarbaz = alivePlayers.find((p) => p.roleId === "kumarbaz");
    if (kumarbaz) {
      endGame(room, "kumarbaz", `Kumarbaz kazandı! Son 3'e kadar hayatta kaldı.`);
      return true;
    }
  }

  // ── Kahraman Dede kazanma: hayatta kalan tek kişi ──────────────────────
  if (aliveCount === 1 && alivePlayers[0].roleId === "kahraman_dede") {
    endGame(room, "kahraman_dede", `Kahraman Dede kazandı! Mahallede tek kişi kaldı.`);
    return true;
  }

  // ── Kırık Kalp kazanma: aşığıyla ikisi de hayatta son ikili ───────────
  if (aliveCount === 2) {
    for (const [kkId, lovedId] of Object.entries(room.kirikKalpBonds)) {
      const kk = alivePlayers.find((p) => p.id === kkId);
      const loved = alivePlayers.find((p) => p.id === lovedId);
      if (kk && loved) {
        endGame(room, "kirik_kalp", `Kırık Kalp ve aşığı kazandı! İkisi birlikte son ikili olarak kaldı.`);
        return true;
      }
    }
  }

  // ── Çete kazanma: çete sayısı ≥ diğerleri ──────────────────────────────
  const aliveMafia = alivePlayers.filter((p) => p.roleId && ROLES[p.roleId]?.isMafia).length;
  const aliveNonMafia = aliveCount - aliveMafia;

  if (aliveMafia >= aliveNonMafia && aliveMafia > 0) {
    endGame(room, "kotu", "Davetsiz Misafir kazandı — Mahalle ele geçirildi.");
    return true;
  }

  // ── Mahalle kazanma: tüm çete + tehlikeli tarafsızlar elenince ─────────
  const aliveDangerousNeutral = alivePlayers.filter(
    (p) => p.roleId === "anonim" || p.roleId === "kahraman_dede",
  ).length;

  if (aliveMafia === 0 && aliveDangerousNeutral === 0) {
    endGame(room, "iyi", "Mahalle zafere ulaştı! Tüm karanlık güçler temizlendi.");
    return true;
  }

  // Çete elendi ama tehlikeli tarafsızlar hâlâ var — devam
  return false;
}

function endGame(room: Room, winner: string, label: string) {
  room.phase = "ENDED";
  room.winner = winner;
  room.winnerLabel = label;
  room.phaseDeadline = null;
  room.voiceQueue.push(label);
}

const GRAVEYARD_MAX_LENGTH = 200;
const GRAVEYARD_RATE_MS = 500;
const graveyardLastSent = new Map<string, number>();

export function sendGraveyardChat(
  code: string,
  playerId: string,
  text: string,
): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Oda yok" };
  const p = room.players.find((x) => x.id === playerId);
  if (!p || p.isAlive) return { error: "Yalnızca ölüler chat kullanır" };

  if (text.length > GRAVEYARD_MAX_LENGTH) {
    return { error: `Mesaj en fazla ${GRAVEYARD_MAX_LENGTH} karakter olabilir` };
  }

  const key = `${code}:${playerId}`;
  const now = Date.now();
  const last = graveyardLastSent.get(key) ?? 0;
  if (now - last < GRAVEYARD_RATE_MS) {
    return { error: "Çok hızlı mesaj gönderiyorsun, biraz bekle" };
  }
  graveyardLastSent.set(key, now);

  room.graveyardChat.push({
    from: p.id,
    nick: p.nickname,
    text,
    ts: now,
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
  room.paused = false;
  room.pausedAt = null;
  room.hokaUsed = false;
  room.lockedHouses = [];
  room.anonimMarks = {};
  room.anonimLynchedCounts = {};
  room.kirikKalpBonds = {};
  room.tiyatrocuFakeRoles = {};
  room.kumarbazPairs = [];
  room.nextLynchReversed = false;
  room.kiskanKopyaTargets = {};
  privateMessages.delete(code);
  return room;
}

export function publicView(room: Room, viewerPlayerId: string | null) {
  const viewer = viewerPlayerId ? room.players.find((p) => p.id === viewerPlayerId) : null;
  const viewerRole = viewer?.roleId ?? null;
  const isViewerMafia = viewerRole ? ROLES[viewerRole]?.isMafia : false;
  const isViewerIcten = viewerRole === "icten_pazarlikli";

  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    round: room.round,
    settings: room.settings,
    phaseDeadline: room.phaseDeadline,
    roleSelectDeadline: room.roleSelectDeadline,
    paused: room.paused,
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
      (isViewerMafia || isViewerIcten)
        ? room.players
            .filter((p) => p.roleId && ROLES[p.roleId].isMafia)
            .map((p) => ({ id: p.id, nickname: p.nickname, roleId: p.roleId }))
        : [],
    // Hoca'ya özel: dua kullanıldı mı?
    hokaUsed: viewerRole === "hoca" ? room.hokaUsed : undefined,
    // Anonim'e özel: işaretlediği kişiler
    anonimMarks: viewerRole === "anonim" && viewerPlayerId
      ? (room.anonimMarks[viewerPlayerId] ?? [])
      : undefined,
    anonimLynchedCount: viewerRole === "anonim" && viewerPlayerId
      ? (room.anonimLynchedCounts[viewerPlayerId] ?? 0)
      : undefined,
    // Kırık Kalp'e özel: aşığı
    kirikKalpLovedId: viewerRole === "kirik_kalp" && viewerPlayerId
      ? (room.kirikKalpBonds[viewerPlayerId] ?? null)
      : undefined,
    // Dedikoducu bayrağı (public)
    nextLynchReversed: room.nextLynchReversed,
  };
}
