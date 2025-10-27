const BASE = import.meta.env.VITE_API_BASE || "/api";

export async function getStatus() {
    const r = await fetch(`${BASE}/status`);
    if (!r.ok) throw new Error(`status ${r.status}`);
    return (await r.json()) as { online: number; max: number; names: string[] };
}

export async function getPlayers() {
    const r = await fetch(`${BASE}/players`);
    if (!r.ok) throw new Error(`status ${r.status}`);
    return (await r.json()) as Array<{ uuid: string; name: string }>;
}


// export async function getPlayer(nameOrUuid: string) {
//     const r = await fetch(`${BASE}/player/${encodeURIComponent(nameOrUuid)}`);
//     if (!r.ok) throw new Error(`status ${r.status}`);
//     return (await r.json()) as {
//         name: string;
//         uuid: string;
//         stats: {
//         playTime: number;
//         deaths: number;
//         mobKills: number;
//         playerKills: number;
//         jumps: number;
//         walkCm: number;
//         flyCm: number;
//         };
//         advancements?: Record<string, unknown> | null;
//     };
// }

export async function getPlayer(nameOrUuid: string) {
    const r = await fetch(`${BASE}/player/${encodeURIComponent(nameOrUuid)}`);
    if (!r.ok) throw new Error(`status ${r.status}`);
    return (await r.json()) as {
        name: string; uuid: string;
        stats: {
            playTime: number; deaths: number; mobKills: number; playerKills: number;
            jumps: number; walkCm: number; flyCm: number; boatCm: number; minecartCm: number;
            horseCm: number; swimCm: number; damageDealt: number; damageTaken: number;
            timeSinceDeath: number; timeSinceRest: number;
        };
        top: {
            mined: { id: string; value: number }[];
            used: { id: string; value: number }[];
            broken: { id: string; value: number }[];
            mobsKilled: { id: string; value: number }[];
            killedBy: { id: string; value: number }[];
        };
        advancementsCount: number;
        recentAdvancements: { id: string; when: string }[];
    };
}

export async function getLeaderboards() {
    const r = await fetch(`${BASE}/leaderboards`);
    if (!r.ok) throw new Error(`status ${r.status}`);
    return (await r.json()) as Array<{ name: string; playTimeHours: number; deaths: number; mobKills: number; playerKills: number; jumps: number; walkKm: number; flyKm: number }>;
}