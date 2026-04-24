import { describe, it, expect } from "vitest";
import {
  createRoom,
  joinRoom,
  tickPhaseTimeout,
  advanceFromNightIntro,
  submitNightAction,
  transferHost,
  leaveRoom,
  restartGame,
  type Room,
} from "../gameEngine.js";
import { buildRolePool } from "../roles.js";

let socketCounter = 0;
function uniqueSocket(): string {
  return `sock-${++socketCounter}-${Math.random().toString(36).slice(2)}`;
}

const NICKS = [
  "Host", "Ahmet", "Ayşe", "Mehmet", "Fatma",
  "Ali", "Veli", "Zeynep", "Hasan", "Hüseyin",
];

function makeRoom(roles: string[]): { room: Room; ids: string[] } {
  const n = roles.length;
  if (n < 4) throw new Error("makeRoom: at least 4 players required");

  const room = createRoom(uniqueSocket(), NICKS[0]);
  const ids: string[] = [room.players[0].id];

  for (let i = 1; i < n; i++) {
    const res = joinRoom(room.code, uniqueSocket(), NICKS[i]);
    if ("error" in res) throw new Error(`joinRoom failed: ${res.error}`);
    ids.push(res.player.id);
  }

  room.players.forEach((p, i) => {
    p.roleId = roles[i];
  });

  room.round = 1;
  room.phase = "DAY";
  room.morningEvents = [];

  return { room, ids };
}

function triggerVote(room: Room, votes: Record<string, string>): void {
  const aliveIds = room.players.filter((p) => p.isAlive).map((p) => p.id);
  room.phase = "VOTE";
  room.runoffCandidates = aliveIds;
  room.votes = Object.entries(votes).map(([voterId, targetId]) => ({
    voterId,
    targetId,
  }));
  room.phaseDeadline = 1;
  tickPhaseTimeout(room.code);
}

function triggerNight(room: Room, setup: (r: Room) => void): void {
  room.phase = "NIGHT";
  room.nightActions = [];
  room.ceteVotes = {};
  room.lockedHouses = [];
  room.kiskanKopyaTargets = {};
  room.nightOrderQueue = [];
  room.nightStepIndex = 0;
  setup(room);
  advanceFromNightIntro(room.code);
}

describe("Win conditions", () => {
  it("mahalle wins when all mafia are eliminated via vote", () => {
    const { room, ids } = makeRoom(["tefeci_basi", "komsu", "komsu", "komsu"]);

    triggerVote(room, {
      [ids[1]]: ids[0],
      [ids[2]]: ids[0],
      [ids[3]]: ids[0],
    });

    expect(room.phase).toBe("ENDED");
    expect(room.winner).toBe("iyi");
  });

  it("çete wins when mafia kills last villager majority at night", () => {
    const { room, ids } = makeRoom(["tefeci_basi", "tahsildar", "komsu", "komsu"]);

    triggerNight(room, (r) => {
      r.ceteVotes[ids[0]] = ids[2];
      r.ceteVotes[ids[1]] = ids[2];
    });

    expect(room.phase).toBe("ENDED");
    expect(room.winner).toBe("kotu");
  });

  it("çete wins when vote leaves mafia dominant", () => {
    const { room, ids } = makeRoom(["tefeci_basi", "komsu", "komsu", "komsu"]);
    room.players[1].isAlive = false;
    room.players[2].isAlive = false;

    triggerVote(room, { [ids[0]]: ids[3], [ids[3]]: ids[3] });

    expect(room.phase).toBe("ENDED");
    expect(room.winner).toBe("kotu");
  });
});

describe("Politikacı (sahte_dernek)", () => {
  it("lynching Politikacı causes instant çete win", () => {
    const { room, ids } = makeRoom([
      "sahte_dernek", "komsu", "komsu", "komsu", "komsu",
    ]);
    const politikaciId = ids[0];

    triggerVote(room, {
      [ids[1]]: politikaciId,
      [ids[2]]: politikaciId,
      [ids[3]]: politikaciId,
      [ids[4]]: politikaciId,
    });

    expect(room.phase).toBe("ENDED");
    expect(room.winner).toBe("kotu");
  });

  it("Politikacı killed at night does NOT trigger instant win", () => {
    const { room, ids } = makeRoom([
      "sahte_dernek", "tefeci_basi", "komsu", "komsu", "komsu",
    ]);
    const politikaciId = ids[0];

    triggerNight(room, (r) => {
      r.ceteVotes[ids[1]] = politikaciId;
    });

    expect(room.phase).not.toBe("ENDED");
    expect(room.players.find((p) => p.id === politikaciId)!.isAlive).toBe(false);
  });
});

