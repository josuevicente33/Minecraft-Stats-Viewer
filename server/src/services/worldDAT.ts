import fs from "node:fs/promises";
import path from "node:path";
import * as nbt from "prismarine-nbt";
import { ORIGIN_WORLD } from "../config.js";

export type LevelDat = {
    seed: number | string | null;
    spawn: { x: number; y: number; z: number };
    worldAgeTicks: number;
    dayTimeTicks: number;
    difficulty: 0 | 1 | 2 | 3;
    gameType: 0 | 1 | 2 | 3;
    weather: { raining: boolean; rainTime: number; thundering: boolean; thunderTime: number; clearWeatherTime: number };
    border: { size: number; centerX: number; centerZ: number };
    versionName?: string;
};

export async function readLevelDat(worldDir: string = ORIGIN_WORLD): Promise<LevelDat> {
    const buf = await fs.readFile(path.join(worldDir, "level.dat"));
    const { parsed } = await nbt.parse(buf);
    const root = nbt.simplify(parsed) as any;
    const Data = root?.Data ?? {};

    const spawn = {
        x: Number(Data.SpawnX ?? 0),
        y: Number(Data.SpawnY ?? 64),
        z: Number(Data.SpawnZ ?? 0),
    };

    const worldAgeTicks = Number(Data.Time ?? 0);
    const dayTimeTicks  = Number(Data.DayTime ?? 0);

    const difficulty = Number(Data.Difficulty ?? 2) as 0|1|2|3;
    const gameType   = Number(Data.GameType ?? 0) as 0|1|2|3;

    let seed: number | string | null = null;
    const wgs = Data.WorldGenSettings;
    const rawSeed = wgs?.seed ?? Data.RandomSeed ?? null;
    if (rawSeed !== null && rawSeed !== undefined) {
        if (typeof rawSeed === "bigint") {
            const asNum = Number(rawSeed);
            seed = Number.isSafeInteger(asNum) ? asNum : rawSeed.toString();
        } else {
            const asNum = Number(rawSeed);
            seed = Number.isFinite(asNum) ? asNum : String(rawSeed);
        }
    }

    const weather = {
        raining: Boolean(Data.raining ?? 0),
        rainTime: Number(Data.rainTime ?? 0),
        thundering: Boolean(Data.thundering ?? 0),
        thunderTime: Number(Data.thunderTime ?? 0),
        clearWeatherTime: Number(Data.clearWeatherTime ?? 0),
    };

    const border = {
        size: Number(Data.BorderSize ?? 6e7),
        centerX: Number(Data.BorderCenterX ?? 0),
        centerZ: Number(Data.BorderCenterZ ?? 0),
    };

    const versionName: string | undefined = Data.Version?.Name ?? undefined;

    return { seed, spawn, worldAgeTicks, dayTimeTicks, difficulty, gameType, weather, border, versionName };
}