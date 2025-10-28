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

export function parseListOutput(raw: string): StatusOut {
    const m = raw.match(/There are (\d+) of a max of (\d+) players online(?::\s*(.*))?$/i);
    if (!m) return { online: 0, max: 0, names: [], raw };
    const online = parseInt(m[1], 10);
    const max = parseInt(m[2], 10);
    const names = (m[3]?.trim() ? m[3].split(/\s*,\s*/).filter(Boolean) : []);
    return { online, max, names, raw };
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
