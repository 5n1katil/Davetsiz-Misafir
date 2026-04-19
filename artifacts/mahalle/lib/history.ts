import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "mahalle:game_history";
const MAX_RECORDS = 100;

export interface GameRecord {
  id: string;
  playedAt: number;
  winner: string;
  myRoleId: string;
  myTeam: string;
  won: boolean;
  playerCount: number;
  rounds: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  mahalleGames: number;
  mahalleWins: number;
  ceteGames: number;
  ceteWins: number;
  roleCounts: Record<string, number>;
  mostPlayedRoleId: string | null;
  recentGames: GameRecord[];
}

export async function loadHistory(): Promise<GameRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameRecord[];
  } catch {
    return [];
  }
}

export async function saveGameRecord(record: Omit<GameRecord, "id">): Promise<void> {
  try {
    const history = await loadHistory();
    const newRecord: GameRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    const updated = [newRecord, ...history].slice(0, MAX_RECORDS);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
  }
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

export function computeStats(history: GameRecord[]): PlayerStats {
  const gamesPlayed = history.length;
  const wins = history.filter((g) => g.won).length;
  const losses = gamesPlayed - wins;
  const winRate = gamesPlayed > 0 ? wins / gamesPlayed : 0;

  const mahalleGames = history.filter((g) => g.myTeam === "iyi").length;
  const mahalleWins = history.filter((g) => g.myTeam === "iyi" && g.won).length;
  const ceteGames = history.filter((g) => g.myTeam === "kotu").length;
  const ceteWins = history.filter((g) => g.myTeam === "kotu" && g.won).length;

  const roleCounts: Record<string, number> = {};
  for (const g of history) {
    roleCounts[g.myRoleId] = (roleCounts[g.myRoleId] ?? 0) + 1;
  }

  let mostPlayedRoleId: string | null = null;
  let maxCount = 0;
  for (const [id, count] of Object.entries(roleCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostPlayedRoleId = id;
    }
  }

  return {
    gamesPlayed,
    wins,
    losses,
    winRate,
    mahalleGames,
    mahalleWins,
    ceteGames,
    ceteWins,
    roleCounts,
    mostPlayedRoleId,
    recentGames: history.slice(0, 20),
  };
}
