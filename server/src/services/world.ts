import fs from "node:fs/promises";
import path from "node:path";
import { DATA_DIR, WORLD_DIR } from "../config.js";

export async function worldHasStats(): Promise<boolean> {
    try {
        const dir = path.join(WORLD_DIR, "stats");
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
    const rows = await readJSON<Row[]>(path.join(DATA_DIR, "usercache.json"), []);
    const byUUID = new Map(rows.map(x => [x.uuid?.replace(/-/g, ""), x.name]));
    const byName = new Map(rows.map(x => [x.name, (x.uuid ?? "").replace(/-/g, "")]));
    return { byUUID, byName };
}

export async function listPlayerUUIDs(): Promise<string[]> {
    try {
        const dir = path.join(WORLD_DIR, "stats");
        const files = (await fs.readdir(dir)).filter(f => f.endsWith(".json"));
        return files.map(f => f.slice(0, -5));
    } catch { return []; }
}

export async function readPlayerStatsRaw(uuidNoDash: string) {
    const p = path.join(WORLD_DIR, "stats", `${uuidNoDash}.json`);
    return readJSON<any>(p, {});
}

export async function readAdvancements(uuidNoDash: string) {
    const p = path.join(WORLD_DIR, "advancements", `${uuidNoDash}.json`);
    return readJSON<any>(p, null);
}

export async function loadUserCacheWithSeen() {
    type Row = { name: string; uuid: string; expiresOn?: string };
    const rows = await readJSON<Row[]>(path.join(DATA_DIR,"usercache.json"), []);
    const byUUID = new Map(rows.map(x => [x.uuid?.replace(/-/g,""), x.name]));
    const byName = new Map(rows.map(x => [x.name, (x.uuid ?? "").replace(/-/g,"")]));
    const lastSeen = new Map(rows.map(x => [x.uuid?.replace(/-/g,""), x.expiresOn || null]));
    return { byUUID, byName, lastSeen };
}
