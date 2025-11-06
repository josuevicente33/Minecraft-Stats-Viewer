import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLeaderboard } from "../api/api";
import { type LbRow } from "../types/types";
import { cmToKm, ticksToHours, avatarUrl } from "../util/util";

const METRICS = [
    { id: "playTime", label: "Hours Played" },
    { id: "mobKills", label: "Mob Kills" },
    { id: "playerKills", label: "Player Kills" },
    { id: "deaths", label: "Deaths" },
    { id: "walkCm", label: "Walked (km)" },
    { id: "flyCm", label: "Flown (km)" },
    { id: "damageDealt", label: "Damage Dealt" },
    { id: "damageTaken", label: "Damage Taken" },
    { id: "advancements", label: "Advancements Completed" },
];


function fmtMetricValue(metric: string, v: number) {
    if (metric === "playTime") return `${ticksToHours(v)} h`;
    if (metric === "walkCm" || metric === "flyCm") return `${cmToKm(v)} km`;
    return v.toLocaleString();
}

export default function Leaderboard() {
    const [metric, setMetric] = useState("playTime");
    const [order, setOrder] = useState<"asc"|"desc">("desc");
    const [limit, setLimit] = useState(25);
    const [rows, setRows] = useState<LbRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getLeaderboard(metric, order, limit);
            setRows(res.rows);
            setErr(null);
        } catch (e: unknown) {
            if (e instanceof Error) {
                setErr(e.message ?? "Failed to load leaderboard");
            } else {
                setErr(String(e) || "Failed to load leaderboard");
            }
        } finally {
            setLoading(false);
        }
    }, [metric, order, limit]);

    useEffect(() => { void load(); }, [metric, order, limit, load]);

    return (
        <div className="mx-auto max-w-5xl p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <div className="text-sm">
                        <Link to="/" className="text-blue-600 hover:underline dark:text-blue-400">{`← Home`}</Link>
                    </div>
                    <h1 className="mt-1 text-2xl font-semibold">Leaderboards</h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={metric}
                        onChange={(e)=>setMetric(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-800 dark:bg-gray-950"
                    >
                        {METRICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>

                    <select
                        value={order}
                        onChange={(e)=>setOrder(e.target.value as "asc" | "desc")}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-800 dark:bg-gray-950"
                    >
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                    </select>

                    <select
                        value={String(limit)}
                        onChange={(e)=>setLimit(Number(e.target.value))}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-800 dark:bg-gray-950"
                    >
                        {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>

                    <button
                        onClick={()=>void load()}
                        disabled={loading}
                        className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {err && <p className="mb-3 text-sm text-red-600 dark:text-red-400">Error: {err}</p>}

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 overflow-scroll">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <th className="px-4 py-2">#</th>
                        <th className="px-4 py-2">Player</th>
                        <th className="px-4 py-2">{METRICS.find(m => m.id===metric)?.label}</th>
                        <th className="px-4 py-2">Mob Kills</th>
                        <th className="px-4 py-2">Deaths</th>
                        <th className="px-4 py-2">Player Kills</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-4 py-3 text-sm text-gray-500">—</td>
                                    <td className="px-4 py-3"><div className="h-6 w-40 rounded bg-gray-100 dark:bg-gray-800" /></td>
                                    <td className="px-4 py-3"><div className="h-6 w-24 rounded bg-gray-100 dark:bg-gray-800" /></td>
                                    <td className="px-4 py-3"><div className="h-6 w-14 rounded bg-gray-100 dark:bg-gray-800" /></td>
                                    <td className="px-4 py-3"><div className="h-6 w-14 rounded bg-gray-100 dark:bg-gray-800" /></td>
                                    <td className="px-4 py-3"><div className="h-6 w-14 rounded bg-gray-100 dark:bg-gray-800" /></td>
                                </tr>
                        ))
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No data.</td></tr>
                        ) : (
                            rows.map((r, i) => (
                                <tr key={r.uuid} className="text-sm">
                                    <td className="px-4 py-2 tabular-nums">{i + 1}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <img src={avatarUrl(r.uuid.replace(/-/g, ""))} alt="" className="h-6 w-6 rounded" />
                                            <Link to={`/players/${encodeURIComponent(r.uuid)}`} className="text-blue-600 hover:underline dark:text-blue-400">
                                                {r.name}
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 tabular-nums">{fmtMetricValue(metric, r.value)}</td>
                                    <td className="px-4 py-2 tabular-nums">{r.extra?.mobKills?.toLocaleString?.() ?? "—"}</td>
                                    <td className="px-4 py-2 tabular-nums">{r.extra?.deaths?.toLocaleString?.() ?? "—"}</td>
                                    <td className="px-4 py-2 tabular-nums">{r.extra?.playerKills?.toLocaleString?.() ?? "—"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Tip: “Hours Played” is computed from ticks (20 ticks/sec). Distances convert cm → km.
            </p>
        </div>
    );
}
