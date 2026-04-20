import { describe, it, expect } from "vitest";
import {
  createRoom,
  joinRoom,
  tickPhaseTimeout,
  advanceFromNightIntro,
  submitNightAction,
  type Room,
} from "../gameEngine.js";

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
    const { room, ids } = makeRoom(["tefeci_basi", "koylu", "koylu", "koylu"]);

    triggerVote(room, {
      [ids[1]]: ids[0],
      [ids[2]]: ids[0],
      [ids[3]]: ids[0],
    });

    expect(room.phase).toBe("ENDED");
    expect(room.winner).toBe("iyi");
  });

  it("çete wins when mafia kills last villager majority at night", () => {
    const { room, ids } = makeRoom(["tefeci_basi", "tahsildar", "koylu", "koylu"]);

    triggerNight(room, (r) => {
      r.ceteVotes[ids[0]] = ids[2];
      r.ceteVotes[ids[1]] = ids[2];
    });

    expect(room.phase).toBe("ENDED");
    expect(room.winner).toBe("kotu");
  });

  it("çete wins when vote leaves mafia dominant", () => {
    const { room, ids } = makeRoom(["tefeci_basi", "koylu", "koylu", "koylu"]);
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
      "sahte_dernek", "koylu", "koylu", "koylu", "koylu",
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
      "sahte_dernek", "tefeci_basi", "koylu", "koylu", "koylu",
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
      "muhtar", "koylu", "koylu", "tefeci_basi", "koylu",
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
    const { room, ids } = makeRoom(["koylu", "koylu", "koylu", "tefeci_basi"]);
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
    const { room, ids } = makeRoom(["koylu", "koylu", "koylu", "tefeci_basi"]);
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
      "dedikoducu", "koylu", "koylu", "tefeci_basi", "koylu",
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
      "dedikoducu", "tefeci_basi", "koylu", "koylu",
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
      "tefeci_basi", "koylu", "koylu", "koylu", "koylu", "koylu",
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
      "sahte_dernek", "koylu", "koylu", "koylu", "koylu", "koylu",
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
      "tefeci_basi", "otaci", "koylu", "koylu",
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
      "tefeci_basi", "otaci", "kapici", "koylu", "koylu",
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
      "tefeci_basi", "kapici", "koylu", "koylu",
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
      "tefeci_basi", "hoca", "kapici", "koylu", "koylu",
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
      "hoca", "koylu", "koylu", "tefeci_basi",
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
      "kumarbaz", "koylu", "tefeci_basi", "koylu", "koylu",
    ]);
    const villager = ids[1];
    const mafia = ids[2];

    triggerNight(room, (r) => {
      r.nightActions.push({ actorId: ids[0], targetId: villager, type: "swap" });
      r.nightActions.push({ actorId: ids[0], targetId: mafia, type: "swap" });
    });

    expect(room.players.find((p) => p.id === villager)!.roleId).toBe("tefeci_basi");
    expect(room.players.find((p) => p.id === mafia)!.roleId).toBe("koylu");
    expect(
      room.kumarbazPairs.some(
        (pair) => pair.includes(villager) && pair.includes(mafia),
      ),
    ).toBe(true);
  });

  it("Kumarbaz swap before Şifacı: protection is applied based on playerId, not role", () => {
    // Şifacı protects player A; Kumarbaz swaps A (koylu) with B (mafia)
    // After swap: A has mafia role, B has koylu role.
    // Protection is on A (by playerId) → A survives despite getting a mafia role.
    const { room, ids } = makeRoom([
      "kumarbaz", "otaci", "tefeci_basi", "koylu", "koylu",
    ]);
    const playerA = ids[3]; // will be swapped, Şifacı protects this playerId
    const playerB = ids[2]; // tefeci_basi, will be swapped
    const otaciId = ids[1];

    triggerNight(room, (r) => {
      // Kumarbaz swaps A (koylu) ↔ B (tefeci_basi)
      r.nightActions.push({ actorId: ids[0], targetId: playerA, type: "swap" });
      r.nightActions.push({ actorId: ids[0], targetId: playerB, type: "swap" });
      // Çete votes to kill playerA (who after swap will have tefeci_basi role)
      r.ceteVotes[playerB] = playerA;
      // Şifacı protects playerA by playerId
      r.nightActions.push({ actorId: otaciId, targetId: playerA, type: "koruma" });
    });

    // After swap: playerA has tefeci_basi, playerB has koylu
    expect(room.players.find((p) => p.id === playerA)!.roleId).toBe("tefeci_basi");
    // Şifacı protected playerA so they should survive the çete attack
    expect(room.players.find((p) => p.id === playerA)!.isAlive).toBe(true);
    expect(room.morningEvents.some((e) => e.kind === "saved")).toBe(true);
  });

  it("Kumarbaz wins when 3 or fewer players remain alive", () => {
    const { room, ids } = makeRoom([
      "kumarbaz", "koylu", "koylu", "tefeci_basi",
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
      "tefeci_basi", "koylu", "koylu", "kirik_kalp", "koylu",
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
      "tefeci_basi", "koylu", "koylu", "kirik_kalp", "koylu",
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
      "kirik_kalp", "koylu", "koylu", "tefeci_basi",
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
      "anonim", "koylu", "koylu", "koylu", "koylu",
      "koylu", "koylu", "tefeci_basi",
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
      "anonim", "koylu", "koylu", "koylu", "koylu",
      "koylu", "koylu", "tefeci_basi",
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

describe("Kahraman Dede", () => {
  it("Kahraman Dede kills independently and is NOT blocked by Kapıcı lock", () => {
    const { room, ids } = makeRoom([
      "kahraman_dede", "tefeci_basi", "kapici", "koylu", "koylu",
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

  it("Kahraman Dede kill IS blocked by Şifacı protection", () => {
    const { room, ids } = makeRoom([
      "kahraman_dede", "otaci", "koylu", "koylu", "tefeci_basi",
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

  it("Kahraman Dede wins as the sole survivor", () => {
    const { room, ids } = makeRoom([
      "kahraman_dede", "koylu", "koylu", "tefeci_basi",
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
    expect(room.winner).toBe("kahraman_dede");
  });
});

describe("Quiet night", () => {
  it("night with no actions produces a calm morning event", () => {
    const { room } = makeRoom(["koylu", "koylu", "koylu", "tefeci_basi"]);

    triggerNight(room, (_r) => {});

    expect(room.morningEvents.some((e) => e.kind === "calm")).toBe(true);
  });
});
