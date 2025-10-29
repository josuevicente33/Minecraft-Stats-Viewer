export type CacheEntry<T> = { v: T; t: number; ttl: number };
const mem: Record<string, CacheEntry<any> | undefined> = Object.create(null);

export function cget<T>(k: string): T | undefined {
    const e = mem[k];
    if (!e) return;
    if (Date.now() - e.t > e.ttl) { delete mem[k]; return; }
    return e.v as T;
}

export function cset<T>(k: string, v: T, ttlMs: number): T {
    mem[k] = { v, t: Date.now(), ttl: ttlMs };
    return v;
}

export function cdel(k: string) { delete mem[k]; }
export function cclear() { for (const k in mem) delete mem[k]; }