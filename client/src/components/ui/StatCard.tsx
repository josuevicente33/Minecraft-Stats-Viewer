export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
    return (
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
            <div className="text-sm text-muted">{label}</div>
            <div className="mt-1 text-xl font-semibold text-fg">{value}</div>
            {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
        </div>
    );
}
