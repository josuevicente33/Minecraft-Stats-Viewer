import type http from "node:http";
import { MOCK } from "../config.js";
import { getCache, setCache } from "../cache.js";
import { sendJSON } from "../lib/response.js";
import { worldHasStats, loadUserCache, listPlayerUUIDs } from "../services/world.js";

const MOCK_PLAYERS = [
    { uuid: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", name: "Steve" },
    { uuid: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", name: "Alex" },
];

export async function playersHandler(_req: http.IncomingMessage, res: http.ServerResponse) {
    const cached = getCache("players");
    if (cached) return sendJSON(res, 200, cached);

    let rows;
    if (MOCK || !(await worldHasStats())) {
        rows = MOCK_PLAYERS;
    } else {
        const maps = await loadUserCache();
        rows = (await listPlayerUUIDs()).map(uuid => ({ uuid, name: maps.byUUID.get(uuid) ?? uuid }));
    }
    setCache("players", rows);
    sendJSON(res, 200, rows);
}
