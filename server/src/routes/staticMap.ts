import type http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { sendJSON } from "../lib/response.js";
import { MAP_DIR } from "../config.js";

const MIME: Record<string,string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".wasm": "application/wasm",
};

export async function mapStaticHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    try {
        const url = new URL(req.url || "", "http://x");
        const rel = url.pathname.replace(/^\/map\/?/, "") || "index.html";
        const safe = path.normalize(rel).replace(/^(\.\.[/\\])+/, "");
        const filePath = path.join(MAP_DIR, safe);

        const data = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
        res.end(data);
    } catch {
        try {
            const index = await fs.readFile(path.join(MAP_DIR, "index.html"));
            res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
            res.end(index);
        } catch {
            sendJSON(res, 404, { error: "Map file not found" });
        }
    }
}
