import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { Rcon } from "rcon-client";
import { loadUserCache, listPlayers, readPlayerStats, parseListOutput } from "./stats.js";
import type { StatusOut } from "./types.js";

const PORT = Number(process.env.API_PORT ?? 8080);
const DATA_DIR = process.env.DATA_DIR ?? "/data";
const WORLD_DIR = process.env.WORLD_DIR ?? path.join(DATA_DIR, "world");
const RCON_HOST = process.env.RCON_HOST ?? "mc";
const RCON_PORT = Number(process.env.RCON_PORT ?? 25575);
const RCON_PASSWORD = process.env.RCON_PASSWORD ?? "";
const MOCK = process.env.MOCK === "1"; // allow local verification without a world

// tiny cache (10s TTL)
const cache = new Map<string, { t: number; v: unknown }>();
const getCache = (k: string) => {
  const e = cache.get(k);
  return e && Date.now() - e.t < 10_000 ? e.v : undefined;
};
const setCache = (k: string, v: unknown) => cache.set(k, { t: Date.now(), v });

function send(res: http.ServerResponse, code: number, body: unknown) {
  res.statusCode = code;
  res.setHeader("Content-Type","application/json");
  res.setHeader("Access-Control-Allow-Origin","*"); // dev
  res.end(JSON.stringify(body));
}

async function rconSend(cmd: string): Promise<string> {
  const client = await Rcon.connect({ host: RCON_HOST, port: RCON_PORT, password: RCON_PASSWORD });
  try { return await client.send(cmd); }
  finally { client.end(); }
}

async function worldHasStats(): Promise<boolean> {
  try {
    await fs.access(path.join(WORLD_DIR,"stats"));
    const files = await fs.readdir(path.join(WORLD_DIR,"stats"));
    return files.some(f => f.endsWith(".json"));
  } catch { return false; }
}

// mock helpers
const MOCK_NAMES = ["Steve","Alex","Herobrine"];
const MOCK_STATUS: StatusOut = { online: 1, max: 20, names: ["Steve"], raw: "mock" };
const MOCK_PLAYERS = [
  { uuid: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", name: "Steve" },
  { uuid: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", name: "Alex" },
];
const MOCK_STATS = {
  Steve: { playTime: 720000, deaths: 2, mobKills: 150, playerKills: 1, jumps: 500, walkCm: 500000, flyCm: 120000 },
  Alex:  { playTime: 360000, deaths: 5, mobKills: 75,  playerKills: 0, jumps: 200, walkCm: 210000, flyCm:  40000 }
};

http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      return send(res, 200, { ok: true, dataDir: DATA_DIR, worldDir: WORLD_DIR, mock: MOCK });
    }

    if (req.method === "GET" && req.url === "/status") {
      const cached = getCache("status");
      if (cached) return send(res, 200, cached);
      let out: StatusOut;
      if (MOCK || !(await worldHasStats())) {
        out = MOCK_STATUS;
      } else {
        const list = await rconSend("list");
        const parsed = parseListOutput(list);
        out = { ...parsed, raw: list };
      }
      setCache("status", out);
      return send(res, 200, out);
    }

    if (req.method === "GET" && req.url === "/players") {
      const cached = getCache("players");
      if (cached) return send(res, 200, cached);
      let rows;
      if (MOCK || !(await worldHasStats())) {
        rows = MOCK_PLAYERS;
      } else {
        const maps = await loadUserCache(DATA_DIR);
        rows = await listPlayers(WORLD_DIR, maps);
      }
      setCache("players", rows);
      return send(res, 200, rows);
    }

    if (req.method === "GET" && req.url?.startsWith("/player/")) {
      const key = decodeURIComponent(req.url.split("/").pop()!);
      const cached = getCache(`player:${key}`);
      if (cached) return send(res, 200, cached);

      if (MOCK || !(await worldHasStats())) {
        const name = (MOCK_NAMES.includes(key) ? key : "Steve") as keyof typeof MOCK_STATS;
        const entry = { name, uuid: "mock", stats: MOCK_STATS[name] };
        setCache(`player:${key}`, entry);
        return send(res, 200, entry);
      }

      const maps = await loadUserCache(DATA_DIR);
      const uuid = (maps.byName.get(key) ?? key).replace(/-/g,"");
      const stats = await readPlayerStats(WORLD_DIR, uuid);
      const name = maps.byUUID.get(uuid) ?? key;

      // advancements (optional if file missing)
      let adv: unknown = null;
      try { adv = await fs.readFile(path.join(WORLD_DIR,"advancements",`${uuid}.json`), "utf8").then(JSON.parse); } catch {}

      const payload = { name, uuid, stats, advancements: adv };
      setCache(`player:${key}`, payload);
      return send(res, 200, payload);
    }

    if (req.method === "GET" && req.url?.startsWith("/leaderboards")) {
      const cached = getCache("leaderboards");
      if (cached) return send(res, 200, cached);

      if (MOCK || !(await worldHasStats())) {
        const rows = [
          { name: "Steve", uuid: "a".repeat(32), playTime: MOCK_STATS.Steve.playTime, deaths: MOCK_STATS.Steve.deaths, mobKills: MOCK_STATS.Steve.mobKills },
          { name: "Alex",  uuid: "b".repeat(32), playTime: MOCK_STATS.Alex.playTime,  deaths: MOCK_STATS.Alex.deaths,  mobKills: MOCK_STATS.Alex.mobKills  }
        ].sort((a,b)=>b.playTime-a.playTime);
        setCache("leaderboards", rows);
        return send(res, 200, rows);
      }

      const maps = await loadUserCache(DATA_DIR);
      const statFiles = await fs.readdir(path.join(WORLD_DIR,"stats"));
      const rows: Array<{ name: string; uuid: string; playTime: number; deaths: number; mobKills: number }> = [];
      for (const f of statFiles.filter(f => f.endsWith(".json"))) {
        const uuid = f.slice(0,-5);
        const s = await readPlayerStats(WORLD_DIR, uuid);
        rows.push({ name: maps.byUUID.get(uuid) ?? uuid, uuid, playTime: s.playTime, deaths: s.deaths, mobKills: s.mobKills });
      }
      rows.sort((a,b)=>b.playTime-a.playTime);
      setCache("leaderboards", rows);
      return send(res, 200, rows);
    }

    send(res, 404, { error: "Not found" });
  } catch (e: any) {
    send(res, 500, { error: e?.message ?? "Server error" });
  }
}).listen(PORT, () => {
  console.log(`[mc-stats-api] listening :${PORT}, DATA_DIR=${DATA_DIR}, WORLD_DIR=${WORLD_DIR}, MOCK=${MOCK ? "on" : "off"}`);
});
