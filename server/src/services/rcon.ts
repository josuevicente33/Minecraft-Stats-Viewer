import { Rcon } from "rcon-client";
const RCON_HOST = process.env.RCON_HOST || "host.docker.internal";
const RCON_PORT = +(process.env.RCON_PORT || 25575);
const RCON_PASSWORD = process.env.RCON_PASSWORD || "";
const CONNECT_TIMEOUT = +(process.env.RCON_CONNECT_TIMEOUT_MS || 3000);
const CMD_TIMEOUT = +(process.env.RCON_CMD_TIMEOUT_MS || 2000);

let client: Rcon | null = null;
let connecting: Promise<Rcon> | null = null;

export async function rconSend(cmd: string): Promise<string> {
    const c = await connect();
    // Guard against hung commands
    const p = c.send(cmd);
    const raced = await Promise.race([
        p,
        new Promise<string>((_, rej) => setTimeout(() => rej(new Error("RCON cmd timeout")), CMD_TIMEOUT)),
    ]).catch((e) => {
        try { c.end(); } catch {}
        client = null;
        throw e;
    });
    return raced as string;
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