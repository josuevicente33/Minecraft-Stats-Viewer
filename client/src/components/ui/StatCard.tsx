export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
            <div className="mt-1 text-xl font-semibold">{value}</div>
            {hint && <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
        </div>
    );
}
