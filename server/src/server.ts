import http from "node:http";
import { PORT, DATA_DIR, WORLD_DIR, MOCK } from "./config.js";
import { Router } from "./lib/router.js";
import { sendJSON } from "./lib/response.js";
import { statusHandler } from "./routes/status.js";
import { playersHandler } from "./routes/players.js";
import { playerHandler } from "./routes/player.js";
import { leaderboardsHandler } from "./routes/leaderboards.js";
import { playerAdvancementsHandler } from "./routes/advancements.js";

const router = new Router()
  .on("GET", /^\/health$/, (_req, res) => sendJSON(res, 200, { ok: true, dataDir: DATA_DIR, worldDir: WORLD_DIR, mock: MOCK }))
  .on("GET", /^\/status$/, statusHandler)
  .on("GET", /^\/players$/, playersHandler)
  .on("GET", /^\/player\/[^/]+$/, playerHandler)
  .on("GET", /^\/leaderboards$/, leaderboardsHandler)
  .on("GET", /^\/player\/[^/]+\/advancements$/, playerAdvancementsHandler);

http.createServer((req, res) => {
  router.handle(req, res).catch(err => {
    console.error(err);
    sendJSON(res, 500, { error: err?.message ?? "Server error" });
  });
}).listen(PORT, () => {
  console.log(`[mc-stats-api] listening :${PORT}, DATA_DIR=${DATA_DIR}, WORLD_DIR=${WORLD_DIR}, MOCK=${MOCK ? "on" : "off"}`);
});
