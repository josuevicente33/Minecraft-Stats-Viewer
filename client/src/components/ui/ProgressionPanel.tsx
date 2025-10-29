import type { WorldProgression } from "../../types/world";

import { StatCard } from "./StatCard";


function Tag({ label, on }: { label: string; on: boolean }) {
    return (
        <span className={`px-2 py-1 rounded-md border text-xs ${on ? "border-emerald-500/40 bg-emerald-500/10" : "border-gray-700"}`}>
            {label}
        </span>
    );
}

export function ProgressionPanel({ data }: { data: WorldProgression }) {
    const pct = Math.round((data.advancements.completed / Math.max(1, data.advancements.total)) * 100);
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatCard label="Ender Dragon" value={data.bosses.enderDragon ? "Defeated" : "Alive"} />
                <StatCard label="Wither" value={data.bosses.wither ? "Defeated" : "Alive"} />
                <StatCard label="Warden Encounters" value={`${data.bosses.wardenSpawns}`} />
            </div>

            <div className="rounded-xl border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Advancements</h3>
                    <span className="text-sm text-gray-400">{data.advancements.completed}/{data.advancements.total} ({pct}%)</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-800">
                    <div className="h-3 rounded-full bg-gray-600" style={{ width: `${pct}%` }} />
                </div>
            </div>

            <div className="rounded-xl border border-gray-800 p-4">
                <h3 className="font-semibold mb-2">Dimensions</h3>
                <div className="flex gap-2 text-sm">
                    <Tag label="Overworld" on={data.dimensions.overworld} />
                    <Tag label="Nether" on={data.dimensions.nether} />
                    <Tag label="The End" on={data.dimensions.end} />
                </div>
            </div>

            <div className="rounded-xl border border-gray-800 p-4">
                <h3 className="font-semibold mb-2">Structures discovered</h3>
                    {data.structures.length ? (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                            {data.structures.map(s => (
                            <li key={s.id} className="rounded-lg border border-gray-800 px-3 py-2">
                                <div className="font-medium">{s.name}</div>
                                {s.discoveredBy?.length ? (
                                <div className="text-gray-400 text-xs">by {s.discoveredBy.join(", ")}</div>
                                ) : null}
                            </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400 text-sm">None yet</p>
                    )}
            </div>
        </div>
    );
}