describe("Muhtar vote weight", () => {
  it("Muhtar 1.5 vote beats two 1-weight votes targeting a different player", () => {
    const { room, ids } = makeRoom([
      "muhtar", "komsu", "komsu", "tefeci_basi", "komsu",
    ]);
    const muhtarId = ids[0];
    const mafiaId = ids[3];
    const villager2 = ids[2];

    triggerVote(room, {
      [muhtarId]: mafiaId,
      [ids[1]]: villager2,
    });

    expect(room.players.find((p) => p.id === mafiaId)!.isAlive).toBe(false);
    expect(room.players.find((p) => p.id === villager2)!.isAlive).toBe(true);
  });
});

describe("Vote tie and runoff", () => {
  it("tied vote enters VOTE_RUNOFF phase", () => {
    const { room, ids } = makeRoom(["komsu", "komsu", "komsu", "tefeci_basi"]);
    const a = ids[0];
    const b = ids[1];

    triggerVote(room, {
      [ids[2]]: a,
      [ids[3]]: b,
    });

    expect(room.phase).toBe("VOTE_RUNOFF");
    expect(room.runoffCandidates).toContain(a);
    expect(room.runoffCandidates).toContain(b);
  });

  it("second tied vote in runoff eliminates no one and proceeds to night", () => {
    const { room, ids } = makeRoom(["komsu", "komsu", "komsu", "tefeci_basi"]);
    const a = ids[0];
    const b = ids[1];

    triggerVote(room, { [ids[2]]: a, [ids[3]]: b });

    room.phase = "VOTE_RUNOFF";
    room.runoffCandidates = [a, b];
    room.votes = [
      { voterId: ids[2], targetId: a },
      { voterId: ids[3], targetId: b },
    ];
    room.phaseDeadline = 1;
    tickPhaseTimeout(room.code);

    expect(room.phase).toBe("NIGHT");
    expect(room.players.find((p) => p.id === a)!.isAlive).toBe(true);
    expect(room.players.find((p) => p.id === b)!.isAlive).toBe(true);
  });
});

describe("Dedikoducu", () => {
  it("Dedikoducu lynched by day sets nextLynchReversed and kills Dedikoducu", () => {
    const { room, ids } = makeRoom([
      "dedikoducu", "komsu", "komsu", "tefeci_basi", "komsu",
    ]);
    const ddId = ids[0];

    triggerVote(room, {
      [ids[1]]: ddId,
      [ids[2]]: ddId,
      [ids[3]]: ddId,
      [ids[4]]: ddId,
    });

    expect(room.players.find((p) => p.id === ddId)!.isAlive).toBe(false);
    expect(room.nextLynchReversed).toBe(true);
  });

  it("Dedikoducu killed at night sets nextLynchReversed", () => {
    const { room, ids } = makeRoom([
      "dedikoducu", "tefeci_basi", "komsu", "komsu",
    ]);
    const ddId = ids[0];

    triggerNight(room, (r) => {
      r.ceteVotes[ids[1]] = ddId;
    });

    expect(room.players.find((p) => p.id === ddId)!.isAlive).toBe(false);
    expect(room.nextLynchReversed).toBe(true);
  });

  it("reversed vote: the unique player with zero votes is eliminated", () => {
    // 6 players; votes form a cycle so exactly one player (ids[5]) receives 0 votes
    const { room, ids } = makeRoom([
      "tefeci_basi", "komsu", "komsu", "komsu", "komsu", "komsu",
    ]);
    room.nextLynchReversed = true;

    const noVotes = ids[5];

    triggerVote(room, {
      [ids[0]]: ids[1],
      [ids[1]]: ids[2],
      [ids[2]]: ids[3],
      [ids[3]]: ids[4],
      [ids[4]]: ids[0],
    });

    expect(room.players.find((p) => p.id === noVotes)!.isAlive).toBe(false);
    expect(room.nextLynchReversed).toBe(false);
  });

  it("Dedikoducu + Politikacı: reversed vote lynches Politikacı → çete wins instantly", () => {
    // 6 players; votes cycle so only Politikacı (ids[0]) receives 0 votes
    const { room, ids } = makeRoom([
      "sahte_dernek", "komsu", "komsu", "komsu", "komsu", "komsu",
    ]);
    room.nextLynchReversed = true;

    triggerVote(room, {
      [ids[0]]: ids[1],
      [ids[1]]: ids[2],
      [ids[2]]: ids[3],
      [ids[3]]: ids[4],
      [ids[4]]: ids[5],
      [ids[5]]: ids[1],
    });

    expect(room.phase).toBe("ENDED");
    expect(room.winner).toBe("kotu");
    expect(room.players.find((p) => p.id === ids[0])!.isAlive).toBe(false);
  });
});

