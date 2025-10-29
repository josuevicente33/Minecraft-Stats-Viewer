import { useEffect, useMemo, useState } from "react";
import { StatCard } from "../components/ui/StatCard";

type WorldOverview = {
    seed: string | number | null;
    day: number;
    timeOfDay: string;
    weather: "clear" | "rain" | "thunder";
    difficulty: "peaceful" | "easy" | "normal" | "hard";
    gamemode: "survival" | "creative" | "adventure" | "hardcore" | "spectator";
    spawn: { x: number; y: number; z: number };
    worldAgeTicks: number;
    version: string;
    worldBorder: { size: number; center: { x: number; z: number } } | null;
    loadedChunks?: number;
    entityCounts?: { total: number; mobs: number; animals: number; items: number };
};

type WorldProgression = {
    bosses: { enderDragon: boolean; wither: boolean; wardenSpawns: number };
    advancements: { completed: number; total: number };
    structures: Array<{ id: string; name: string; discoveredBy?: string[] }>;
    dimensions: { overworld: boolean; nether: boolean; end: boolean };
};

type WorldPerf = {
    tps: number;
    uptimeSec: number;
    ramMB: { used: number; max: number };
    cpuLoad?: number;
    avgLatencyMs?: number;
};

type RecentEvent = {
    ts: string;
    type: "join" | "leave" | "death" | "advancement" | "chat" | "server";
    message: string;
};

export default function World() {
    const [mapOpen, setMapOpen] = useState(true);
    const [overview, setOverview] = useState<WorldOverview | null>(null);
    const [prog, setProg] = useState<WorldProgression | null>(null);
    const [perf, setPerf] = useState<WorldPerf | null>(null);
    const [events, setEvents] = useState<RecentEvent[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem("world.mapOpen");
        if (saved !== null) setMapOpen(saved === "1");
    }, []);
    useEffect(() => {
        localStorage.setItem("world.mapOpen", mapOpen ? "1" : "0");
    }, [mapOpen]);

    useEffect(() => {
        let alive = true;
        (async () => {
        try {
            setLoading(true);
            const [o, p, f, e] = await Promise.all([
                fetch("/api/world/overview").then(r => r.json()),
                fetch("/api/world/progression").then(r => r.json()),
                fetch("/api/world/performance").then(r => r.json()),
                fetch("/api/world/events?limit=20").then(r => r.json()),
            ]);
            if (!alive) return;
            setOverview(o);
            setProg(p);
            setPerf(f);
            setEvents(e?.events ?? []);
        } catch (err) {
            console.error(err);
        } finally {
            if (alive) setLoading(false);
        }
        })();
        return () => { alive = false; };
    }, []);

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
            {/* Page header */}
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">World</h1>
                <span className="text-sm text-gray-400">Minecraft Stats Viewer</span>
            </div>

            {/* Collapsible Map / Viewer */}
            <section className="rounded-2xl bg-gray-900/60 border border-gray-800 shadow-sm">
                <header className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">Map / Viewer</span>
                        <span className="text-xs text-gray-400">(Dynmap / Bluemap / placeholder)</span>
                    </div>
                    <button
                        onClick={() => setMapOpen(v => !v)}
                        className="rounded-xl border border-gray-700 px-3 py-1.5 text-sm hover:bg-gray-800"
                    >
                        {mapOpen ? "Collapse" : "Expand"}
                    </button>
                </header>
                {mapOpen && (
                    <div className="px-4 pb-4">
                        {/* Replace this with your Dynmap/Bluemap iframe or component */}
                        <div className="h-[420px] w-full rounded-xl bg-linear-to-br from-gray-800 to-gray-900 grid place-items-center border border-gray-800">
                            <p className="text-gray-400">
                                Map placeholder — embed your viewer here (iframe or component)
                            </p>
                        </div>
                    </div>
                    )}
            </section>

            {/* Overview */}
            <Section title="Overview" loading={loading}>
                {overview ? <OverviewGrid data={overview} /> : <EmptyNote note="No overview data." />}
            </Section>

            {/* Progression */}
            <Section title="Progression" loading={loading}>
                {prog ? <ProgressionPanel data={prog} /> : <EmptyNote note="No progression data." />}
            </Section>

            {/* Optional: Performance */}
            <Section title="Performance" loading={loading}>
                {perf ? <PerformancePanel data={perf} /> : <EmptyNote note="No performance data." />}
            </Section>

            {/* Optional: Recent Activity */}
            <Section title="Recent Activity" loading={loading}>
                {events?.length ? <EventsList events={events!} /> : <EmptyNote note="No recent activity." />}
            </Section>
        </div>
    );
}

