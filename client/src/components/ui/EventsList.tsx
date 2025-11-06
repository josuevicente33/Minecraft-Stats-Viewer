import type { RecentEvent } from "../../types/world";

export function EventsList({ events }: { events: RecentEvent[] }) {
    return (
        <ul className="divide-y divide-gray-800">
            {events.map((e, idx) => (
                <li key={idx} className="py-2 text-sm">
                    <span className="text-gray-400 mr-2">{new Date(e.ts).toLocaleString()}</span>
                    <span className="uppercase text-xs px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-800 mr-2">{e.type}</span>
                    <span>{e.message}</span>
                </li>
            ))}
        </ul>
    );
}