describe("Şifacı Teyze (otaci) protection", () => {
  it("protects target from çete kill — target survives", () => {
    const { room, ids } = makeRoom([
      "tefeci_basi", "otaci", "komsu", "komsu",
    ]);
    const targetId = ids[2];
    const otaciId = ids[1];

    triggerNight(room, (r) => {
      r.ceteVotes[ids[0]] = targetId;
      r.nightActions.push({ actorId: otaciId, targetId, type: "koruma" });
    });

    expect(room.players.find((p) => p.id === targetId)!.isAlive).toBe(true);
    expect(room.morningEvents.some((e) => e.kind === "saved")).toBe(true);
  });

  it("Kapıcı locking the Şifacı's own house prevents protection — target dies", () => {
    // When the protector's house is locked they cannot leave, so the target is unprotected
    const { room, ids } = makeRoom([
      "tefeci_basi", "otaci", "kapici", "komsu", "komsu",
    ]);
    const targetId = ids[3];
    const otaciId = ids[1];
    const kapiciId = ids[2];

    triggerNight(room, (r) => {
      r.ceteVotes[ids[0]] = targetId;
      // Kapıcı locks the Şifacı's house (the protector cannot leave)
      r.nightActions.push({ actorId: kapiciId, targetId: otaciId, type: "kilit" });
      r.nightActions.push({ actorId: otaciId, targetId, type: "koruma" });
    });

    expect(room.players.find((p) => p.id === targetId)!.isAlive).toBe(false);
  });

  it("Kapıcı locking the target's house blocks the çete attack (target survives, not a saved event)", () => {
    const { room, ids } = makeRoom([
      "tefeci_basi", "kapici", "komsu", "komsu",
    ]);
    const targetId = ids[2];
    const kapiciId = ids[1];

    triggerNight(room, (r) => {
      r.ceteVotes[ids[0]] = targetId;
      r.nightActions.push({ actorId: kapiciId, targetId, type: "kilit" });
    });

    expect(room.players.find((p) => p.id === targetId)!.isAlive).toBe(true);
    expect(room.morningEvents.some((e) => e.kind === "blocked")).toBe(true);
    expect(room.morningEvents.some((e) => e.kind === "saved")).toBe(false);
  });
});