function Section({
    title,
    loading,
    children,
}: { title: string; loading?: boolean; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl bg-gray-900/60 border border-gray-800 shadow-sm">
            <header className="px-4 py-3 border-b border-gray-800">
                <h2 className="text-lg font-semibold">{title}</h2>
            </header>
            <div className="p-4">
                {loading ? <Skeleton /> : children}
            </div>
        </section>
    );
    }

function Skeleton() {
    return (
        <div className="grid gap-3">
        <div className="h-6 w-48 bg-gray-800/70 rounded" />
        <div className="h-6 w-72 bg-gray-800/70 rounded" />
        <div className="h-6 w-full bg-gray-800/70 rounded" />
        </div>
    );
}

function EmptyNote({ note }: { note: string }) {
    return <p className="text-gray-400 text-sm">{note}</p>;
}

function OverviewGrid({ data }: { data: WorldOverview }) {
    const ageDays = useMemo(() => Math.floor(data.worldAgeTicks / 24000), [data.worldAgeTicks]);
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <KV k="Seed" v={`${data.seed ?? "Hidden"}`} />
            <KV k="Day / Time" v={`Day ${data.day} • ${data.timeOfDay}`} />
            <KV k="Weather" v={data.weather} />
            <KV k="Difficulty" v={capitalize(data.difficulty)} />
            <KV k="Gamemode" v={capitalize(data.gamemode)} />
            <KV k="Spawn" v={`(${data.spawn.x}, ${data.spawn.y}, ${data.spawn.z})`} />
            <KV k="World Age" v={`${ageDays} days (${data.worldAgeTicks.toLocaleString()} ticks)`} />
            <KV k="Version" v={data.version} />
            {data.worldBorder && (
                <KV k="World Border" v={`${data.worldBorder.size} @ (${data.worldBorder.center.x}, ${data.worldBorder.center.z})`} />
            )}
            {data.loadedChunks !== undefined && <KV k="Loaded Chunks" v={`${data.loadedChunks}`} />}
            {data.entityCounts && (
                <KV
                    k="Entities"
                    v={`Total ${data.entityCounts.total} • Mobs ${data.entityCounts.mobs} • Animals ${data.entityCounts.animals} • Items ${data.entityCounts.items}`}
                />
            )}
        </div>
    );
    }

    function ProgressionPanel({ data }: { data: WorldProgression }) {
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

function formatDuration(totalSec: number) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    return `${h}h ${m}m ${s}s`;
}

function capitalize<T extends string>(s: T): T {
    return (s.charAt(0).toUpperCase() + s.slice(1)) as T;
}


function PerformancePanel({ data }: { data: WorldPerf }) {
    const ram = `${data.ramMB.used} / ${data.ramMB.max} MB`;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="TPS" value={data.tps.toFixed(1)} />
            <StatCard label="Uptime" value={formatDuration(data.uptimeSec)} />
            <StatCard label="RAM" value={ram} />
            <StatCard label="CPU Load" value={data.cpuLoad !== undefined ? `${Math.round(data.cpuLoad * 100)}%` : "—"} />
        </div>
    );
}

function EventsList({ events }: { events: RecentEvent[] }) {
    return (
        <ul className="divide-y divide-gray-800">
            {events.map((e, idx) => (
                <li key={idx} className="py-2 text-sm">
                    <span className="text-gray-400 mr-2">{new Date(e.ts).toLocaleString()}</span>
                    <span className="uppercase text-xs px-2 py-0.5 rounded-md bg-gray-800 mr-2">{e.type}</span>
                    <span>{e.message}</span>
                </li>
            ))}
        </ul>
    );
}

function Tag({ label, on }: { label: string; on: boolean }) {
    return (
        <span className={`px-2 py-1 rounded-md border text-xs ${on ? "border-emerald-500/40 bg-emerald-500/10" : "border-gray-700"}`}>
            {label}
        </span>
    );
}

function KV({ k, v }: { k: string; v: string }) {
    return (
        <div className="rounded-xl border border-gray-800 p-4">
        <div className="text-gray-400 text-xs">{k}</div>
        <div className="text-base font-medium break-all">{v}</div>
        </div>
    );
}