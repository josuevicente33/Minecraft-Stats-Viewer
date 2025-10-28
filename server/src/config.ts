import path from "node:path";

export const PORT = Number(process.env.API_PORT ?? 8080);

export const RCON_HOST = process.env.RCON_HOST ?? "mc";
export const RCON_PORT = Number(process.env.RCON_PORT ?? 25575);
export const RCON_PASSWORD = process.env.RCON_PASSWORD ?? "";
export const MOCK = process.env.MOCK === "1";
export const CACHE_TTL_MS = 10_000;

export const ORIGIN_DATA = process.env.ORIGIN_DATA ?? "/data";
export const ORIGIN_WORLD = process.env.ORIGIN_WORLD ?? path.join(ORIGIN_DATA, "world");
export const LOCAL_DATA = process.env.LOCAL_DATA ?? path.join(ORIGIN_DATA, "local");
export const ASSETS_DIR = process.env.ASSETS_DIR ?? path.join(LOCAL_DATA, "assets");
export const LOCAL_EN_US = path.join(ASSETS_DIR, "minecraft", "lang", "en_us.json");