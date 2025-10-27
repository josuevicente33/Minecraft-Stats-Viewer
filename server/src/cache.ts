import { CACHE_TTL_MS } from "./config.js";

const cache = new Map<string, { t: number; v: unknown }>();

export function getCache<T = unknown>(key: string): T | undefined {
    const e = cache.get(key);
    return e && Date.now() - e.t < CACHE_TTL_MS ? (e.v as T) : undefined;
}
export function setCache(key: string, value: unknown) {
    cache.set(key, { t: Date.now(), v: value });
}
export function clearCache() {
    cache.clear();
}
