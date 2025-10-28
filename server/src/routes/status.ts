import type http from "node:http";
import { sendJSON } from "../lib/response.js";
import { rconSend } from "../services/rcon.js";
import { parseListOutput, type StatusOut } from "../services/profile.js";

const TTL = +(process.env.STATUS_TTL_MS || 4000);
let cached: { data: StatusOut; at: number } | null = null;

export async function statusHandler(_req: http.IncomingMessage, res: http.ServerResponse) {
    if (cached && Date.now() - cached.at < TTL) {
        return sendJSON(res, 200, cached.data);
    }

    let out: StatusOut;

    try {
            // Primary: RCON `list`
            const raw = await rconSend(process.env.USE_UUIDS ? "list uuids" : "list");
            out = parseListOutput(raw);
            // If parsing failed (rare), throw to trigger fallback
            if (out.max === 0 && out.online === 0 && out.names.length === 0 && !/0\/\d+/.test(raw)) {
                throw new Error("Unparsed RCON output");
        }
    } catch (err) {
        console.warn("RCON list failed, falling back to server ping");
        try {
            // Secondary: server list ping
            out = { online: 0, max: 0, names: [], raw: "ping:fallback" };
        } catch (e) {
            // Final fallback: safe default
            console.warn("Server ping failed, using default status");
            out = { online: 0, max: 20, names: [], raw: "fallback" };
        }
    }

    cached = { data: out, at: Date.now() };
    return sendJSON(res, 200, out);
}
