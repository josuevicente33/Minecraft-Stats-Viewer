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
        const raw = await rconSend(process.env.USE_UUIDS ? "list uuids" : "list");
        out = parseListOutput(raw);
        if (out.max === 0 && out.online === 0 && out.names.length === 0 && !/0\/\d+/.test(raw)) {
            throw new Error("Unparsed RCON output");
        }
    } catch (err) {
        out = { online: 0, max: 0, names: [], raw: "error:rcon-failed:" + (err instanceof Error ? err.message : String(err)) };
    }

    cached = { data: out, at: Date.now() };
    return sendJSON(res, 200, out);
}
