const BASE = import.meta.env.VITE_API_BASE || "/api";

import type { PlayerSummary, PlayerWithAll, AdvMerged, LbRow } from "../types/types";

//PLAYER API
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

export async function getPlayer(nameOrUuid: string) {
    const r = await fetch(`${BASE}/player/${encodeURIComponent(nameOrUuid)}`);
    if (!r.ok) throw new Error(`status ${r.status}`);
    return (await r.json()) as PlayerSummary;
}

// ADVANCEMENTS API
export async function getAdvancementsMerged(nameOrUuid: string): Promise<{
    total: number; done: number; rows: AdvMerged[];
}> {
    const r = await fetch(`${BASE}/player/${encodeURIComponent(nameOrUuid)}/advancements`);
    if (!r.ok) throw new Error(`status ${r.status}`);
    return r.json();
}

export async function getPlayerWithAdvancements(nameOrUuid: string) {
    const response = await fetch(`${BASE}/player/${encodeURIComponent(nameOrUuid)}?include=all`);
    if (!response.ok) throw new Error(`status ${response.status}`);
    return (await response.json()) as PlayerWithAll;
}

// LEADERBOARDS API
export async function getLeaderboards() {
    const r = await fetch(`${BASE}/leaderboards`);
    if (!r.ok) throw new Error(`status ${r.status}`);
    return (await r.json()) as Array<{ name: string; playTimeHours: number; deaths: number; mobKills: number; playerKills: number; jumps: number; walkKm: number; flyKm: number }>;
}

export async function getLeaderboard(metric: string, order: "asc"|"desc", limit = 50) {
    const BASE = import.meta.env.VITE_API_BASE || "/api";
    const r = await fetch(`${BASE}/leaderboards?metric=${encodeURIComponent(metric)}&order=${order}&limit=${limit}`);
    if (!r.ok) throw new Error(`status ${r.status}`);
    return r.json() as Promise<{ metric: string; order: "asc"|"desc"; limit: number; rows: LbRow[]; total: number }>;
}
