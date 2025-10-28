import { Rcon } from "rcon-client";

const HOST = process.env.RCON_HOST || "mc";
const PORT = Number(process.env.RCON_PORT || 25575);
const PASSWORD = process.env.RCON_PASSWORD || "";
const TIMEOUT_MS = Number(process.env.RCON_TIMEOUT_MS || 3000);

export async function rconSend(cmd: string): Promise<string> {
    const rcon = await Rcon.connect({ host: HOST, port: PORT, password: PASSWORD });
    const timer = setTimeout(() => { try { rcon.end(); } catch {} }, TIMEOUT_MS);
    try {
        return await rcon.send(cmd);
    } finally {
        clearTimeout(timer);
        rcon.end();
    }
}