import fs from "node:fs/promises";
import path from "node:path";
import { ORIGIN_DATA, ORIGIN_WORLD } from "../config.js";
import { ticksToClock, mapDiff, mapGameType } from "../lib/util.js";

// FOR INITIAL LOAD
export async function worldHasStats(): Promise<boolean> {
    try {
        const dir = path.join(ORIGIN_WORLD, "stats");
        const files = await fs.readdir(dir);
        return files.some(f => f.endsWith(".json"));
    } catch { return false; }
}

export async function readJSON<T=any>(p: string, fallback: T): Promise<T> {
    try { return JSON.parse(await fs.readFile(p, "utf8")) as T; }
    catch { return fallback; }
}

export async function loadUserCache() {
    type Row = { name: string; uuid: string };
    const rows = await readJSON<Row[]>(path.join(ORIGIN_DATA, "usercache.json"), []);
    const byUUID = new Map(rows.map(x => [x.uuid?.replace(/-/g, ""), x.name]));
    const byName = new Map(rows.map(x => [x.name, (x.uuid ?? "").replace(/-/g, "")]));
    return { byUUID, byName };
}

export async function listPlayerUUIDs(): Promise<string[]> {
    try {
        const dir = path.join(ORIGIN_WORLD, "stats");
        const files = (await fs.readdir(dir)).filter(f => f.endsWith(".json"));
        return files.map(f => f.slice(0, -5));
    } catch { return []; }
}

export async function readPlayerStatsRaw(uuidNoDash: string) {
    const p = path.join(ORIGIN_WORLD, "stats", `${uuidNoDash}.json`);
    return readJSON<any>(p, {});
}

export async function readAdvancements(uuidNoDash: string) {
    const p = path.join(ORIGIN_WORLD, "advancements", `${uuidNoDash}.json`);
    console.log("Reading advancements from", p);
    console.log("uUId no dash:", uuidNoDash);
    return readJSON<any>(p, null);
}

export async function loadUserCacheWithSeen() {
    type Row = { name: string; uuid: string; expiresOn?: string };
    const rows = await readJSON<Row[]>(path.join(ORIGIN_DATA,"usercache.json"), []);
    const byUUID = new Map(rows.map(x => [x.uuid?.replace(/-/g,""), x.name]));
    const byName = new Map(rows.map(x => [x.name, (x.uuid ?? "").replace(/-/g,"")]));
    const lastSeen = new Map(rows.map(x => [x.uuid?.replace(/-/g,""), x.expiresOn || null]));
    return { byUUID, byName, lastSeen };
}


// FOR WORLD STATS
import { readLevelDat } from "./worldDAT.js";
import { rconGetTime, rconGetDifficulty, rconGetSeed, rconGetWorldBorder } from "./worldRCON.js";
import type { WorldOverview, WorldProgression, WorldPerf, RecentEvent } from "../types/world.js";
import { computeWorldProgression } from "./progression.js";
import { readRecentEvents } from "./events.js";
import { cget, cset } from "../lib/cache.js";

export async function getWorldOverview(): Promise<WorldOverview> {
  const cached = cget<WorldOverview>("world:overview");
  if (cached) return cached;

  const [ldP, timeP, diffP, seedP, wbP] = await Promise.allSettled([
    readLevelDat(ORIGIN_WORLD),
    rconGetTime(),
    rconGetDifficulty(),
    rconGetSeed(),
    rconGetWorldBorder(),
  ]);

  const l    = ldP.status === "fulfilled" ? ldP.value : null;
  const time = timeP.status === "fulfilled" ? timeP.value : null;
  const diff = diffP.status === "fulfilled" ? diffP.value : null;
  const seed = seedP.status === "fulfilled" ? seedP.value : null;
  const wb   = wbP.status === "fulfilled" ? wbP.value   : null;

  const overview: WorldOverview = {
    seed:           seed ?? l?.seed ?? null,
    day:            time?.day ?? Math.floor((l?.worldAgeTicks ?? 0) / 24000),
    timeOfDay:      ticksToClock(time?.daytime ?? l?.dayTimeTicks ?? 0),
    weather:        l ? (l.weather.thundering ? "thunder" : l.weather.raining ? "rain" : "clear") : "clear",
    difficulty:     diff ?? mapDiff(l?.difficulty ?? 2),
    gamemode:       mapGameType(l?.gameType ?? 0),
    spawn:          l?.spawn ?? { x: 0, y: 64, z: 0 },
    worldAgeTicks:  l?.worldAgeTicks ?? time?.gametime ?? 0,
    version:        l?.versionName ?? "unknown",
    worldBorder: { 
      size: wb?.size ?? l?.border.size ?? 6e7, 
      center: { x: l?.border.centerX ?? 0, z: l?.border.centerZ ?? 0 } },
      loadedChunks: undefined,
      entityCounts: undefined,
  };

  return cset("world:overview", overview, 3_000);
}

export async function getWorldProgression(): Promise<WorldProgression> {
  const cached = cget<WorldProgression>("world:progression");
  if (cached) return cached;

  const data = await computeWorldProgression();
  return cset("world:progression", data, 10_000);
}

export async function getWorldPerformance(): Promise<WorldPerf> {
  const cached = cget<WorldPerf>("world:perf"); if (cached) return cached;
  const data: WorldPerf = {
    tps: 20.0, uptimeSec: 0, ramMB: { used: 0, max: 0 }, cpuLoad: undefined, avgLatencyMs: undefined,
  };
  return cset("world:perf", data, 2_000);
}

export async function getRecentEvents(limit = 20): Promise<RecentEvent[]> {
  const key = `world:events:${limit}`;
  const cached = cget<RecentEvent[]>(key);
  if (cached) return cached;

  const data = await readRecentEvents(limit);
  return cset(key, data, 2_000);
}