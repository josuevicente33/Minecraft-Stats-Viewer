import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPlayer } from "../api/api";

const ticksToHours = (t: number) => (t / 72000).toFixed(1);
const cmToKm = (cm: number) => (cm / 100_000).toFixed(2);
const kdr = (kills: number, deaths: number) => (deaths ? (kills / deaths).toFixed(2) : `${kills}.00`);

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        <div className="mt-1 text-xl font-semibold">{value}</div>
        {hint && <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
        </div>
    );
}

export default function Player() {
    const { id = "" } = useParams();
    const [data, setData] = useState<Awaited<ReturnType<typeof getPlayer>> | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
        try {
            setLoading(true);
            const d = await getPlayer(id);
            if (alive) { setData(d); setErr(null); }
        } catch (e: any) {
            if (alive) setErr(e.message ?? "Failed to load player");
        } finally {
            if (alive) setLoading(false);
        }
        })();
        return () => { alive = false; };
    }, [id]);

    const advCount = useMemo(() => {
        if (!data?.advancements) return 0;
        // count completed advancements (value objects with "done": true or "criteria" met)
        return Object.values(data.advancements).filter((v: any) => v?.done || v?.criteria)?.length;
    }, [data]);

    if (loading) {
        return (
        <div className="mx-auto max-w-5xl p-4 sm:p-6">
            <div className="mb-4">
            <Link to="/players" className="text-sm text-blue-600 hover:underline dark:text-blue-400">{`← Players`}</Link>
            </div>
            <div className="h-6 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900" />
            ))}
            </div>
        </div>
        );
    }

    if (err || !data) {
        return (
        <div className="mx-auto max-w-5xl p-4 sm:p-6">
            <div className="mb-4">
            <Link to="/players" className="text-sm text-blue-600 hover:underline dark:text-blue-400">{`← Players`}</Link>
            </div>
            <p className="text-red-600 dark:text-red-400">Error: {err ?? "Unknown error"}</p>
        </div>
        );
    }

    const s = data.stats;

    return (
        <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
            <div>
            <div className="text-sm">
                <Link to="/players" className="text-blue-600 hover:underline dark:text-blue-400">{`← Players`}</Link>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{data.name}</h1>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                UUID: <code className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">{data.uuid}</code>
            </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Hours Played" value={ticksToHours(s.playTime)} hint={`${s.playTime.toLocaleString()} ticks`} />
            <StatCard label="Mob Kills" value={s.mobKills.toLocaleString()} />
            <StatCard label="Player Kills" value={s.playerKills.toLocaleString()} />
            <StatCard label="Deaths" value={s.deaths.toLocaleString()} />
            <StatCard label="K/D" value={kdr(s.playerKills, s.deaths)} />
            <StatCard label="Jumps" value={s.jumps.toLocaleString()} />
            <StatCard label="Walked" value={`${cmToKm(s.walkCm)} km`} hint={`${s.walkCm.toLocaleString()} cm`} />
            <StatCard label="Flown" value={`${cmToKm(s.flyCm)} km`} hint={`${s.flyCm.toLocaleString()} cm`} />
            <StatCard label="Advancements" value={advCount} />
        </div>
        </div>
    );
}
