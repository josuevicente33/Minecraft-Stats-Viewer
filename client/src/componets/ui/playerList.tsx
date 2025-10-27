import { useEffect, useState } from "react";
import { getPlayers } from "../../api/api";
import type { Player } from "../../types/types";
import { Link } from "react-router-dom";
import Card from "./Card";

export default function PlayerList() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const load = async () => {
        try {
        setLoading(true);
        const data = await getPlayers();
        setPlayers(data);
        setErr(null);
        } catch (e: any) {
        setErr(e.message ?? "Failed to load players");
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        let alive = true;
        (async () => { await load(); })();
        const id = setInterval(() => alive && load(), 30000);
        return () => { alive = false; clearInterval(id); };
    }, []);

    return (
        <Card>
        <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Players</h2>
            <button
                onClick={load}
                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 active:translate-y-px dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900"
            >
                Refresh
            </button>
        </div>

        {loading && !players.length && <p className="text-sm text-gray-500">Loading players…</p>}
        {err && <p className="text-sm text-red-600 dark:text-red-400">Error: {err}</p>}
        {!loading && !err && players.length === 0 && <p className="text-sm text-gray-500">No players have joined yet.</p>}

        {players.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-50 text-left dark:bg-gray-900/50">
                        <tr>
                            <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Name</th>
                            <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-300">UUID</th>
                        </tr>
                    </thead>

                    <tbody>
                        {players.map((p, i) => (
                            <tr key={p.uuid} className={i % 2 ? "bg-white dark:bg-gray-950" : "bg-gray-50/50 dark:bg-gray-900/30"}>
                                <td className="px-3 py-2">
                                    <Link to={`/players/${encodeURIComponent(p.uuid)}`} className="text-blue-600 hover:underline dark:text-blue-400">
                                        {p.name}
                                    </Link>
                                </td>

                                <td className="px-3 py-2">
                                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">{p.uuid}</code>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
        </Card>
    );
}