describe("Hoca protection", () => {
  it("Hoca protects target even when target's house is locked by Kapıcı", () => {
    const { room, ids } = makeRoom([
      "tefeci_basi", "hoca", "kapici", "komsu", "komsu",
    ]);
    const targetId = ids[3];
    const hocaId = ids[1];
    const kapiciId = ids[2];

    triggerNight(room, (r) => {
      r.ceteVotes[ids[0]] = targetId;
      r.nightActions.push({ actorId: kapiciId, targetId, type: "kilit" });
      r.nightActions.push({ actorId: hocaId, targetId, type: "koruma_guclu" });
    });

    expect(room.players.find((p) => p.id === targetId)!.isAlive).toBe(true);
    expect(room.morningEvents.some((e) => e.kind === "saved")).toBe(true);
  });

  it("Hoca one-time-use: submitNightAction skips when hocaUsed=true", () => {
    const { room, ids } = makeRoom([
      "hoca", "komsu", "komsu", "tefeci_basi",
    ]);
    const hocaId = ids[0];
    const targetId = ids[1];

    room.hocaUsed = true;
    room.phase = "NIGHT_ROLE";
    room.nightOrderQueue = [{ roleId: "hoca", actorIds: [hocaId] }];
    room.nightStepIndex = 0;

    submitNightAction(room.code, hocaId, targetId);

    expect(room.nightActions.filter((a) => a.type === "koruma_guclu")).toHaveLength(0);
    expect(room.nightStepIndex).toBe(1);
  });
});

describe("Kumarbaz role swap", () => {
  it("permanently swaps two players' roles", () => {
    const { room, ids } = makeRoom([
      "kumarbaz", "komsu", "tefeci_basi", "komsu", "komsu",
    ]);
    const villager = ids[1];
    const mafia = ids[2];

    triggerNight(room, (r) => {
      r.nightActions.push({ actorId: ids[0], targetId: villager, type: "swap" });
      r.nightActions.push({ actorId: ids[0], targetId: mafia, type: "swap" });
    });

    expect(room.players.find((p) => p.id === villager)!.roleId).toBe("tefeci_basi");
    expect(room.players.find((p) => p.id === mafia)!.roleId).toBe("komsu");
    expect(
      room.kumarbazPairs.some(
        (pair) => pair.includes(villager) && pair.includes(mafia),
      ),
    ).toBe(true);
  });

  it("Kumarbaz swap before Şifacı: protection is applied based on playerId, not role", () => {
    // Şifacı protects player A; Kumarbaz swaps A (komsu) with B (mafia)
    // After swap: A has mafia role, B has komsu role.
    // Protection is on A (by playerId) → A survives despite getting a mafia role.
    const { room, ids } = makeRoom([
      "kumarbaz", "otaci", "tefeci_basi", "komsu", "komsu",
    ]);
    const playerA = ids[3]; // will be swapped, Şifacı protects this playerId
    const playerB = ids[2]; // tefeci_basi, will be swapped
    const otaciId = ids[1];

    triggerNight(room, (r) => {
      // Kumarbaz swaps A (komsu) ↔ B (tefeci_basi)
      r.nightActions.push({ actorId: ids[0], targetId: playerA, type: "swap" });
      r.nightActions.push({ actorId: ids[0], targetId: playerB, type: "swap" });
      // Çete votes to kill playerA (who after swap will have tefeci_basi role)
      r.ceteVotes[playerB] = playerA;
      // Şifacı protects playerA by playerId
      r.nightActions.push({ actorId: otaciId, targetId: playerA, type: "koruma" });
    });

    // After swap: playerA has tefeci_basi, playerB has komsu
    expect(room.players.find((p) => p.id === playerA)!.roleId).toBe("tefeci_basi");
    // Şifacı protected playerA so they should survive the çete attack
    expect(room.players.find((p) => p.id === playerA)!.isAlive).toBe(true);
    expect(room.morningEvents.some((e) => e.kind === "saved")).toBe(true);
  });

  it("Kumarbaz wins when 3 or fewer players remain alive", () => {
    const { room, ids } = makeRoom([
      "kumarbaz", "komsu", "komsu", "tefeci_basi",
    ]);
    room.players[2].isAlive = false;

    triggerNight(room, (r) => {
      r.ceteVotes[ids[3]] = ids[1];
    });

    expect(room.phase).toBe("ENDED");
    expect(room.winner).toBe("kumarbaz");
  });
});

