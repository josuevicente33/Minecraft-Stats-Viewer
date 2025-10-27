import type http from "node:http";
import { MOCK } from "../config.js";
import { getCache, setCache } from "../cache.js";
import { sendJSON } from "../lib/response.js";
import { loadUserCache, readAdvancements, readPlayerStatsRaw, worldHasStats, loadUserCacheWithSeen } from "../services/world.js";
import { extractProfile } from "../services/profile.js";

const MOCK_STATS: Record<string, any> = {
    Steve: { 
        playTime: 720000, deaths: 2, mobKills: 150, playerKills: 1, jumps: 500, 
        walkCm: 500000, flyCm: 120000, boatCm: 30000, minecartCm: 80000, horseCm: 60000, swimCm: 20000,
        damageDealt: 2500, damageTaken: 1800, timeSinceDeath: 6000, timeSinceRest: 3000
     },
    Alex:  { playTime: 360000, deaths: 5, mobKills: 75,  playerKills: 0, jumps: 200, walkCm: 210000, flyCm:  40000 },
    
};
const MOCK_NAMES = ["Steve", "Alex", "Herobrine"];

export async function playerHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    const rawURL = req.url || "/";

    const key = decodeURIComponent(rawURL.split("/").pop() || "");
    const url = new URL(rawURL, "http://x");
    const includes = (url.searchParams.get("include") || "").split(",").filter(Boolean);
    const wantsAll = includes.includes("all");

    const cacheKey = `player:${key}:`;
    const cached = getCache(cacheKey);
    if (cached) return sendJSON(res, 200, cached);

  // MOCK mode
  if (MOCK || !(await worldHasStats())) {
    const name = (MOCK_NAMES.includes(key) ? key : "Steve") as keyof typeof MOCK_STATS;

    // construct a mock "top" and "advancements" so the shape matches real payload
    const mockTop = {
      mined: [{ id: "minecraft:stone", value: 1234 }, { id: "minecraft:dirt", value: 987 }],
      used: [{ id: "minecraft:cobblestone", value: 456 }, { id: "minecraft:torch", value: 321 }],
      broken: [{ id: "minecraft:iron_pickaxe", value: 3 }],
      mobsKilled: [{ id: "minecraft:zombie", value: 42 }, { id: "minecraft:skeleton", value: 17 }],
      killedBy: [{ id: "minecraft:zombie", value: 2 }]
    };
    const mockAdvAll = [
      { id: "minecraft:story/mine_stone", when: "2025-10-25T12:00:00Z" },
      { id: "minecraft:adventure/kill_a_mob", when: "2025-10-26T15:30:00Z" },
      { id: "minecraft:nether/return_to_sender", when: "2025-10-26T18:45:00Z" },
      { id: "minecraft:end/dragon_egg1", when: "2025-10-26T20:00:00Z" },
      { id: "minecraft:end/dragon_egg", when: "2025-10-26T20:00:00Z" },
      { id: "minecraft:end/the_end", when: "2025-10-26T20:00:00Z" },
      { id: "minecraft:adventure/adventuring_time", when: "2025-10-26T20:00:00Z" }
    ];

    const payload = {
      name,
      uuid: "mock",
      lastSeen: "2025-10-26T20:00:00Z",
      stats: MOCK_STATS[name],
      top: mockTop,
      advancements: {
        total: mockAdvAll.length,
        recent: mockAdvAll.slice(0, 5),
        ...(wantsAll ? { all: mockAdvAll } : {})
      }
    };
    setCache(cacheKey, payload);
    return sendJSON(res, 200, payload);
  }

    const maps = await loadUserCacheWithSeen();
    const uuid = (maps.byName.get(key) ?? key).replace(/-/g, "");

    const raw = await readPlayerStatsRaw(uuid);
    const profile = extractProfile(raw);
    const advMap = await readAdvancements(uuid);
    const name = maps.byUUID.get(uuid) ?? key;
    const lastSeen = maps.lastSeen ? maps.lastSeen.get(uuid) || null : null;

    const allAdv: { id: string; when: string }[] = Object.entries(advMap || {}).flatMap(([id, v]: any) => {
    const when =
        v?.done ||
        (v?.criteria && Object.values(v.criteria)[0]) ||
        (v?.granted && v.granted[0]) ||
        null;
        return when ? [{ id, when: String(when) }] : [];
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
        ...(includes.includes("all") ? { all: allAdv } : {})
        }
    };
    setCache(cacheKey, payload);
    sendJSON(res, 200, payload);
}
