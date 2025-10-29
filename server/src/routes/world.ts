import type http from "node:http";
import { URL } from "node:url";
import { sendJSON } from "../lib/response.js";

import { getWorldOverviewMerged } from "../services/worldMerged.js";
import { getRecentEvents } from "../services/world.js";
import { getWorldPerformance } from "../services/world.js";
import { getWorldProgression } from "../services/world.js";

export async function worldOverviewHandler(_req: http.IncomingMessage, res: http.ServerResponse) {
    try {
        const data = await getWorldOverviewMerged();
        return sendJSON(res, 200, data);
    } catch (e: any) {
        return sendJSON(res, 500, { error: e?.message ?? "overview error" });
    }
}

export async function worldProgressionHandler(_req: http.IncomingMessage, res: http.ServerResponse) {
    const data = await getWorldProgression();
    return sendJSON(res, 200, data);
}

export async function worldPerformanceHandler(_req: http.IncomingMessage, res: http.ServerResponse) {
    const data = await getWorldPerformance();
    return sendJSON(res, 200, data);
}

export async function worldEventsHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    const url = new URL(req.url || "", "http://localhost");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 100);
    const events = await getRecentEvents(limit);
    return sendJSON(res, 200, { events });
}