describe("Kırık Kalp chain death", () => {
  it("Kırık Kalp dies when their loved one is killed at night", () => {
    const { room, ids } = makeRoom([
      "tefeci_basi", "komsu", "komsu", "kirik_kalp", "komsu",
    ]);
    const lovedId = ids[1];
    const kkId = ids[3];

    room.kirikKalpBonds[kkId] = lovedId;

    triggerNight(room, (r) => {
      r.ceteVotes[ids[0]] = lovedId;
    });

    expect(room.players.find((p) => p.id === lovedId)!.isAlive).toBe(false);
    expect(room.players.find((p) => p.id === kkId)!.isAlive).toBe(false);
    const kkGrave = room.graveyard.find((g) => g.playerId === kkId);
    expect(kkGrave).toBeDefined();
    expect(kkGrave!.cause).toContain("Kırık Kalp");
  });

  it("Kırık Kalp dies when their loved one is lynched", () => {
    const { room, ids } = makeRoom([
      "tefeci_basi", "komsu", "komsu", "kirik_kalp", "komsu",
    ]);
    const lovedId = ids[1];
    const kkId = ids[3];

    room.kirikKalpBonds[kkId] = lovedId;

    triggerVote(room, {
      [ids[0]]: lovedId,
      [ids[2]]: lovedId,
      [ids[4]]: lovedId,
    });

    expect(room.players.find((p) => p.id === lovedId)!.isAlive).toBe(false);
    expect(room.players.find((p) => p.id === kkId)!.isAlive).toBe(false);
  });

  it("Kırık Kalp wins when both are the final two survivors", () => {
    // Pre-kill all players except kirik_kalp and their loved one
    const { room, ids } = makeRoom([
      "kirik_kalp", "komsu", "komsu", "tefeci_basi",
    ]);
    const kkId = ids[0];
    const lovedId = ids[1];

    room.kirikKalpBonds[kkId] = lovedId;
    // Kill all others so only KK and loved remain
    room.players[2].isAlive = false;
    room.players[3].isAlive = false;

    // Night with no actions → resolveMorning → checkWin sees aliveCount=2 with KK+loved
    triggerNight(room, (_r) => {});

    expect(room.phase).toBe("ENDED");
    expect(room.winner).toBe("kirik_kalp");
  });
});

describe("Anonim win condition", () => {
  it("Anonim wins when 3 marked players are lynched while alive", () => {
    const { room, ids } = makeRoom([
      "anonim", "komsu", "komsu", "komsu", "komsu",
      "komsu", "komsu", "tefeci_basi",
    ]);
    const anonimId = ids[0];
    const mark1 = ids[1];
    const mark2 = ids[2];
    const mark3 = ids[3];

    room.anonimMarks[anonimId] = [mark1, mark2, mark3];
    room.anonimLynchedCounts[anonimId] = 2;

    // Simulate first 2 already dead/lynched; mark3 still alive
    room.players.find((p) => p.id === mark1)!.isAlive = false;
    room.players.find((p) => p.id === mark2)!.isAlive = false;

    // Lynch the 3rd marked player → Anonim wins
    triggerVote(room, {
      [ids[0]]: mark3,
      [ids[4]]: mark3,
      [ids[5]]: mark3,
      [ids[6]]: mark3,
    });

    expect(room.phase).toBe("ENDED");
    expect(room.winner).toBe("anonim");
  });

  it("Anonim does NOT win when dead before the 3rd mark is lynched", () => {
    const { room, ids } = makeRoom([
      "anonim", "komsu", "komsu", "komsu", "komsu",
      "komsu", "komsu", "tefeci_basi",
    ]);
    const anonimId = ids[0];
    const mark3 = ids[3];

    room.anonimMarks[anonimId] = [ids[1], ids[2], mark3];
    room.anonimLynchedCounts[anonimId] = 2;

    // Anonim is dead before the 3rd lynching
    room.players.find((p) => p.id === anonimId)!.isAlive = false;

    triggerVote(room, {
      [ids[4]]: mark3,
      [ids[5]]: mark3,
      [ids[6]]: mark3,
    });

    expect(room.winner).not.toBe("anonim");
  });
});

