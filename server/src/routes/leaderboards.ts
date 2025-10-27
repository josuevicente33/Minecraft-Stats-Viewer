import type http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { MOCK, WORLD_DIR } from "../config.js";
import { getCache, setCache } from "../cache.js";
import { sendJSON } from "../lib/response.js";
import { loadUserCache, readPlayerStatsRaw, worldHasStats } from "../services/world.js";
import { prettyStats } from "../services/profile.js";

const MOCK_STATS = {
    Steve: { playTime: 720000, deaths: 2, mobKills: 150 },
    Alex:  { playTime: 360000, deaths: 5, mobKills: 75  }
};

export async function leaderboardsHandler(_req: http.IncomingMessage, res: http.ServerResponse) {
    const cached = getCache("leaderboards");
    if (cached) return sendJSON(res, 200, cached);

    if (MOCK || !(await worldHasStats())) {
        const rows = [
        { name: "Steve", uuid: "a".repeat(32), ...MOCK_STATS.Steve },
        { name: "Alex",  uuid: "b".repeat(32), ...MOCK_STATS.Alex  },
        ].sort((a,b)=>b.playTime-a.playTime);
        setCache("leaderboards", rows);
        return sendJSON(res, 200, rows);
    }

    const maps = await loadUserCache();
    const statFiles = (await fs.readdir(path.join(WORLD_DIR, "stats"))).filter(f => f.endsWith(".json"));
    const rows: Array<{ name: string; uuid: string; playTime: number; deaths: number; mobKills: number }> = [];
    for (const f of statFiles) {
        const uuid = f.slice(0, -5);
        const s = prettyStats(await readPlayerStatsRaw(uuid));
        rows.push({ name: maps.byUUID.get(uuid) ?? uuid, uuid, playTime: s.playTime, deaths: s.deaths, mobKills: s.mobKills });
    }
    rows.sort((a,b)=>b.playTime-a.playTime);
    setCache("leaderboards", rows);
    sendJSON(res, 200, rows);
}
