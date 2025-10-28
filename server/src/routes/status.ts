import type http from "node:http";
import { MOCK } from "../config.js";
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
        // Primary: RCON `list`
        const raw = await rconSend(process.env.USE_UUIDS ? "list uuids" : "list");
        out = parseListOutput(raw);
        // If parsing failed (rare), throw to trigger fallback
        if (out.max === 0 && out.online === 0 && out.names.length === 0 && !/0\/\d+/.test(raw)) {
            throw new Error("Unparsed RCON output");
        }
        }
    } catch {
        // Fallback: Basic TCP ping — counts only
        try {
            const ping = await serverListPing(
                process.env.MC_SERVER_HOST || "host.docker.internal",
                +(process.env.MC_SERVER_PORT || 25565)
            );
            out = {
                online: ping.players?.online ?? 0,
                max: ping.players?.max ?? 0,
                names: [],
                raw: "fallback:ping"
            };
        } catch {
        out = { online: 0, max: 0, names: [], raw: "fallback:error" };
        }
    }

    cached = { data: out, at: Date.now() };
    return sendJSON(res, 200, out);
}
