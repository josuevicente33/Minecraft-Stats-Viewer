export function KeyValue({ k, v }: { k: string; v: string }) {
    return (
        <div className="rounded-xl border border-gray-800 p-4">
        <div className="text-gray-400 text-xs">{k}</div>
        <div className="text-base font-medium break-all">{v}</div>
        </div>
    );
}