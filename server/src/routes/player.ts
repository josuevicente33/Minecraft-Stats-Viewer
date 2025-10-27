import type http from "node:http";
import { getCache, setCache } from "../cache.js";
import { sendJSON } from "../lib/response.js";
import { readAdvancements, readPlayerStatsRaw, loadUserCacheWithSeen } from "../services/world.js";
import { extractProfile } from "../services/profile.js";
import { latestCriteriaTime } from "../lib/util.js";

export async function playerHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    const rawURL = req.url || "/";
    const key = decodeURIComponent(rawURL.split("/").pop() || "");

    const cacheKey = `player:${key}:`;
    const cached = getCache(cacheKey);
    if (cached) return sendJSON(res, 200, cached);

    const maps = await loadUserCacheWithSeen()

    const rawUUID = (maps.byName.get(key) ?? key);
    const uuid = (maps.byName.get(key) ?? key).replace(/-/g, "");

    const raw = await readPlayerStatsRaw(rawUUID);
    const profile = extractProfile(raw);
    const advMap = await readAdvancements(rawUUID);

    const name = maps.byUUID.get(uuid) ?? key;
    const lastSeen = maps.lastSeen ? maps.lastSeen.get(uuid) || null : null;

    const allAdv: { id: string; when: string }[] = Object.entries(advMap || {}).flatMap(([id, v]: any) => {
      const when = latestCriteriaTime(v);
      return when ? [{ id, when }] : [];
    });

    allAdv.sort((a, b) => String(b.when).localeCompare(String(a.when)));
    const recent = allAdv.slice(0, 5);

    const payload = { 
        name, 
        uuid,
        lastSeen,
        stats: profile.totals, 
        top: profile.top, 
        advancements: {
            total: allAdv.length,
            recent,
        }
    };
    setCache(cacheKey, payload);
    sendJSON(res, 200, payload);
}
