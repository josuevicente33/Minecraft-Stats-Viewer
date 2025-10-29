import fs from "node:fs/promises";
import path from "node:path";
import { ORIGIN_DATA } from "../config.js";
import type { RecentEvent } from "../types/world.js";

const LATEST_LOG = () => path.join(ORIGIN_DATA, "logs", "latest.log");
const reJoin  = /\]:\s(.+?)\sjoined the game/;
const reLeave = /\]:\s(.+?)\sleft the game/;
const reDeath = /\]:\s([A-Za-z0-9_]+)\s(?:was|fell|drowned|blew up|tried to swim|burned|went|died|starved|suffocated|experienced|hit the ground)/;
const reAdv   = /\]:\s(.+?)\s(?:has made the advancement|has reached the goal|has completed the challenge)\s\[(.+?)\]/;
const reChat  = /\]:\s<(.+?)>\s(.+)/;

export async function readRecentEvents(limit = 20): Promise<RecentEvent[]> {
    let text: string;
    try {
        text = await fs.readFile(LATEST_LOG(), "utf8");
    } catch {
        return [];
    }

    const lines = text.trimEnd().split(/\r?\n/);
    const out: RecentEvent[] = [];

    for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
        const line = lines[i];
        const tsMatch = line.match(/^\[(\d{4}-\d{2}-\d{2} .+?)\]/);
        const ts = tsMatch ? new Date(tsMatch[1].replace(" ", "T")).toISOString() : new Date().toISOString();

        let m;
        if ((m = line.match(reJoin))) {
            out.push({ ts, type: "join", message: `${m[1]} joined the game` }); continue;
        }
        if ((m = line.match(reLeave))) {
            out.push({ ts, type: "leave", message: `${m[1]} left the game` }); continue;
        }
        if ((m = line.match(reAdv))) {
            out.push({ ts, type: "advancement", message: `${m[1]} → [${m[2]}]` }); continue;
        }
        if ((m = line.match(reDeath))) {
        const msg = line.split("]: ").pop() || `${m[1]} died`;
            out.push({ ts, type: "death", message: msg }); continue;
        }
        if ((m = line.match(reChat))) {
            out.push({ ts, type: "chat", message: `<${m[1]}> ${m[2]}` }); continue;
        }
    }

    return out.reverse();
}
