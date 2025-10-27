import { useEffect, useState } from "react";
import { getStatus } from "../../api/api";
import type { Status } from "../../types/types";
import Card from "./Card";


export default function StatusBar() {
    const [data, setData] = useState<Status | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        const load = async () => {
        try {
            const s = await getStatus();
            if (alive) { setData(s); setErr(null); }
        } catch (e: unknown) { if (alive) setErr(e instanceof Error ? e.message : String(e) || "Failed to fetch status"); }
        };
        load();
        const id = setInterval(load, 15000);
        return () => { alive = false; clearInterval(id); };
    }, []);

    return (
        <Card>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-medium">Server Status</h2>
                        {err ? (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">Error: {err}</p>
                        ) : !data ? (
                            <p className="mt-1 text-sm text-gray-500">Loading…</p>
                        ) : (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Online <span className="font-semibold text-gray-900 dark:text-gray-100">{data.online}</span> / {data.max}
                            </p>
                        )}
                </div>
                {data?.names?.length ? (
                    <div className="flex flex-wrap items-center gap-2">
                        {data.names.map(n => (
                        <span
                            key={n}
                            className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-800 dark:text-gray-300"
                        >
                            {n}
                        </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-sm text-gray-500">Nobody online</span>
                )}
            </div>
        </Card>
    );
}