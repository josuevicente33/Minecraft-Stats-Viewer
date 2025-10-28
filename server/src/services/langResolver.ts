// src/services/langResolver.ts
import fs from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";

type LangMap = Record<string, string>;
const LANG_CACHE = new Map<string, LangMap>();

function getCacheKey(version: string, ns: string) {
    return `${version}:${ns}`;
}

// formatString supports: - positional: "%1$s", "%2$s", simple: "%s" (consumes args in order)
function formatString(template: string, args: Array<string | number> = []): string {
    let out = template.replace(/%([0-9]+)\$s/g, (_, n) => {
        const idx = Number(n) - 1;
        return args[idx] != null ? String(args[idx]) : "";
    });

    // simple %s (non-positional) - consume in order
    let consumed = 0;
    out = out.replace(/%s/g, () => {
        const v = args[consumed++];
        return v != null ? String(v) : "";
    });

    return out;
}

/**
 * Load a language JSON from a plain file (already extracted assets)
 * version: e.g. "1.21.10"
 * ns: namespace, e.g. "minecraft" or a mod id
 * filePath: absolute path to en_us.json
 */
export async function loadLangFile(version: string, ns: string, filePath: string): Promise<LangMap | null> {
    const cacheKey = getCacheKey(version, ns);
    if (LANG_CACHE.has(cacheKey)) return LANG_CACHE.get(cacheKey)!;

    try {
        const txt = await fs.readFile(filePath, "utf8");
        const map = JSON.parse(txt) as LangMap;
        LANG_CACHE.set(cacheKey, map);
        return map;
    } catch (e) {
        return null;
    }
}

/**
 * Load language JSON from inside a jar (client jar)
 * jarPath: path to client jar
 * version: e.g. "1.21.10"
 * ns: "minecraft"
 */
export async function loadLangFromJar(jarPath: string, version: string, ns = "minecraft", locale = "en_us"): Promise<LangMap | null> {
    const cacheKey = getCacheKey(version, ns);
    if (LANG_CACHE.has(cacheKey)) return LANG_CACHE.get(cacheKey)!;

    try {
        const zip = new AdmZip(jarPath);
        const entry = zip.getEntry(`assets/${ns}/lang/${locale}.json`);
        if (!entry) return null;
        const map = JSON.parse(entry.getData().toString("utf8")) as LangMap;
        LANG_CACHE.set(cacheKey, map);
        return map;
    } catch (e) {
        return null;
    }
}

/**
 * Load language via asset index (launcher-managed) given a minecraftRoot
 * rootMinecraftDir: e.g. `%appdata%\.minecraft` or `~/.minecraft`
 * version: the version string used for the index file, e.g. "1.21.10"
 */
export async function loadLangViaAssetsIndex(rootMinecraftDir: string, version: string, ns = "minecraft", locale = "en_us"): Promise<LangMap | null> {
    const cacheKey = getCacheKey(version, ns);
    if (LANG_CACHE.has(cacheKey)) return LANG_CACHE.get(cacheKey)!;

    try {
        const idxPath = path.join(rootMinecraftDir, "assets", "indexes", `${version}.json`);
        const idxTxt = await fs.readFile(idxPath, "utf8");
        const idx = JSON.parse(idxTxt);
        const key = `assets/${ns}/lang/${locale}.json`;
        const objectEntry = idx.objects?.[key];
        if (!objectEntry || !objectEntry.hash) return null;
        const hash = objectEntry.hash as string;
        const objPath = path.join(rootMinecraftDir, "assets", "objects", hash.slice(0, 2), hash);
        const raw = await fs.readFile(objPath);
        const map = JSON.parse(raw.toString("utf8")) as LangMap;
        LANG_CACHE.set(cacheKey, map);
        return map;
    } catch {
        return null;
    }
}

/**
 * resolveLang tries to find the key under the given namespace/version,
 * falling back to returning the key itself if not found.
 *
 * key: translation key (e.g. "advancements.husbandry.place_dried_ghast_in_water.title")
 * args: optional args for placeholders
 * version + ns determine which cached map to use
 */
export function resolveLang(version: string, ns: string, key: string, args: Array<string | number> = []): string {
    const cacheKey = getCacheKey(version, ns);
    const map = LANG_CACHE.get(cacheKey);
    if (!map) return key; // fallback: give the key so caller knows it's unresolved
    const templ = map[key];
    if (templ == null) return key;
    return formatString(templ, args);
}

/**
 * enrichAdvCatalog:
 * - Fill title/description on catalog rows using either literal title/description (already present)
 *   or by looking up titleKey/descriptionKey in loaded maps (namespace "minecraft" by default).
 *
 * rows: CatalogRow[] (must include titleKey/descriptionKey and namespace info if not "minecraft")
 * version: minecraft version string used as cache key
 * nsOverride: optional function to map id -> namespace (by default parse id "minecraft:category/name")
 *
 * This returns a new array of rows with title/description populated (but does not modify cache).
 */
export type CatalogRowInBase = {
    id: string;
    title?: string;
    description?: string;
    titleKey?: string;
    descriptionKey?: string;
    namespace?: string;
};

export function enrichAdvCatalog<T extends CatalogRowInBase = CatalogRowInBase>(
    rows: T[],
    version: string
): Array<T & { title: string; description: string; namespace: string }> {
    return rows.map(r => {
        const ns = r.namespace ?? (r.id.includes(":") ? r.id.split(":")[0] : "minecraft");
        const title = r.title ?? (r.titleKey ? resolveLang(version, ns, r.titleKey) : r.id);
        const description = r.description ?? (r.descriptionKey ? resolveLang(version, ns, r.descriptionKey) : "");
        return { ...r, title, description, namespace: ns } as T & { title: string; description: string; namespace: string };
    });
}

/**
 * extractAssetFromJar: helper to pull PNG/JSON etc buffers from a jar
 * returns Buffer | null
 */
export function extractAssetFromJar(jarPath: string, assetPath: string): Buffer | null {
    try {
        const zip = new AdmZip(jarPath);
        const e = zip.getEntry(assetPath);
        if (!e) return null;
        return e.getData();
    } catch {
        return null;
    }
}

/**
 * small helper to clear cache (useful during tests or on version change)
 */
export function clearLangCache() {
    LANG_CACHE.clear();
}
