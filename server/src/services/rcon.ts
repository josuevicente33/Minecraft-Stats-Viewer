import { Rcon } from "rcon-client";
const RCON_HOST = process.env.RCON_HOST || "host.docker.internal";
const RCON_PORT = +(process.env.RCON_PORT || 25575);
const RCON_PASSWORD = process.env.RCON_PASSWORD || "";
const CONNECT_TIMEOUT = +(process.env.RCON_CONNECT_TIMEOUT_MS || 3000);
const CMD_TIMEOUT = +(process.env.RCON_CMD_TIMEOUT_MS || 2000);

let client: Rcon | null = null;
let connecting: Promise<Rcon> | null = null;

const HOST = process.env.RCON_HOST || "mc";
const PORT = Number(process.env.RCON_PORT || 25575);
const PASSWORD = process.env.RCON_PASSWORD || "changeme";
const TIMEOUT_MS = Number(process.env.RCON_TIMEOUT_MS || 3000);

export async function rconSend(cmd: string): Promise<string> {
    const rcon = await Rcon.connect({ host: HOST, port: PORT, password: PASSWORD });
    const timer = setTimeout(() => {
        try { rcon.end(); } catch {}
    }, TIMEOUT_MS);

    try {
        return await rcon.send(cmd);
    } finally {
        clearTimeout(timer);
        rcon.end();
    }
}


async function connect(): Promise<Rcon> {
    if (client) return client;
    if (connecting) return connecting;

    connecting = (async () => {
        const c = await Promise.race<Rcon>([
        Rcon.connect({ host: RCON_HOST, port: RCON_PORT, password: RCON_PASSWORD }),
        new Promise<Rcon>((_, rej) => setTimeout(() => rej(new Error("RCON connect timeout")), CONNECT_TIMEOUT)) as any,
        ]);
        c.on("end", () => { client = null; });
        c.on("error", () => { try { c.end(); } catch {} client = null; });
        client = c;
        connecting = null;
        return c;
    })();

    try { return await connecting; }
    catch (e) { connecting = null; throw e; }
}