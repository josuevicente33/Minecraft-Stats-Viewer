import * as React from 'react';

type Status = 'checking' | 'available' | 'missing';

function useBlueMapAvailability(base: string) {
    const [status, setStatus] = React.useState<Status>('checking');
    const [rev, setRev] = React.useState(0);

    React.useEffect(() => {
        let alive = true;
        async function check() {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 8000); // 8s

            try {
                const url = new URL('maps.json', base).toString();

                // BlueMap returns an array of maps (or { maps: [...] } in some versions)
                const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
                if (!alive) return;

                if (!res.ok) {
                setStatus('missing');
                return;
                }

                const data = await res.json().catch(() => null);
                const looksBlueMap =
                Array.isArray(data) ||
                (data && typeof data === 'object' && Array.isArray((data as any).maps));

                setStatus(looksBlueMap ? 'available' : 'missing');
            } catch (_e) {
                if (!alive) return;
                setStatus('missing');
            } finally {
                clearTimeout(t);
            }
        }

        check();
        return () => {
            alive = false;
        };
    }, [base, rev]);

    const retry = () => setRev(n => n + 1);
    return { status, retry, rev };
}


export function MapPanel() {
    const { status, retry, rev } = useBlueMapAvailability('/map/');

    if (status === 'checking') {
        return (
        <div className="h-[520px] p-6">
            <div className="h-full animate-pulse rounded-xl bg-[--color-card] border border-[--color-border]" />
        </div>
        );
    }

    if (status === 'missing') {
        return (
            <div className="p-8 text-center bg-card">
                <div className="mx-auto mb-3 h-10 w-10 rounded-full border border-[--color-border] grid place-items-center">
                    <span className="text-sm">🗺️</span>
                </div>

                <h3 className="text-fg font-semibold">Map not available</h3>
                <p className="text-sm text-muted mt-1">
                    We couldn’t detect BlueMap at <code className="px-1 rounded bg-[--color-card] border border-[--color-border]">/map/</code>.
                    Start the service or check the proxy path.
                </p>

                <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                        onClick={retry}
                        className="rounded-lg px-3 py-1.5 text-sm border border-border hover:bg-background dark:hover:bg-gray-800"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[520px] relative">
            <iframe
                key={rev}
                src="/map/"
                title="World Map"
                className="absolute inset-0 w-full h-full rounded-b-2xl"
                referrerPolicy="no-referrer"
            />
        </div>
    );
}

