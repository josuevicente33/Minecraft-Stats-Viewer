import fs from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";

type CatalogRow = { id: string; title?: string; parent?: string | null };

const BUNDLED = path.join(process.cwd(),"src", "data", "advancements-vanilla.json");
const SERVER_JAR = process.env.SERVER_JAR || "";

let memo: CatalogRow[] | null = null;

export async function getAdvCatalog(): Promise<CatalogRow[]> {
    if (memo) return memo;

    if (SERVER_JAR) {
        try {
        const rows = await extractFromJar(SERVER_JAR);
        if (rows.length) {
            memo = rows;
            return rows;
        }
        } catch (e) {
        console.warn("[advCatalog] JAR extraction failed, falling back to bundled:", (e as Error).message);
        }
    }

    try {
        const txt = await fs.readFile(BUNDLED, "utf8");
        memo = JSON.parse(txt);
        return memo!;
    } catch (e) {
        console.error("[advCatalog] failed to load bundled catalog:", (e as Error).message);
        memo = [];
        return memo;
    }`  `
}

async function extractFromJar(jarPath: string): Promise<CatalogRow[]> {
    const zip = new AdmZip(jarPath);
    const entries = zip.getEntries().filter(e => e.entryName.startsWith("data/minecraft/advancements/") && e.entryName.endsWith(".json"));
    const out: CatalogRow[] = [];

    for (const e of entries) {
        try {
            const raw = JSON.parse(e.getData().toString("utf8"));
            const id = "minecraft:" + e.entryName.replace("data/minecraft/advancements/", "").replace(/\.json$/, "");
            const parent = raw?.parent ?? null;
            const title = (typeof raw?.display?.title === "string") ? raw.display.title : undefined;
            out.push({ id, title, parent });
        } catch {
            // ignore malformed    
        }
    }

    out.sort((a,b) => a.id.localeCompare(b.id));
    return out;
}
