import { prettyId } from "../../util/util";

export function TopList({ title, rows, unit = "×" }: { title: string; rows?: { id: string; value: number }[]; unit?: string }) {
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