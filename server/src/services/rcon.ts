import { Rcon } from "rcon-client";

const HOST = process.env.RCON_HOST || "mc";
const PORT = Number(process.env.RCON_PORT || 25575);
const PASSWORD = process.env.RCON_PASSWORD || "";
const TIMEOUT_MS = Number(process.env.RCON_TIMEOUT_MS || 5000);

function withTimeout<T>(p: Promise<T>, ms: number, label = "RCON timeout") {
    return Promise.race<T>([
        p,
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error(label)), ms))
    ]);
}

export async function rconSend(cmd: string): Promise<string> {
    const rcon = await Rcon.connect({ host: HOST, port: PORT, password: PASSWORD });
    try {
        return await withTimeout(rcon.send(cmd), TIMEOUT_MS);
    } finally {
        rcon.end();
    }
    }
