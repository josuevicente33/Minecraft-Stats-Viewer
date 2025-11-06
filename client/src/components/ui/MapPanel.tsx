import * as React from 'react';

type Status = 'checking' | 'available' | 'missing';

function useBlueMapAvailability(base: string, timeoutMs = 6000) {
    const [status, setStatus] = React.useState<Status>('checking');
    const [rev, setRev] = React.useState(0);
    const retry = React.useCallback(() => {
        setStatus('checking');
        setRev(v => v + 1);
    }, []);

    React.useEffect(() => {
        let alive = true;

        const mark = (s: Status) => { if (alive) setStatus(s); };

        (async () => {
        try {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), timeoutMs);

            // Cache-bust to avoid stale HTML
            const resp = await fetch(
            `${base.replace(/\/$/, '')}/?probe=${Date.now()}`,
            { method: 'GET', cache: 'no-store', signal: ctrl.signal }
            );
            clearTimeout(t);

            if (!resp.ok) return mark('missing');

            const html = await resp.text();

            const looksLikeStatsApp = html.includes('name="x-stats-ui"');
            const looksLikeBlueMap  = /BlueMap/i.test(html) || /id=["']bluemap["']/.test(html);

            if (!looksLikeStatsApp && looksLikeBlueMap) mark('available');
            else mark('missing');
        } catch {
            mark('missing');
        }
        })();

        return () => { alive = false; };
    }, [base, rev, timeoutMs]);

    return { status, retry, rev };
}

export function MapPanel() {
    const { status, retry, rev } = useBlueMapAvailability('/map/');

    if (status === 'checking') {
        return (
        <div className="h-[520px] p-6">
            <div className="h-full animate-pulse rounded-xl bg-[--color-card]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="text-sm text-muted">Checking map availability...</span>
            </div>
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