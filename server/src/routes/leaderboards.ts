import type http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { sendJSON } from "../lib/response.js";
import { ORIGIN_WORLD } from "../config.js";
import { loadUserCacheWithSeen, readPlayerStatsRaw, readAdvancements } from "../services/world.js";
import { extractProfile } from "../services/profile.js";
import { getAdvCatalog } from "../services/advCatalog.js";

type Row = {
    name: string;
    uuid: string;
    value: number;
    extra?: Record<string, number>;
};

const METRICS = {
    playTime:    (p: any) => p.totals.playTime ?? 0,
    deaths:      (p: any) => p.totals.deaths ?? 0,
    mobKills:    (p: any) => p.totals.mobKills ?? 0,
    playerKills: (p: any) => p.totals.playerKills ?? 0,
    walkCm:      (p: any) => p.totals.walkCm ?? 0,
    flyCm:       (p: any) => p.totals.flyCm ?? 0,
    damageDealt: (p: any) => p.totals.damageDealt ?? 0,
    damageTaken: (p: any) => p.totals.damageTaken ?? 0,
} as const;

function parseQuery(urlStr: string) {
    const u = new URL(urlStr, "http://x");
    const metric = (u.searchParams.get("metric") ?? "playTime") as keyof typeof METRICS | "advancements";
    const order = (u.searchParams.get("order") ?? "desc") as "asc" | "desc";
    const limit = Math.min(Math.max(Number(u.searchParams.get("limit") ?? 50), 1), 500);
    return { metric, order, limit };
}

export async function leaderboardsHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    const { metric, order, limit } = parseQuery(req.url || "/");

    try {
        const maps = await loadUserCacheWithSeen();
        const statDir = path.join(ORIGIN_WORLD, "stats");
        const files = (await fs.readdir(statDir)).filter(f => f.endsWith(".json"));

        const wantAdv = metric === "advancements";
        const catalog = wantAdv ? await getAdvCatalog() : null;

        const rows: Row[] = [];

        for (const f of files) {
            const rawUUID = f.slice(0, -5);
            const raw = await readPlayerStatsRaw(rawUUID);

            const profile = extractProfile(raw);
            const uuid = rawUUID.replace(/-/g, "");
            const name = maps.byUUID.get(uuid) ?? uuid;

            let value = 0;
            if (wantAdv) {
                const advMap = await readAdvancements(rawUUID).then(v => v || {});
                let done = 0;
                for (const c of catalog ?? []) {
                    const v: any = (advMap as any)[c.id];
                    const when =
                        (typeof v?.done === "string" && v.done) ||
                        (v?.criteria && Object.values(v.criteria)[0]) ||
                        (Array.isArray(v?.granted) && v.granted[0]) ||
                        (v?.done === true ? "true" : null);
                    if (when) done++;
                }
                value = done;
            } else {
                const fn = (METRICS as any)[metric];
                if (!fn) continue;
                value = Number(fn(profile)) || 0;
            }

            rows.push({
                name,
                uuid: rawUUID,
                value,
                extra: {
                    deaths: profile.totals.deaths ?? 0,
                    mobKills: profile.totals.mobKills ?? 0,
                    playerKills: profile.totals.playerKills ?? 0,
                    playTime: profile.totals.playTime ?? 0,
                },
            });
        }

        rows.sort((a,b) =>
            (order==="asc" ? a.value-b.value : b.value-a.value) || a.name.localeCompare(b.name)
        );
        const out = rows.slice(0, limit);
        sendJSON(res, 200, { metric, order, limit, rows: out, total: rows.length });
    } catch (e: any) {
        sendJSON(res, 500, { error: e?.message ?? "leaderboard error" });
    }
}
