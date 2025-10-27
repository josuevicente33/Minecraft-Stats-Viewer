export type PlayerRow = { uuid: string; name: string };
export type StatsRaw = { stats?: Record<string, Record<string, number>> };

export type PrettyStats = {
  playTime: number;
  deaths: number;
  mobKills: number;
  playerKills: number;
  jumps: number;
  walkCm: number;
  flyCm: number;
};

export type StatusOut = { online: number; max: number; names: string[]; raw?: string };
