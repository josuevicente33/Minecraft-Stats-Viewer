import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

// API AND TYPES
import { getPlayer, getAdvancementsMerged } from "../api/api";
import type { PlayerSummary, AdvMerged } from "../types/types";

// UTILS
import { prettyId, ticksToHours, cmToKm, kdr, avatarUrl } from "../util/util";

// UI
import { StatCard } from "../componets/ui/StatCard";
import { TopList } from "../componets/ui/TopList";
import InfoPopover from "../componets/ui/InfoPopover";

export default function Player() {
    const { id = "" } = useParams();
    const [data, setData] = useState<PlayerSummary | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [fullAdv, setFullAdv] = useState<null | { total: number; done: number; rows: AdvMerged[] }>(null);
    const [fullLoading, setFullLoading] = useState(false);
    const [fullErr, setFullErr] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<"all"|"done"|"todo"|"available"|"locked">("all");

    const loadMergedAdv = async () => {
        if (fullAdv) return;
            setFullLoading(true);
        try {
            const res = await getAdvancementsMerged(id);
            setFullAdv(res);
            setFullErr(null);
        } catch (e: any) {
            setFullErr(e?.message ?? "Failed to load advancements");
        } finally {
            setFullLoading(false);
        }
    };

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
    };

    const refresh = async () => { await loadSummary(); };

    useEffect(() => {
        setFullLoading(false);
        setFullErr(null);
        setData(null);
        setErr(null);
        setFullAdv(null);
        setQuery("");
        setFilter("all");
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
                            UUID: <code className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">{id}</code>
                        </span>
                        {/* <span>Last seen: {fmtRel(data.lastSeen)}</span> */}
                    </div>
                </div>

                <button
                    onClick={refresh}
                    disabled={loading}
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
                        onClick={loadMergedAdv}
                        disabled={fullLoading || !!fullAdv}
                        className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900"
                    >
                        {fullAdv ? "Full list loaded" : fullLoading ? "Loading…" : "Load full list (locked too)"}
                    </button>
                </div>

                {recentAdv.length ? (
                    <ul className="space-y-1 text-sm">
                        {recentAdv.map((a) => (
                        <li key={`recent-${a.id}`} className="flex items-center justify-between">
                            <span className="truncate">{prettyId(a.id)}</span>
                            <time className="text-xs text-gray-500">{a.when ? new Date(a.when).toLocaleString() : "locked"}</time>
                        </li>
                        ))}
                    </ul>
                    ) : (
                    <p className="text-sm text-gray-500">No recent advancements.</p>
                )}

                {fullErr && <div className="mt-3 text-sm text-red-600 dark:text-red-400">Error: {fullErr}</div>}

                {fullAdv && (
                    <>
                    <hr className="my-4 border-gray-200 dark:border-gray-800" />

                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <input
                            value={query}
                            onChange={(e)=>setQuery(e.target.value)}
                            placeholder="Search advancement…"
                            className="min-w-[220px] flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-800 dark:bg-gray-950"
                        />
                        <select
                            value={filter}
                            onChange={(e)=>setFilter(e.target.value as any)}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-800 dark:bg-gray-950"
                        >
                            <option value="all">All</option>
                            <option value="done">Completed</option>
                            <option value="todo">Incomplete</option>
                            <option value="available">Available</option>
                            <option value="locked">Locked</option>
                        </select>

                        
                        <InfoPopover label="What do these filters mean?">
                            <div className="space-y-2">
                                <div>
                                    <span className="font-medium">Completed</span> — you’ve finished this advancement.
                                </div>
                                <div>
                                    <span className="font-medium">Available</span> — not completed yet, but all required parents are done (or
                                    it’s a root), so you can work on it now.
                                </div>
                                <div>
                                    <span className="font-medium">Locked</span> — not completed and at least one parent in the chain isn’t
                                    done yet.
                                </div>
                                <hr className="my-2 border-gray-200 dark:border-gray-800" />
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Tip: use the search box to filter by title. Use <code>id:foo</code> to search by id.
                                </div>
                            </div>
                        </InfoPopover>
                    </div>

                    <div className="max-h-72 overflow-auto rounded-lg border border-gray-100 p-2 dark:border-gray-800">
                        <ul className="space-y-1 text-sm">
                            {fullAdv.rows
                                .filter(r => {
                                    if (filter === "all") return true;
                                    if (filter === "done") return r.done;
                                    if (filter === "todo") return !r.done;
                                    
                                    if ("state" in r) {
                                        if (filter === "available") return r.state === "available";
                                        if (filter === "locked") return r.state === "locked";
                                    }
                                    return true;
                                })
                                .filter(r => {
                                    const term = query.trim().toLowerCase();
                                    if (!term) return true;

                                    if (term.startsWith("id:")) {
                                        const needle = term.slice(3).trim();
                                        const idNoNs = r.id.replace(/^minecraft:/, "").toLowerCase();
                                        return idNoNs.includes(needle);
                                    }

                                    const name = prettyId(r.title).toLowerCase();
                                    return name.includes(term)
                                })
                                .map((a) => (
                                    <li
                                        key={`${a.id}-${a.when ?? "none"}`}
                                        // make li focusable so keyboard users can reveal the tooltip via tab + focus
                                        tabIndex={0}
                                        className="group relative flex items-center justify-between gap-4 py-2"
                                        aria-describedby={`adv-desc-${a.id}`}
                                    >
                                        {/* LEFT: title */}
                                        <div className="flex-1 min-w-0">
                                            <span className={`truncate ${a.done ? "" : "text-gray-500 dark:text-gray-400"}`}>
                                                {prettyId(a.title)}
                                            </span>

                                            {/* tooltip: appears on hover / focus of the li (group) */}
                                            <div
                                                id={`adv-desc-${a.id}`}
                                                role="status"
                                                className="pointer-events-none invisible opacity-0 transition-opacity duration-150 absolute left-0 top-full mt-2 z-20 w-md max-w-full rounded-lg border bg-white p-3 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100"
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* optional icon (if you later extract icons) */}
                                                    {/* {a.iconItem ? ( */}
                                                        {/* <div className="flex-shrink-0"> */}
                                                        {/* placeholder square for icon; replace with <img> when you extract assets */}
                                                        {/* <div className="h-8 w-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs"> */}
                                                            {/* {a.iconItem.split(":").pop()} */}
                                                        {/* </div> */}
                                                        {/* </div> */}
                                                    {/* ) : null} */}

                                                <div className="min-w-0">
                                                    <div className="mb-1 font-medium text-gray-900 dark:text-gray-100">
                                                    {prettyId(a.title)}
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-300">
                                                    {a.description ?? ""}
                                                    </div>

                                                    {/* meta row inside tooltip (category + when) */}
                                                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
                                                        {a.category ?? "misc"}
                                                    </span>
                                                    {a.when ? <span>Last trigger: {a.when ? new Date(a.when).toLocaleString() : "locked"}</span> : null}
                                                    </div>
                                                </div>
                                                </div>

                                                {/* little caret/arrow */}
                                                <div className="absolute left-4 top-0 -translate-y-1/2 transform">
                                                    <svg className="h-3 w-3 text-white dark:text-gray-900" viewBox="0 0 8 8" fill="none" aria-hidden>
                                                        <path d="M0 6 L4 0 L8 6 Z" fill="currentColor" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* MIDDLE: category label */}
                                        <div className="hidden md:flex items-center justify-center w-36 shrink-0">
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">
                                                {a.category ?? "misc"}
                                            </span>
                                        </div>

                                        {/* RIGHT: state pill */}
                                        <div className="shrink-0">
                                        {"state" in a && (
                                            <span
                                                className={[
                                                    "rounded-md px-2 py-0.5 text-xs",
                                                    a.state === "done"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                    : a.state === "available"
                                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                                                ].join(" ")}
                                            >
                                                {String(a.state).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Completed {fullAdv.done} / {fullAdv.total}
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}