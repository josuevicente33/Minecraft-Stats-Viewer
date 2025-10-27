import path from "node:path";
import { safeJson, listFiles } from "./fsutil.js";
import type { StatsRaw, PrettyStats, PlayerRow } from "./types.js";

export type NameMaps = { byUUID: Map<string,string>; byName: Map<string,string> };

export function prettyStats(raw: StatsRaw): PrettyStats {
  const g = raw?.stats ?? {};
  const v = (ns: string, key: string, d = 0) => g?.[ns]?.[key] ?? d;
  return {
    playTime:     v("minecraft:custom","minecraft:play_time"),
    deaths:       v("minecraft:custom","minecraft:deaths"),
    mobKills:     v("minecraft:custom","minecraft:mob_kills"),
    playerKills:  v("minecraft:custom","minecraft:player_kills"),
    jumps:        v("minecraft:custom","minecraft:jump"),
    walkCm:       v("minecraft:custom","minecraft:walk_one_cm"),
    flyCm:        v("minecraft:custom","minecraft:fly_one_cm"),
  };
}

export async function loadUserCache(dataDir: string): Promise<NameMaps> {
  const arr = await safeJson<{ name: string; uuid: string }[]>(path.join(dataDir,"usercache.json"), []);
  const byUUID = new Map(arr.map(x => [x.uuid?.replace(/-/g,""), x.name]));
  const byName = new Map(arr.map(x => [x.name, (x.uuid ?? "").replace(/-/g,"")]));
  return { byUUID, byName };
}

export async function listPlayers(worldDir: string, maps: NameMaps): Promise<PlayerRow[]> {
  const files = await listFiles(path.join(worldDir,"stats"), ".json");
  return files.map(f => f.slice(0,-5)).map(uuid => ({ uuid, name: maps.byUUID.get(uuid) ?? uuid }));
}

export async function readPlayerStats(worldDir: string, uuidNoDash: string): Promise<PrettyStats> {
  const raw = await safeJson<StatsRaw>(path.join(worldDir,"stats",`${uuidNoDash}.json`), {});
  return prettyStats(raw);
}

export function parseListOutput(s: string) {
  const m = /There are (\d+) of a max of (\d+) players online: ?(.*)/.exec(s);
  const names = m?.[3] ? m[3].split(",").map(x => x.trim()).filter(Boolean) : [];
  return { online: Number(m?.[1] ?? 0), max: Number(m?.[2] ?? 0), names };
}

export const ticksToHours = (ticks: number) => ticks / 72000;