describe("Savaş Gazisi Dede", () => {
  it("Savaş Gazisi Dede kills independently and is NOT blocked by Kapıcı lock", () => {
    const { room, ids } = makeRoom([
      "savas_gazisi_dede", "tefeci_basi", "kapici", "komsu", "komsu",
    ]);
    const targetId = ids[3];
    const dedeId = ids[0];
    const kapiciId = ids[2];

    triggerNight(room, (r) => {
      r.nightActions.push({ actorId: kapiciId, targetId, type: "kilit" });
      r.nightActions.push({ actorId: dedeId, targetId, type: "bagimsiz_oldurme" });
    });

    expect(room.players.find((p) => p.id === targetId)!.isAlive).toBe(false);
  });

  it("Savaş Gazisi Dede kill IS blocked by Şifacı protection", () => {
    const { room, ids } = makeRoom([
      "savas_gazisi_dede", "otaci", "komsu", "komsu", "tefeci_basi",
    ]);
    const targetId = ids[2];
    const dedeId = ids[0];
    const otaciId = ids[1];

    triggerNight(room, (r) => {
      r.nightActions.push({ actorId: dedeId, targetId, type: "bagimsiz_oldurme" });
      r.nightActions.push({ actorId: otaciId, targetId, type: "koruma" });
    });

    expect(room.players.find((p) => p.id === targetId)!.isAlive).toBe(true);
    expect(room.morningEvents.some((e) => e.kind === "saved")).toBe(true);
  });

  it("Savaş Gazisi Dede wins as the sole survivor", () => {
    const { room, ids } = makeRoom([
      "savas_gazisi_dede", "komsu", "komsu", "tefeci_basi",
    ]);

    room.players[1].isAlive = false;
    room.players[2].isAlive = false;

    triggerNight(room, (r) => {
      r.nightActions.push({
        actorId: ids[0],
        targetId: ids[3],
        type: "bagimsiz_oldurme",
      });
    });

    expect(room.phase).toBe("ENDED");
    expect(room.winner).toBe("savas_gazisi_dede");
  });
});

describe("Quiet night", () => {
  it("night with no actions produces a calm morning event", () => {
    const { room } = makeRoom(["komsu", "komsu", "komsu", "tefeci_basi"]);

    triggerNight(room, (_r) => {});

    expect(room.morningEvents.some((e) => e.kind === "calm")).toBe(true);
  });
});

describe("14. Host transfer mechanics", () => {
  it("voice prompt re-queued when host disconnects mid-night", () => {
    const { room, ids } = makeRoom(["komsu", "bekci", "komsu", "tefeci_basi"]);

    room.phase = "NIGHT_ROLE";
    room.nightStepIndex = 0;
    room.nightOrderQueue = [{ roleId: "bekci", actorIds: [ids[1]] }];
    room.voiceQueue = [];

    const hostPlayer = room.players.find((p) => p.isHost)!;
    const hostSocketId = hostPlayer.socketId!;

    // Give non-host players sockets so a new host can be found
    room.players.forEach((p) => {
      if (!p.isHost) p.socketId = uniqueSocket();
    });

    leaveRoom(hostSocketId);

    expect(room.voiceQueue.length).toBeGreaterThan(0);
    expect(room.voiceQueue.some((v) => v.includes("Bekçi"))).toBe(true);
  });

  it("originalHostId cleared after intentional transferHost()", () => {
    const { room, ids } = makeRoom(["komsu", "komsu", "komsu", "tefeci_basi"]);
    room.phase = "DAY";
    const hostId = room.hostId;
    const targetId = room.players.find((p) => !p.isHost)!.id;

    // Pre-set originalHostId to simulate a previous auto-transfer
    room.originalHostId = ids[0];

    const res = transferHost(room.code, hostId, targetId);
    expect("error" in res).toBe(false);
    expect(room.originalHostId).toBeUndefined();
  });
});

describe("15. restartGame() full reset", () => {
  it("all extended state fields reset to initial values", () => {
    const { room } = makeRoom(["komsu", "komsu", "komsu", "tefeci_basi"]);
    const hostId = room.hostId;

    // Dirty the extended state
    room.kiskancLastCopied["some-id"] = "other-id";
    room.innocentLynchedCount = 3;
    room.personalAchievements = [{ playerId: "p1", roleId: "kiskanc_komsu", label: "Test" }];
    room.nextLynchReversed = true;
    room.hocaUsed = true;

    restartGame(room.code, hostId);

    expect(room.kiskancLastCopied).toEqual({});
    expect(room.innocentLynchedCount).toBe(0);
    expect(room.personalAchievements).toEqual([]);
    expect(room.nextLynchReversed).toBe(false);
    expect(room.hocaUsed).toBe(false);
    expect(room.phase).toBe("LOBBY");
  });
});

