import type http from "node:http";
import { MOCK } from "../config.js";
import { getCache, setCache } from "../cache.js";
import { sendJSON } from "../lib/response.js";
import { worldHasStats } from "../services/world.js";
import { rconSend } from "../services/rcon.js";
import { parseListOutput, type StatusOut } from "../services/profile.js";
import { serverListPing } from "../lib/serverPing.js";

const TTL = +(process.env.STATUS_TTL_MS || 4000);
let cached: { data: StatusOut; at: number } | null = null;

export async function statusHandler(_req: http.IncomingMessage, res: http.ServerResponse) {
    if (cached && Date.now() - cached.at < TTL) {
        return sendJSON(res, 200, cached.data);
    }

    let out: StatusOut;

    try {
        if (MOCK || !(await worldHasStats())) {
        out = { online: 0, max: 20, names: [], raw: "mock|nostats" };
        } else {
        const raw = await rconSend("list");
        out = parseListOutput(raw);
        }
    } catch (e: any) {
        // Fallback: try Server List Ping (gives online/max) so UI still shows something meaningful
        try {
            const ping = await serverListPing( 
                process.env.MC_SERVER_HOST || "host.docker.internal", 
                +(process.env.MC_SERVER_PORT || 25565)
            ); // implement as in earlier message; returns players.online/max
            if (ping.online && ping.players) {
                out = { online: ping.players.online ?? 0, max: ping.players.max ?? 0, names: [], raw: "fallback:ping" };
            } else {
                out = { online: 0, max: 0, names: [], raw: "fallback:offline" };
            }
            } catch {
            out = { online: 0, max: 0, names: [], raw: "fallback:error" };
        }
    }

    cached = { data: out, at: Date.now() };
    return sendJSON(res, 200, out);
}
