export type StatusOut = { online: number; max: number; names: string[]; raw: string }

const ns = (raw: any, name: string) => (raw?.stats?.[name] ?? {}) as Record<string, number>;
const topN = (obj: Record<string, number>, n = 5) =>
    Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([id,value])=>({id,value}));

export function extractProfile(raw: any) {
    const custom = ns(raw, "minecraft:custom");
    const mined  = ns(raw, "minecraft:mined");
    const used   = ns(raw, "minecraft:used");
    const killed = ns(raw, "minecraft:killed");
    const killedBy = ns(raw, "minecraft:killed_by");
    const broken = ns(raw, "minecraft:broken");
    const placed = ns(raw, "minecraft:placed");

    const v = (k: string, d=0) => custom[`minecraft:${k}`] ?? d;

    return {
        totals: {
            playTime: v("play_time"),
            deaths: v("deaths"),
            mobKills: v("mob_kills"),
            playerKills: v("player_kills"),
            jumps: v("jump"),
            walkCm: v("walk_one_cm"),
            flyCm: v("fly_one_cm"),
            boatCm: v("boat_one_cm"),
            minecartCm: v("minecart_one_cm"),
            horseCm: v("horse_one_cm"),
            swimCm: v("swim_one_cm"),
            damageDealt: v("damage_dealt"),
            damageTaken: v("damage_taken"),
            timeSinceDeath: v("time_since_death"),
            timeSinceRest: v("time_since_rest"),
        },
        top: {
            mined: topN(mined, 5),
            used: topN(used, 5),
            broken: topN(broken, 5),
            placed: topN(placed, 5),
            mobsKilled: topN(killed, 5),
            killedBy: topN(killedBy, 5),
        }
    };
}

/**
 * Handles common vanilla/Paper/Spigot formats:
 *  - "There are 1 of a max of 20 players online: Steve"
 *  - "There are 0 of a max of 20 players online"
 *  - "Players (2/20): Steve, Alex"
 *  - Paper sometimes returns with color codes; we strip those.
 */
export function parseListOutput(out: string): StatusOut {
    const cleaned = stripMinecraftColors(out).trim();

    // Try "Players (x/y): name, name"
    {
        const m = cleaned.match(/Players\s*\((\d+)\s*\/\s*(\d+)\)\s*:\s*(.*)$/i);
        if (m) {
        const online = +m[1], max = +m[2];
        const names = online > 0 && m[3] ? m[3].split(",").map(s => s.trim()).filter(Boolean) : [];
        return { online, max, names, raw: "rcon:list" };
        }
    }
    // Try vanilla "There are x of a max of y players online: a, b"
    {
        const m = cleaned.match(/There are\s+(\d+)\s+of a max of\s+(\d+)\s+players online:? ?(.*)$/i);
        if (m) {
        const online = +m[1], max = +m[2];
        const names = online > 0 && m[3] ? m[3].split(",").map(s => s.trim()).filter(Boolean) : [];
        return { online, max, names, raw: "rcon:list" };
        }
    }
    // Fallback: just pull numbers if present
    {
        const m = cleaned.match(/(\d+)\s*\/\s*(\d+)/);
        if (m) {
        const online = +m[1], max = +m[2];
        return { online, max, names: [], raw: "rcon:list" };
        }
    }
    // Unknown format
    return { online: 0, max: 0, names: [], raw: "rcon:list:unparsed:" + cleaned };
}

export function stripMinecraftColors(s: string): string {
    // §x color codes and &x common alternates
    return s.replace(/§[0-9A-FK-ORa-fk-or]|&[0-9A-FK-ORa-fk-or]/g, "");
}


export function prettyStats(raw: any) {
    const g = raw?.stats ?? {};
    const v = (ns: string, key: string, d = 0) => g?.[ns]?.[key] ?? d;
    return {
        playTime:     v("minecraft:custom", "minecraft:play_time"),
        deaths:       v("minecraft:custom", "minecraft:deaths"),
        mobKills:     v("minecraft:custom", "minecraft:mob_kills"),
        playerKills:  v("minecraft:custom", "minecraft:player_kills"),
        jumps:        v("minecraft:custom", "minecraft:jump"),
        walkCm:       v("minecraft:custom", "minecraft:walk_one_cm"),
        flyCm:        v("minecraft:custom", "minecraft:fly_one_cm"),
    };
}
