export function Section({
    title,
    loading,
    children,
}: { title: string; loading?: boolean; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl bg-gray-900/60 border border-gray-800 shadow-sm">
            <header className="px-4 py-3 border-b border-gray-800">
                <h2 className="text-lg font-semibold">{title}</h2>
            </header>
            <div className="p-4">
                {loading ? <Skeleton /> : children}
            </div>
        </section>
    );
    }

function Skeleton() {
    return (
        <div className="grid gap-3">
            <div className="h-6 w-48 bg-gray-800/70 rounded" />
            <div className="h-6 w-72 bg-gray-800/70 rounded" />
            <div className="h-6 w-full bg-gray-800/70 rounded" />
        </div>
    );
}