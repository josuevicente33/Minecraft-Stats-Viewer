import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPlayer, getPlayerWithAdvancements } from "../api/api";
import type { PlayerWithAll, PlayerSummary, TopRow } from "../types/types";

export const prettyId = (id: string) =>
  id.replace(/^minecraft:/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const ticksToHours = (t: number) => (t / 72000).toFixed(1);
const cmToKm = (cm: number) => (cm / 100_000).toFixed(2);
const kdr = (kills: number, deaths: number) => (deaths ? (kills / deaths).toFixed(2) : `${kills}.00`);
const avatarUrl = (uuid: string) => `https://crafatar.com/avatars/${uuid}?overlay`;
const fmtRel = (iso?: string | null) => {
    if (!iso) return "unknown";
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins/60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs/24);
    return `${days}d ago`;
};


function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
            <div className="mt-1 text-xl font-semibold">{value}</div>
            {hint && <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
        </div>
    );
}

function TopList({ title, rows, unit = "×" }: { title: string; rows?: { id: string; value: number }[]; unit?: string }) {
    if (!rows || rows.length === 0) return null;
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{title}</div>
            <ul className="space-y-1 text-sm">
                {rows.map((r) => (
                    <li key={r.id} className="flex items-center justify-between">
                        <span className="truncate">{prettyId(r.id)}</span>
                        <span className="tabular-nums text-gray-700 dark:text-gray-200">
                        {r.value.toLocaleString()} {unit}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function Player() {
    const { id = "" } = useParams();
    const [data, setData] = useState<PlayerSummary | PlayerWithAll | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [advLoading, setAdvLoading] = useState(false);
    const [advErr, setAdvErr] = useState<string | null>(null);
    const hasAll = (data as PlayerWithAll | null)?.advancements?.all !== undefined;

    const loadSummary = async () => {
        setLoading(true);
        try {
            const data = await getPlayer(id);
            setData(data);
            setErr(null);
        } catch (e: any) {
            setErr(e.message ?? "Failed to load player");
        } finally {
            setLoading(false);
        }
    }

    const loadAllAdv = async (force = false) => {
        if (hasAll && !force) return;
        setAdvLoading(true);
        try {
            const d = await getPlayerWithAdvancements(id);
            setData(d);
            setAdvErr(null);
        } catch (e: any) {
            setAdvErr(e?.message ?? "Failed to load advancements");
        } finally {
            setAdvLoading(false);
        }
    };

    const refresh = async () => {
        if (hasAll) {
            await loadAllAdv(true);
        } else {
            await loadSummary();
        }
    };

    useEffect(() => {
        setAdvLoading(false);
        setAdvErr(null);
        setData(null);
        setErr(null);
        void loadSummary();
    }, [id]);

    const advTotal = data?.advancements?.total ?? 0;
    const recentAdv = data?.advancements?.recent ?? [];

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
                    <button
                        onClick={loadSummary}
                        className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900"
                    >
                        Retry
                    </button>
            </div>
        );
    }

    const s = data.stats;
    return (
        <div className="mx-auto max-w-5xl p-4 sm:p-6">
            {/* header */}
            <div className="mb-4 flex items-center gap-4">
                <img
                    src={avatarUrl(data.uuid)}
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                        "data:image/svg+xml;utf8," +
                        encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="100%" height="100%" fill="#e5e7eb"/></svg>');
                    }}
                    alt={`${data.name} avatar`}
                    className="h-14 w-14 rounded-lg ring-1 ring-gray-200 dark:ring-gray-800"
                />
                <div className="flex-1">
                    <div className="text-sm">
                        <Link to="/players" className="text-blue-600 hover:underline dark:text-blue-400">{`← Players`}</Link>
                    </div>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">{data.name}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                            UUID: <code className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">{data.uuid}</code>
                        </span>
                        <span>Last seen: {fmtRel(data.lastSeen)}</span>
                    </div>
                </div>

                <button
                    onClick={refresh}
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900"
                >
                    Refresh
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Hours Played" value={ticksToHours(s.playTime)} hint={`${s.playTime.toLocaleString()} ticks`} />
                <StatCard label="Mob Kills" value={s.mobKills.toLocaleString()} />
                <StatCard label="Player Kills" value={s.playerKills.toLocaleString()} />
                <StatCard label="Deaths" value={s.deaths.toLocaleString()} />
                <StatCard label="K/D" value={kdr(s.playerKills, s.deaths)} />
                <StatCard label="Jumps" value={s.jumps.toLocaleString()} />
                <StatCard label="Walked" value={`${cmToKm(s.walkCm)} km`} hint={`${s.walkCm.toLocaleString()} cm`} />
                <StatCard label="Flown" value={`${cmToKm(s.flyCm)} km`} hint={`${s.flyCm.toLocaleString()} cm`} />
                <StatCard label="Boated" value={`${cmToKm(s.boatCm)} km`} hint={`${s.boatCm.toLocaleString()} cm`} />
                <StatCard label="Minecart" value={`${cmToKm(s.minecartCm)} km`} hint={`${s.minecartCm.toLocaleString()} cm`} />
                <StatCard label="Horseback" value={`${cmToKm(s.horseCm)} km`} hint={`${s.horseCm.toLocaleString()} cm`} />
                <StatCard label="Swum" value={`${cmToKm(s.swimCm)} km`} hint={`${s.swimCm.toLocaleString()} cm`} />
                <StatCard label="Damage Dealt" value={s.damageDealt.toLocaleString()} />
                <StatCard label="Damage Taken" value={s.damageTaken.toLocaleString()} />
                <StatCard label="Time Since Death" value={s.timeSinceDeath.toLocaleString()} />
                <StatCard label="Time Since Rest" value={s.timeSinceRest.toLocaleString()} />
                <StatCard label="Advancements" value={advTotal} />
            </div>

            {/* Top lists */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <TopList title="Top Blocks Mined" rows={data.top?.mined} />
                <TopList title="Top Items Used" rows={data.top?.used} />
                <TopList title="Mobs Killed" rows={data.top?.mobsKilled} />
                <TopList title="Common Death Causes" rows={data.top?.killedBy} />
            </div>

            {/* Advancements section */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <div className="mb-2 flex items-center justify-between">
                <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Advancements</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total: {advTotal}</div>
                </div>
                <button
                    onClick={() => void loadAllAdv()}
                    disabled={loading || advLoading || hasAll}
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900"
                >
                    {hasAll ? "All loaded" : advLoading ? "Loading…" : "View all"}
                </button>
            </div>

                {recentAdv.length ? (
                    <ul className="space-y-1 text-sm">
                        {recentAdv.map((a) => (
                        <li key={`recent-${a.id}`} className="flex items-center justify-between">
                            <span className="truncate">{prettyId(a.id)}</span>
                            <time className="text-xs text-gray-500">{a.when}</time>
                        </li>
                        ))}
                    </ul>
                    ) : (
                    <p className="text-sm text-gray-500">No recent advancements.</p>
                )}

                {advErr && <div className="mt-3 text-sm text-red-600 dark:text-red-400">Error: {advErr}</div>}

                {"advancements" in data && (data as PlayerWithAll).advancements?.all && (
                <>
                    <hr className="my-4 border-gray-200 dark:border-gray-800" />
                    <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">All Advancements</div>
                    <div className="max-h-64 overflow-auto rounded-lg border border-gray-100 p-2 dark:border-gray-800">
                        <ul className="space-y-1 text-sm">
                            {(data as PlayerWithAll).advancements.all.map((a) => (
                                <li key={`all-${a.id}-${a.when}`} className="flex items-center justify-between">
                                    <span className="truncate">{prettyId(a.id)}</span>
                                    <time className="text-xs text-gray-500">{a.when}</time>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
                )}
            </div>
        </div>
    );
}