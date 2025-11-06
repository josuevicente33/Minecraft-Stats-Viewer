import { useEffect, useState } from "react";

// Types
import type { WorldOverview, WorldProgression, RecentEvent } from "../types/world";

// UI
import { EventsList } from "../components/ui/EventsList";
import { Section } from "../components/ui/Section";
import { OverviewGrid } from "../components/ui/OverviewGrid";
import { EmptyNote } from "../components/ui/EmptyNote";
import { ProgressionPanel } from "../components/ui/ProgressionPanel";
import { MapPanel } from "../components/ui/MapPanel";

export default function World() {
    const [mapOpen, setMapOpen] = useState(true);
    const [overview, setOverview] = useState<WorldOverview | null>(null);
    const [prog, setProg] = useState<WorldProgression | null>(null);
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
            const [o, p, e] = await Promise.all([
                fetch("/api/world/overview").then(r => r.json()),
                fetch("/api/world/progression").then(r => r.json()),
                fetch("/api/world/events?limit=20").then(r => r.json()),
            ]);
            if (!alive) return;
            setOverview(o);
            setProg(p);
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
            <section className="rounded-2xl bg-section/60 border border-border shadow-sm">
                <header className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">Map / Viewer</span>
                        <span className="text-xs text-gray-400">(Bluemap)</span>
                    </div>
                    <button
                        onClick={() => setMapOpen(v => !v)}
                        className="rounded-xl border border-gray-700 px-3 py-1.5 text-sm hover:bg-gray-300 dark:hover:bg-gray-800"
                    >
                        {mapOpen ? "Collapse" : "Expand"}
                    </button>
                </header>
                {mapOpen && <MapPanel />}
            </section>

            {/* Overview */}
            <Section title="Overview" loading={loading}>
                {overview ? <OverviewGrid data={overview} /> : <EmptyNote note="No overview data." />}
            </Section>

            {/* Progression */}
            <Section title="Progression" loading={loading}>
                {prog ? <ProgressionPanel data={prog} /> : <EmptyNote note="No progression data." />}
            </Section>

            {/* Optional: Recent Activity */}
            <Section title="Recent Activity" loading={loading}>
                {events?.length ? <EventsList events={events!} /> : <EmptyNote note="No recent activity." />}
            </Section>
        </div>
    );
}