import type http from "node:http";
import { MOCK } from "../config.js";
import { getCache, setCache } from "../cache.js";
import { sendJSON } from "../lib/response.js";
import { worldHasStats } from "../services/world.js";
import { rconSend } from "../services/rcon.js";
import { parseListOutput, type StatusOut } from "../services/profile.js";

const MOCK_STATUS: StatusOut = { online: 1, max: 20, names: ["Steve"], raw: "mock" };

export async function statusHandler(_req: http.IncomingMessage, res: http.ServerResponse) {
    const cached = getCache<StatusOut>("status");
    if (cached) return sendJSON(res, 200, cached);

    let out: StatusOut;
    if (MOCK || !(await worldHasStats())) {
        out = MOCK_STATUS;
    } else {
        const list = await rconSend("list");
        out = parseListOutput(list);
    }
    setCache("status", out);
    sendJSON(res, 200, out);
}
