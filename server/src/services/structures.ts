import fs from "node:fs/promises";
import path from "node:path";
import { rconSend } from "./rcon.js";
import { ORIGIN_DATA } from "../config.js";

export type KnownStructure = { id: string; name: string; x: number; z: number; distance?: number };

const OUT = () => path.join(ORIGIN_DATA, "data", "structures.json");

const TARGETS: Array<{ id: string; name: string; dim: "overworld" | "the_nether" | "the_end" }> = [
    { id: "village_plains",   name: "Plains Village",      dim: "overworld" },
    { id: "village_desert",   name: "Desert Village",      dim: "overworld" },
    { id: "village_savanna",  name: "Savanna Village",     dim: "overworld" },
    { id: "village_taiga",    name: "Taiga Village",       dim: "overworld" },
    { id: "mansion",          name: "Woodland Mansion",    dim: "overworld" },
    { id: "monument",         name: "Ocean Monument",      dim: "overworld" },
    { id: "trial_chambers",   name: "Trial Chambers",      dim: "overworld" },
    { id: "ancient_city",     name: "Ancient City",        dim: "overworld" },
    { id: "stronghold",       name: "Stronghold",          dim: "overworld" },
    { id: "fortress",         name: "Nether Fortress",     dim: "the_nether" },
    { id: "bastion_remnant",  name: "Bastion Remnant",     dim: "the_nether" },
    { id: "end_city",         name: "End City",            dim: "the_end" },
];

function dimId(dim: "overworld" | "the_nether" | "the_end") {
    return dim === "overworld" ? "minecraft:overworld" : `minecraft:${dim}`;
}

async function locateOnce(id: string, dim: "overworld" | "the_nether" | "the_end"): Promise<KnownStructure | null> {
    const cmd = `execute in ${dimId(dim)} run locate structure minecraft:${id}`;
    const out = await rconSend(cmd);
    if (/Could not find/i.test(out)) return null;

    const m =
        out.match(/at\s+\[(-?\d+),\s*~,\s*(-?\d+)\]\s*\(distance\s*(\d+)/i) ||
        out.match(/at\s+\[(-?\d+),\s*~,\s*(-?\d+)\]/i) ||
        out.match(/(-?\d+)\s*,\s*(-?\d+)/);
    if (!m) return null;

    const x = parseInt(m[1], 10);
    const z = parseInt(m[2], 10);
    const distance = m[3] ? parseInt(m[3], 10) : undefined;

    return { id: `minecraft:${id}`, name: prettyName(id), x, z, distance };
}

function prettyName(id: string) {
    const found = TARGETS.find(t => t.id === id);
    if (found) return found.name;
    return id.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export async function scanStructures(force = false): Promise<KnownStructure[]> {
    if (!force) {
        try {
        const raw = await fs.readFile(OUT(), "utf8");
        const cached: KnownStructure[] = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length) return cached;
        } catch {}
    }

    const results: KnownStructure[] = [];
    for (const t of TARGETS) {
        try {
        const s = await locateOnce(t.id, t.dim);
        if (s) results.push(s);
        await new Promise(r => setTimeout(r, 120));
        } catch {
        /* skip one-off errors */
        }
    }

    try {
        await fs.mkdir(path.dirname(OUT()), { recursive: true });
        await fs.writeFile(OUT(), JSON.stringify(results, null, 2), "utf8");
    } catch { /* ignore */ }

    return results;
}
