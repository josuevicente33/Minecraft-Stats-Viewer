import { useEffect, useState } from "react";
import { getStatus } from "../../api/api";
import type { Status } from "../../types/types";

export default function StatusBar() {
    const [data, setData] = useState<Status | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        const load = async () => {
        try {
            const s = await getStatus();
            if (alive) { setData(s); setErr(null); }
        } catch (e: any) {
            if (alive) setErr(e.message ?? "Failed to fetch status");
        }
        };
        load();
        const id = setInterval(load, 15000);
        return () => { alive = false; clearInterval(id); };
    }, []);

    if (err) return <div role="status" style={{ margin: "1rem 0", color: "#b00" }}>Error: {err}</div>;
    if (!data) return <div role="status" style={{ margin: "1rem 0" }}>Loading status…</div>;

    return (
        <div className="p-3 border border-gray-300 rounded border-r-8">
            <strong>Online:</strong> {data.online} / {data.max}
            {data.names?.length ? <span> — {data.names.join(", ")}</span> : <span> — nobody online</span>}
        </div>
    );
}
