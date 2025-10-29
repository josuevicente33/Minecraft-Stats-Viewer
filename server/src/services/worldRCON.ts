import { rconSend } from "./rcon.js";

export async function rconGetTime() {
    const [dayOut, daytimeOut, gameOut] = await Promise.all([
            rconSend("time query day"),
            rconSend("time query daytime"),
            rconSend("time query gametime"),
    ]);
    const day = parseInt(dayOut.match(/\d+/)?.[0] ?? "0", 10);
    const daytime = parseInt(daytimeOut.match(/\d+/)?.[0] ?? "0", 10);
    const gametime = parseInt(gameOut.match(/\d+/)?.[0] ?? "0", 10);
    return { day, daytime, gametime };
}

export async function rconGetDifficulty(): Promise<"peaceful"|"easy"|"normal"|"hard"> {
    const out = await rconSend("difficulty");
    const d = out.toLowerCase();
    if (d.includes("peaceful")) return "peaceful";
    if (d.includes("easy")) return "easy";
    if (d.includes("normal")) return "normal";
    return "hard";
}

export async function rconGetSeed(): Promise<number | string | null> {
    const out = await rconSend("seed");
    const m = out.match(/-?\d+/);
    return m ? Number(m[0]) : null;
}

export async function rconGetWorldBorder() {
    const sizeOut = await rconSend("worldborder get");
    const size = parseFloat(sizeOut.match(/-?\d+(\.\d+)?/g)?.[0] ?? "0");
    return { size };
}
