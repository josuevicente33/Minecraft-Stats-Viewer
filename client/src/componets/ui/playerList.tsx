import { useEffect, useState } from "react";
import { getPlayers } from "../../api/api";
import type { Player } from "../../types/types";

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
    const id = setInterval(() => alive && load(), 30000); // refresh every 30s
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h2 style={{ margin: "0.5rem 0" }}>Players</h2>
        <button onClick={load} style={{ padding: ".25rem .6rem", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {loading && !players.length && <p>Loading players…</p>}
      {err && <p style={{ color: "#b00" }}>Error: {err}</p>}
      {!loading && !err && players.length === 0 && <p>No players have joined yet.</p>}

      {players.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>UUID</th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.uuid}>
                <td style={td}>{p.name}</td>
                <td style={td}><code>{p.uuid}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: ".5rem", borderBottom: "1px solid #eee" };
const td: React.CSSProperties = { padding: ".5rem", borderBottom: "1px solid #f5f5f5" };
