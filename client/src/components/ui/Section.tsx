export function Section({
    title,
    loading,
    children,
}: { title: string; loading?: boolean; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl bg-section/60 border border-border shadow-sm">
            <header className="px-4 py-3 border-b border-border">
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