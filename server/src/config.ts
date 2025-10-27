import path from "node:path";

export const PORT = Number(process.env.API_PORT ?? 8080);
export const DATA_DIR = process.env.DATA_DIR ?? "/data";
export const WORLD_DIR = process.env.WORLD_DIR ?? path.join(DATA_DIR, "world");
export const RCON_HOST = process.env.RCON_HOST ?? "mc";
export const RCON_PORT = Number(process.env.RCON_PORT ?? 25575);
export const RCON_PASSWORD = process.env.RCON_PASSWORD ?? "";
export const MOCK = process.env.MOCK === "1";
export const CACHE_TTL_MS = 10_000;