describe("16. Muhabir death reveals messages", () => {
  it("Muhabir killed at night produces death morningEvent", () => {
    const { room, ids } = makeRoom(["tefeci_basi", "muhabir", "komsu", "komsu"]);
    const muhabirId = ids[1];

    triggerNight(room, (r) => {
      r.ceteVotes[ids[0]] = muhabirId;
    });

    expect(room.players.find((p) => p.id === muhabirId)!.isAlive).toBe(false);
    // Death event should mention the Muhabir role name
    const deathEvent = room.morningEvents.find(
      (e) => e.kind === "death" && e.message.includes("Muhabir"),
    );
    expect(deathEvent).toBeDefined();
  });

  it("Muhabir lynched produces death morningEvent", () => {
    const { room, ids } = makeRoom(["muhabir", "komsu", "komsu", "tefeci_basi"]);
    const muhabirId = ids[0];

    triggerVote(room, {
      [ids[1]]: muhabirId,
      [ids[2]]: muhabirId,
      [ids[3]]: muhabirId,
    });

    expect(room.players.find((p) => p.id === muhabirId)!.isAlive).toBe(false);
    const grave = room.graveyard.find((g) => g.playerId === muhabirId);
    expect(grave).toBeDefined();
  });
});

describe("17. Tiyatrocu fake role on death", () => {
  it("graveyard shows fake role on night kill", () => {
    const { room, ids } = makeRoom(["tefeci_basi", "tiyatrocu", "komsu", "komsu"]);
    const tiyatrocuId = ids[1];
    room.tiyatrocuFakeRoles[tiyatrocuId] = "falci";

    triggerNight(room, (r) => {
      r.ceteVotes[ids[0]] = tiyatrocuId;
    });

    expect(room.players.find((p) => p.id === tiyatrocuId)!.isAlive).toBe(false);
    const grave = room.graveyard.find((g) => g.playerId === tiyatrocuId);
    expect(grave).toBeDefined();
    expect(grave!.roleId).toBe("falci");
    // Real role still stored in players array
    expect(room.players.find((p) => p.id === tiyatrocuId)!.roleId).toBe("tiyatrocu");
  });

  it("graveyard shows fake role on lynch", () => {
    const { room, ids } = makeRoom(["tiyatrocu", "komsu", "komsu", "tefeci_basi"]);
    const tiyatrocuId = ids[0];
    room.tiyatrocuFakeRoles[tiyatrocuId] = "bekci";

    triggerVote(room, {
      [ids[1]]: tiyatrocuId,
      [ids[2]]: tiyatrocuId,
      [ids[3]]: tiyatrocuId,
    });

    const grave = room.graveyard.find((g) => g.playerId === tiyatrocuId);
    expect(grave).toBeDefined();
    expect(grave!.roleId).toBe("bekci");
    expect(room.players.find((p) => p.id === tiyatrocuId)!.roleId).toBe("tiyatrocu");
  });
});

describe("18. rolePackage filtresi", () => {
  it("standard pakette kaos/tarafsız rol yok", () => {
    const pool = buildRolePool(8, { rolePackage: "standard" });
    const kaosRoles = ["kumarbaz", "kiskanc_komsu", "kirik_kalp", "dedikoducu"];
    const tarafsizRoles = ["anonim", "savas_gazisi_dede"];
    expect(pool.some((r) => kaosRoles.includes(r))).toBe(false);
    expect(pool.some((r) => tarafsizRoles.includes(r))).toBe(false);
  });

  it("standard pakette tiyatrocu/falci yok", () => {
    const pool = buildRolePool(8, { rolePackage: "standard" });
    expect(pool.includes("tiyatrocu")).toBe(false);
    expect(pool.includes("falci")).toBe(false);
  });

  it("all pakette 25 oyuncuyla pool 25 uzunluğunda", () => {
    const pool = buildRolePool(25, { rolePackage: "all" });
    expect(pool.length).toBe(25);
  });

  it("pool uzunluğu her zaman playerCount kadar", () => {
    for (const n of [4, 8, 14, 20, 30]) {
      const pool = buildRolePool(n, { rolePackage: "all" });
      expect(pool.length).toBe(n);
    }
  });
});

