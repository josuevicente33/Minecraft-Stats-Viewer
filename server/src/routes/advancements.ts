import type http from "node:http";
import { sendJSON } from "../lib/response.js";
import { loadUserCacheWithSeen, readAdvancements } from "../services/world.js";
import { getAdvCatalog } from "../services/advCatalog.js";
import { extractPlayerKey, latestCriteriaTime } from "../lib/util.js";
import { loadLangFile, loadLangFromJar, enrichAdvCatalog } from "../services/langResolver.js";
import { LOCAL_EN_US } from "../config.js";
import path from "node:path";

function parentGetter(catalog: { id: string; parent?: string | null }[]) {
  const byId = new Map(catalog.map(x => [x.id, x.parent ?? null]));
  return (id: string) => byId.get(id) ?? null;
}

type AdvState = "done" | "available" | "locked";
function computeState(id: string, doneSet: Set<string>, parentOf: (id: string) => string | null): AdvState {
    if (doneSet.has(id)) return "done";
    const p = parentOf(id);
    if (!p) return "available";
    return doneSet.has(p) ? "available" : "locked";
}

export async function playerAdvancementsHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    const rawUrl = req.url || "/";
    const key = extractPlayerKey(rawUrl);
    if (!key) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Invalid URL. Expected /player/:key/advancements" }));
        return;
    }

    const maps = await loadUserCacheWithSeen();
    const isUuid =/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
    const uuid = isUuid ? key : (maps.byName.get(key) || maps.byName.get(key.toLowerCase()) || key);

    const [catalog, advFromDisk] = await Promise.all([
        getAdvCatalog(),
        readAdvancements(uuid).then(v => v || {}),
    ]);

    let playerMap: Record<string, any> = advFromDisk;

    const MC_VERSION = "1.21.10";
    const CLIENT_JAR = process.env.CLIENT_JAR || "";

    if (CLIENT_JAR) {
        await loadLangFromJar(CLIENT_JAR, MC_VERSION, "minecraft");
    } else {
        console.log("[langResolver] loading en_us from file:", LOCAL_EN_US);
        await loadLangFile(MC_VERSION, "minecraft", LOCAL_EN_US);
    }
    const localizedCatalog = enrichAdvCatalog(catalog, MC_VERSION);

    const prelim = localizedCatalog.map(c => {
        const v: any = playerMap[c.id];
        const when = latestCriteriaTime(v);
        const done = Boolean(when);
        return {
            id: c.id,
            title: c.title || c.id,
            parent: c.parent ?? null,
            done,
            when: when || null,
            category: c.category,
            description: c.description,
            descriptionKey: (c as any).descriptionKey,
            iconItem: c.iconItem,
            background: c.background,
            frame: c.frame,
            hidden: c.hidden
        };
});

    const doneSet = new Set(prelim.filter(r => r.done).map(r => r.id));
    const parentOf = parentGetter(catalog);
    const rows = prelim.map(r => ({
        ...r,
        state: computeState(r.id, doneSet, parentOf) as AdvState,
    }));

    rows.sort((a, b) => {
        const order = (s: AdvState) => (s === "locked" ? 0 : s === "available" ? 1 : 2);
        const byState = order(a.state) - order(b.state);
        if (byState !== 0) return byState;
        return a.id.localeCompare(b.id);
    });

    const total = rows.length;
    const done = rows.filter(r => r.done).length;

    sendJSON(res, 200, { total, done, rows });
}
