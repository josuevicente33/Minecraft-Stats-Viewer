import fs from "node:fs/promises";
import path from "node:path";
import { ORIGIN_WORLD } from "../config.js";
import type { WorldProgression } from "../types/world.js";
import { getAdvTotal } from "./advCatalog.js";
import { scanStructures, type KnownStructure } from "./structures.js";

const SKIP_PREFIX = "minecraft:recipes/";

const BOSS_ADV = {
    enderDragon: "minecraft:end/kill_dragon",
    wither: "minecraft:nether/summon_wither",
};
const DIM_ADV = {
    nether: "minecraft:story/enter_the_nether",
    end:    "minecraft:story/enter_the_end",
};

export async function computeWorldProgression(): Promise<WorldProgression> {
    const advDir = path.join(ORIGIN_WORLD, "advancements");
    let files: string[] = [];
    try {
        files = await fs.readdir(advDir);
    } catch {
        return emptyProgression();
    }

    const completed = new Set<string>();
    const observedNonRecipe = new Set<string>();

    let hasNether = false;
    let hasEnd = false;
    let killedDragon = false;
    let summonedWither = false;

    await Promise.all(
        files.filter(f => f.endsWith(".json")).map(async (f) => {
        try {
            const raw = await fs.readFile(path.join(advDir, f), "utf8");
            const json = JSON.parse(raw) as Record<string, { done?: boolean }>;
            for (const [id, rec] of Object.entries(json)) {
            if (id.startsWith(SKIP_PREFIX)) continue;

            observedNonRecipe.add(id);

            if (rec?.done === true) {
                completed.add(id);
                if (id === DIM_ADV.nether) hasNether = true;
                if (id === DIM_ADV.end) hasEnd = true;
                if (id === BOSS_ADV.enderDragon) killedDragon = true;
                if (id === BOSS_ADV.wither) summonedWither = true;
            }
            }
        } catch { /* ignore broken file */ }
        })
    );

    let total = observedNonRecipe.size || completed.size;
    try { total = await getAdvTotal() } catch {/* ignore */}

    let known: KnownStructure[] = [];
    try { known = await scanStructures(); } catch { /* ignore */ }

    return {
        bosses: { enderDragon: killedDragon, wither: summonedWither, wardenSpawns: 0 },
        advancements: { completed: completed.size, total },
        structures: known.map(s => ({ id: s.id, name: s.name, discoveredBy: [] })),
        dimensions: { overworld: true, nether: hasNether, end: hasEnd },
    };
}

function emptyProgression(): WorldProgression {
    return {
        bosses: { enderDragon: false, wither: false, wardenSpawns: 0 },
        advancements: { completed: 0, total: 0 },
        structures: [],
        dimensions: { overworld: true, nether: false, end: false },
    };
}