describe("19. Rol dağılım dengesi", () => {
  it("4 oyuncuda sadece 1 kötü rol var", () => {
    const EVIL = ["tefeci_basi", "tahsildar", "sahte_dernek", "icten_pazarlikli"];
    const pool = buildRolePool(4, { rolePackage: "all" });
    const evil = pool.filter((r) => EVIL.includes(r));
    expect(pool.length).toBe(4);
    expect(evil.length).toBe(1);
  });

  it("4 oyuncuda çete iyi oyuncudan az", () => {
    const EVIL = ["tefeci_basi", "tahsildar", "sahte_dernek", "icten_pazarlikli"];
    const GOOD = ["bekci", "otaci", "falci", "kapici", "muhtar", "muhabir", "tiyatrocu", "hoca", "komsu"];
    const pool = buildRolePool(4, { rolePackage: "all" });
    const evil = pool.filter((r) => EVIL.includes(r));
    const good = pool.filter((r) => GOOD.includes(r));
    expect(evil.length).toBeLessThan(good.length);
  });

  it("8 oyuncuda çete iyi oyuncudan az", () => {
    const EVIL = ["tefeci_basi", "tahsildar", "sahte_dernek", "icten_pazarlikli"];
    const GOOD = ["bekci", "otaci", "falci", "kapici", "muhtar", "muhabir", "tiyatrocu", "hoca", "komsu"];
    const pool = buildRolePool(8, { rolePackage: "all" });
    const evil = pool.filter((r) => EVIL.includes(r));
    const good = pool.filter((r) => GOOD.includes(r));
    expect(evil.length).toBeLessThan(good.length);
  });

  it("her oyuncu sayısında pool.length === playerCount", () => {
    [4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 25, 30].forEach((n) => {
      const pool = buildRolePool(n, { rolePackage: "all" });
      expect(pool.length).toBe(n);
    });
  });

  it("4 oyuncuda 'koylu' rolü artık yok, 'komsu' var", () => {
    const pool = buildRolePool(4, { rolePackage: "all" });
    expect(pool.includes("koylu")).toBe(false);
    expect(pool.some((r) => r === "komsu")).toBe(true);
  });

  it("her sayıda evil < good (denge garantisi)", () => {
    const EVIL = ["tefeci_basi", "tahsildar", "sahte_dernek", "icten_pazarlikli"];
    const GOOD = ["bekci", "otaci", "falci", "kapici", "muhtar", "muhabir", "tiyatrocu", "hoca", "komsu"];
    [4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 25, 30].forEach((n) => {
      const pool = buildRolePool(n, { rolePackage: "all" });
      const evil = pool.filter((r) => EVIL.includes(r)).length;
      const good = pool.filter((r) => GOOD.includes(r)).length;
      expect(evil).toBeLessThan(good);
    });
  });
});

describe("20. Lobby fazında host reconnect", () => {
  it("LOBBY fazında ayrılan host geri bağlanınca host statüsü restore edilir", () => {
    const { room, ids } = makeRoom(["komsu", "komsu", "komsu", "komsu"]);

    // Simüle: host bağlantısını kesti, geçici host belirlendi
    const hostId = ids[0];
    room.phase = "LOBBY";
    room.players[0].isConnected = false;
    room.players[0].isHost = false;
    room.players[1].isHost = true;
    room.hostId = ids[1];
    room.originalHostId = hostId;

    // Orijinal host aynı nickname ile geri bağlanıyor
    const result = joinRoom(room.code, "restored-socket", room.players[0].nickname);
    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.hostRestored).toBe(true);
    expect(room.players[0].isHost).toBe(true);
    expect(room.players[1].isHost).toBe(false);
    expect(room.hostId).toBe(hostId);
    expect(room.originalHostId).toBeUndefined();
  });
});
