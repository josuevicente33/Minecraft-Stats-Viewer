import fs from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import { LOCAL_DATA } from "../config.js";

type CatalogRow = {
    id: string;
    category: string;
    parent?: string | null;

    title?: string;
    titleKey?: string;
    description?: string;
    descriptionKey?: string;

    iconItem?: string;
    background?: string | null;
    frame?: "task" | "goal" | "challenge";
    hidden?: boolean;
};  

const BUNDLED = path.join(LOCAL_DATA, "advancements-vanilla.json");
const SERVER_JAR = process.env.SERVER_JAR || "";

let memoRows: CatalogRow[] | null = null;
let memoIds: Set<string> | null = null;
let memoTotal: number | null = null;
const SKIP_PREFIX = "minecraft:recipes/";

export async function getAdvCatalog(): Promise<CatalogRow[]> {
    if (memoRows) return memoRows;

    if (SERVER_JAR) {
        try {
            const rows = await extractFromJar(SERVER_JAR);
            if (rows.length) {
                memoRows = rows;
                memoIds = null;
                memoTotal = null;
                return memoRows;
            }
        } catch (e: any) {
            console.warn("[advCatalog] JAR extraction failed, falling back:", e.message);
        }
    }

    try {
        const txt = await fs.readFile(BUNDLED, "utf8");
        memoRows = JSON.parse(txt);
    } catch (e: any) {
        console.error("[advCatalog] bundled read failed:", e.message);
        memoRows = [];
    }

    memoIds = null; memoTotal = null;
    return memoRows!;
}

async function extractFromJar(jarPath: string): Promise<CatalogRow[]> {
    const zip = new AdmZip(jarPath);
    const ADV_RE = /^data\/([^/]+)\/advancement?\/(.+)\.json$/i;

    const out: CatalogRow[] = [];

    for (const e of zip.getEntries()) {
        if (e.isDirectory || !e.entryName) continue;

        const m = e.entryName.match(ADV_RE);
        if (!m) continue;
        if (e.entryName.includes("/recipes/")) continue;

        try {
            const raw = JSON.parse(e.getData().toString("utf8"));
            if (!raw?.display) continue;

            const [, ns, rel] = m;
            const id = `${ns}:${rel}`;
            const relFirst = rel.split("/", 1)[0] || "misc";

            const parent = raw.parent ?? null;

            // title / titleKey
            const t = raw.display.title;
            const title = typeof t === "string" ? t : undefined;
            const titleKey = !title && t && typeof t === "object" && typeof t.translate === "string" ? t.translate : undefined;

            // description / descriptionKey
            const d = raw.display.description;
            const description = typeof d === "string" ? d : undefined;
            const descriptionKey = !description && d && typeof d === "object" && typeof d.translate === "string" ? d.translate : undefined;

            // icon
            const icon = raw.display.icon;
            const iconItem = icon?.item ?? icon?.id ?? undefined;

            const frame = raw.display.frame as CatalogRow["frame"] | undefined;
            const background = raw.display.background ?? null;
            const hidden = Boolean(raw.display.hidden);

            out.push({
                id,
                category: relFirst,
                parent,
                title,
                titleKey,
                description,
                descriptionKey,
                iconItem,
                background,
                frame,
                hidden,
            })
        
        } catch {
            // ignore JSON parse errors
        }
    }

    out.sort((a,b) => a.id.localeCompare(b.id));

    try {
        await fs.mkdir(path.dirname(BUNDLED), { recursive: true });
        await fs.writeFile(BUNDLED, JSON.stringify(out, null, 2), "utf8");
    } catch {
        /* ignore write errors */
    }

    console.log(`[advCatalog] extracted ${out.length} visible advancements from ${path.basename(jarPath)}`);
    return out;
}

export async function getAdvCatalogIds(): Promise<Set<string>> {
    if (memoIds) return memoIds;
    const rows = await getAdvCatalog();
    memoIds = new Set(
        rows
        .map(r => r.id)
        .filter(Boolean)
        .filter(id => !id.startsWith(SKIP_PREFIX) )
    );
    memoTotal = memoIds.size;
    return memoIds;
}

export async function getAdvTotal(): Promise<number> {
    if (memoTotal != null) return memoTotal;
    const ids = await getAdvCatalogIds();
    memoTotal = ids.size;
    return memoTotal!;
}