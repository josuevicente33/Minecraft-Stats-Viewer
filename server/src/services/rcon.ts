import net from "node:net";
import { Rcon } from "rcon-client";

const HOST = process.env.RCON_HOST!;
const PORT = Number(process.env.RCON_PORT || 25575);
const PASSWORD = process.env.RCON_PASSWORD!;
const RCON_TIMEOUT_MS = Number(process.env.RCON_TIMEOUT_MS || 2000);
const RCON_BACKOFF_MS = Number(process.env.RCON_BACKOFF_MS || 15000);

let circuitOpenUntil = 0;

function now() { return Date.now(); }
function circuitOpen() { return now() < circuitOpenUntil; }
function tripCircuit() { circuitOpenUntil = now() + RCON_BACKOFF_MS; }

export function setCircuitOpen(ms: number = RCON_BACKOFF_MS) {
    circuitOpenUntil = now() + ms;
}

export function isRconReachable(ms = RCON_TIMEOUT_MS): Promise<boolean> {
    if (circuitOpen()) return Promise.resolve(false);
    return new Promise((resolve) => {
        const sock = net.connect({ host: HOST, port: PORT });
        let done = false;
        const finish = (ok: boolean) => {
        if (done) return;
        done = true; try { sock.destroy(); } catch {}
        resolve(ok);
        };
        const to = setTimeout(() => finish(false), ms);
        sock.once("connect", () => { clearTimeout(to); finish(true); });
        sock.once("error",   () => { clearTimeout(to); finish(false); });
        sock.once("timeout", () => { clearTimeout(to); finish(false); });
        sock.setTimeout(ms);
    });
}

function withTimeout<T>(p: Promise<T>, ms = RCON_TIMEOUT_MS, label = "RCON timeout"): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(label)), ms);
        p.then(v => { clearTimeout(t); resolve(v); },
            e => { clearTimeout(t); reject(e); });
    });
}

async function connectFast(): Promise<Rcon> {
    const ok = await isRconReachable();
    if (!ok) { tripCircuit(); throw new Error("RCON unreachable"); }
    return await withTimeout(Rcon.connect({ host: HOST, port: PORT, password: PASSWORD }), RCON_TIMEOUT_MS, "RCON connect timeout");
}

export async function rconSend(cmd: string): Promise<string> {
    if (circuitOpen()) throw new Error("RCON circuit open");
    let client: Rcon | null = null;
    try {
        client = await connectFast();
        return await withTimeout(client.send(cmd), RCON_TIMEOUT_MS, "RCON send timeout");
    } catch (e) {
        tripCircuit();
        throw e;
    } finally {
        try { client?.end(); } catch {}
    }
}

let chain: Promise<void> = Promise.resolve();
export async function rconSendQueued(cmd: string): Promise<string> {
    let result = ""; 

    const task = async () => {
        result = await withTimeout(rconSend(cmd));
    };

    chain = chain.then(task, task);
    await chain;
    return result;
}