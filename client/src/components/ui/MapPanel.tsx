import * as React from 'react';

type Status = 'checking' | 'available' | 'missing';

function useBlueMapAvailability(base: string, file = 'favicon.png', timeoutMs = 6000) {
    const [status, setStatus] = React.useState<Status>('checking');
    const [rev, setRev] = React.useState(0);

    const retry = React.useCallback(() => {
        setStatus('checking');
        setRev(v => v + 1);
    }, []);

    React.useEffect(() => {
        let done = false;
        const img = new Image();

        const finish = (s: Status) => {
            if (!done) {
                done = true;
                setStatus(s);
            }
        };

        const url = `${base.replace(/\/$/, '')}/${file}?cb=${Date.now()}`;

        const t = window.setTimeout(() => finish('missing'), timeoutMs);

        img.onload = () => { window.clearTimeout(t); finish('available'); };
        img.onerror = () => { window.clearTimeout(t); finish('missing'); };

        img.referrerPolicy = 'no-referrer';
        img.src = url;

        return () => {
            done = true;
            window.clearTimeout(t);
        };
    }, [base, rev, file, timeoutMs]);

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