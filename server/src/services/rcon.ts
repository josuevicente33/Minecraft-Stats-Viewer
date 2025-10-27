import { Rcon } from "rcon-client";
import { RCON_HOST, RCON_PORT, RCON_PASSWORD } from "../config.js";

export async function rconSend(cmd: string): Promise<string> {
    const client = await Rcon.connect({ host: RCON_HOST, port: RCON_PORT, password: RCON_PASSWORD });
    try { return await client.send(cmd); }
    finally { client.end(); }
}
