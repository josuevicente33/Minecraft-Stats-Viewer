const BASE = import.meta.env.VITE_API_BASE || "/api";

import type { PlayerSummary, PlayerWithAll } from "../types/types";

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

export async function getPlayerWithAdvancements(nameOrUuid: string) {
    const response = await fetch(`${BASE}/player/${encodeURIComponent(nameOrUuid)}?include=all`);
    if (!response.ok) throw new Error(`status ${response.status}`);
    return (await response.json()) as PlayerWithAll;
}

export async function getLeaderboards() {
    const r = await fetch(`${BASE}/leaderboards`);
    if (!r.ok) throw new Error(`status ${r.status}`);
    return (await r.json()) as Array<{ name: string; playTimeHours: number; deaths: number; mobKills: number; playerKills: number; jumps: number; walkKm: number; flyKm: number }>;
}