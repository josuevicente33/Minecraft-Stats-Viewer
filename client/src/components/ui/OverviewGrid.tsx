import { useMemo } from "react";
import { KeyValue } from "./KeyValue";
import { capitalize } from "../../util/util";
import type { WorldOverview } from "../../types/world";

export function OverviewGrid({ data }: { data: WorldOverview }) {
    const ageDays = useMemo(() => Math.floor(data.worldAgeTicks / 24000), [data.worldAgeTicks]);
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <KeyValue k="Seed" v={`${data.seed ?? "Hidden"}`} />
            <KeyValue k="Day / Time" v={`Day ${data.day} • ${data.timeOfDay}`} />
            <KeyValue k="Weather" v={data.weather} />
            <KeyValue k="Difficulty" v={capitalize(data.difficulty)} />
            <KeyValue k="Gamemode" v={capitalize(data.gamemode)} />
            <KeyValue k="Spawn" v={`(${data.spawn.x}, ${data.spawn.y}, ${data.spawn.z})`} />
            <KeyValue k="World Age" v={`${ageDays} days (${data.worldAgeTicks.toLocaleString()} ticks)`} />
            <KeyValue k="Version" v={data.version} />
            {data.worldBorder && (
                <KeyValue k="World Border" v={`${data.worldBorder.size} @ (${data.worldBorder.center.x}, ${data.worldBorder.center.z})`} />
            )}
            {data.loadedChunks !== undefined && <KeyValue k="Loaded Chunks" v={`${data.loadedChunks}`} />}
            {data.entityCounts && (
                <KeyValue
                    k="Entities"
                    v={`Total ${data.entityCounts.total} • Mobs ${data.entityCounts.mobs} • Animals ${data.entityCounts.animals} • Items ${data.entityCounts.items}`}
                />
            )}
        </div>
    );
}