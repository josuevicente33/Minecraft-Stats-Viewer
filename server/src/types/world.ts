export type WorldOverview = {
    seed: string | number | null;
    day: number;
    timeOfDay: string;
    weather: "clear" | "rain" | "thunder";
    difficulty: "peaceful" | "easy" | "normal" | "hard";
    gamemode: "survival" | "creative" | "adventure" | "hardcore" | "spectator";
    spawn: { x: number; y: number; z: number };
    worldAgeTicks: number;
    version: string;
    worldBorder: { size: number; center: { x: number; z: number } } | null;
    loadedChunks?: number;
    entityCounts?: { total: number; mobs: number; animals: number; items: number };
};

export type WorldProgression = {
    bosses: { enderDragon: boolean; wither: boolean; wardenSpawns: number };
    advancements: { completed: number; total: number };
    structures: Array<{ id: string; name: string; discoveredBy?: string[] }>;
    dimensions: { overworld: boolean; nether: boolean; end: boolean };
};

export type WorldPerf = {
    tps: number;
    uptimeSec: number;
    ramMB: { used: number; max: number };
    cpuLoad?: number;
    avgLatencyMs?: number;
};

export type RecentEvent = {
    ts: string;
    type: "join" | "leave" | "death" | "advancement" | "chat" | "server";
    message: string;
};
