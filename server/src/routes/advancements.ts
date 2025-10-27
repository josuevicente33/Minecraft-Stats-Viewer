import type http from "node:http";
import { sendJSON } from "../lib/response.js";
import { loadUserCacheWithSeen, readAdvancements } from "../services/world.js";
import { getAdvCatalog } from "../services/advCatalog.js";
import { MOCK } from "../config.js";

export const MOCK_ADV_MAP: Record<string, any> = {
    // "minecraft:story/mine_stone": {
    //     done: "2025-10-25T12:00:00Z",
    //     criteria: { any: "2025-10-25T12:00:00Z" },
    // },
    // "minecraft:adventure/kill_a_mob": {
    //     done: "2025-10-26T15:30:00Z",
    //     criteria: { any: "2025-10-26T15:30:00Z" },
    // },
    // "minecraft:nether/return_to_sender": {
    //     done: "2025-10-26T18:45:00Z",
    //     criteria: { any: "2025-10-26T18:45:00Z" },
    // },
    // // use valid End IDs:
    // "minecraft:end/kill_dragon": {
    //     done: "2025-10-26T20:00:00Z",
    //     criteria: { any: "2025-10-26T20:00:00Z" },
    // },
    // "minecraft:end/dragon_egg": {
    //     done: "2025-10-26T20:00:00Z",
    //     criteria: { any: "2025-10-26T20:00:00Z" },
    // },
    // "minecraft:adventure/adventuring_time": {
    //     done: "2025-10-26T20:00:00Z",
    //     criteria: { any: "2025-10-26T20:00:00Z" },
    // },
    // "minecraft:story/enter_the_nether": {
    //     done: "2025-10-26T20:00:00Z",
    //     criteria: { any: "2025-10-26T20:00:00Z" },
    // },
    // "minecraft:story/enter_the_end": {
    //     done: "2025-10-26T20:00:00Z",
    //     criteria: { any: "2025-10-26T20:00:00Z" },
    // },
    // "minecraft:story/upgrade_tools": {
    //     done: "2025-10-26T20:00:00Z",
    //     criteria: { any: "2025-10-26T20:00:00Z" },
    // },
    // "minecraft:story/smelt_iron": {
    //     done: "2025-10-26T20:00:00Z",
    //     criteria: { any: "2025-10-26T20:00:00Z" },
    // },
    // "minecraft:story/prepare_to_ride": {
    //     done: "2025-10-26T20:00:00Z",
    //     criteria: { any: "2025-10-26T20:00:00Z" },
    // },
};

function latestCriteriaTime(v: any): string | null {
    if (typeof v?.done === "string") return v.done;
    const crit = v?.criteria && Object.values(v.criteria);

    if (Array.isArray(crit) && crit.length) {
        return crit.reduce((a: string, b: string) => (a > b ? a : b));
    }
    if (Array.isArray(v?.granted) && v.granted.length) return v.granted.reduce((a: string, b: string) => (a > b ? a : b));
    if (v?.done === true) return "true";
    return null;
}

function parentGetter(catalog: { id: string; parent?: string | null }[]) {
  const byId = new Map(catalog.map(x => [x.id, x.parent ?? null]));
  return (id: string) => byId.get(id) ?? null;
}

type AdvState = "done" | "available" | "locked";
function computeState(id: string, doneSet: Set<string>, parentOf: (id: string) => string | null): AdvState {
    if (doneSet.has(id)) return "done";
    const p = parentOf(id);
    if (!p) return "available";
    return doneSet.has(p) ? "available" : "locked";
}


export async function playerAdvancementsHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    const rawUrl = req.url || "/";
    const key = decodeURIComponent(rawUrl.split("/").pop() || "");
    const maps = await loadUserCacheWithSeen();
    const uuid = (maps.byName.get(key) ?? key).replace(/-/g, "");

    const [catalog, advFromDisk] = await Promise.all([
        getAdvCatalog(),
        readAdvancements(uuid).then(v => v || {}),
    ]);

    let playerMap: Record<string, any> = advFromDisk;
    if (MOCK) {
        playerMap = { ...playerMap, ...MOCK_ADV_MAP };
    }

    const prelim = catalog.map(c => {
        const v: any = playerMap[c.id];
        const when = latestCriteriaTime(v);
        const done = Boolean(when);
        return { id: c.id, title: c.title || c.id, parent: c.parent ?? null, done, when: when || null };
    });

    const doneSet = new Set(prelim.filter(r => r.done).map(r => r.id));
    const parentOf = parentGetter(catalog);
    const rows = prelim.map(r => ({
        ...r,
        state: computeState(r.id, doneSet, parentOf) as AdvState,
    }));

    rows.sort((a, b) => {
        const order = (s: AdvState) => (s === "locked" ? 0 : s === "available" ? 1 : 2);
        const byState = order(a.state) - order(b.state);
        if (byState !== 0) return byState;
        return a.id.localeCompare(b.id);
    });

    const total = rows.length;
    const done = rows.filter(r => r.done).length;

    sendJSON(res, 200, { total, done, rows });
}
