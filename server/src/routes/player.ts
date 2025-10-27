import type http from "node:http";
import { MOCK } from "../config.js";
import { getCache, setCache } from "../cache.js";
import { sendJSON } from "../lib/response.js";
import { loadUserCache, readAdvancements, readPlayerStatsRaw, worldHasStats, loadUserCacheWithSeen } from "../services/world.js";
import { extractProfile } from "../services/profile.js";

const MOCK_STATS: Record<string, any> = {
    Steve: { playTime: 720000, deaths: 2, mobKills: 150, playerKills: 1, jumps: 500, walkCm: 500000, flyCm: 120000 },
    Alex:  { playTime: 360000, deaths: 5, mobKills: 75,  playerKills: 0, jumps: 200, walkCm: 210000, flyCm:  40000 },
};
const MOCK_NAMES = ["Steve", "Alex", "Herobrine"];

export async function playerHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    const key = decodeURIComponent((req.url || "").split("/").pop() || "");
    const cacheKey = `player:${key}`;
    const cached = getCache(cacheKey);
    if (cached) return sendJSON(res, 200, cached);

    if (MOCK || !(await worldHasStats())) {
        const name = (MOCK_NAMES.includes(key) ? key : "Steve") as keyof typeof MOCK_STATS;
        const payload = { name, uuid: "mock", stats: MOCK_STATS[name], advancements: null };
        setCache(cacheKey, payload);
        return sendJSON(res, 200, payload);
    }

    const maps = await loadUserCacheWithSeen();
    const uuid = (maps.byName.get(key) ?? key).replace(/-/g, "");

    const raw = await readPlayerStatsRaw(uuid);
    const profile = extractProfile(raw);

    const adv = await readAdvancements(uuid);
    const name = maps.byUUID.get(uuid) ?? key;

    const lastSeen = maps.lastSeen ? maps.lastSeen.get(uuid) || null : null;

    const payload = { 
        name, 
        uuid,
        lastSeen,
        stats: profile.totals, 
        top: profile.top, 
        advancements: adv
    };
    setCache(cacheKey, payload);
    sendJSON(res, 200, payload);
}
