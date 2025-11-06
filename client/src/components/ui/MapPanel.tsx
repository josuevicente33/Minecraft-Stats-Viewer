import * as React from 'react';

type Status = 'checking' | 'available' | 'missing';

function useEndpointAvailability(urlBase: string) {
    const [status, setStatus] = React.useState<Status>('checking');
    const [rev, setRev] = React.useState(0);

    React.useEffect(() => {
        let alive = true;

        async function check() {
            try {
                const assetUrl = new URL('assets/bluemap.css', urlBase).toString();
                let asset = await fetch(assetUrl, { cache: 'no-store' });

                if (!asset.ok) {
                const indexUrl = new URL('index.html', urlBase).toString();
                const htmlRes = await fetch(indexUrl, { cache: 'no-store' });
                if (!htmlRes.ok) throw new Error('index.html missing');
                const text = await htmlRes.text();

                const looksLikeBlueMap =
                    /BlueMap/i.test(text) ||
                    /bluemap\.css/i.test(text) ||
                    /<div[^>]+id="bluemap-root"/i.test(text);

                if (!alive) return;
                setStatus(looksLikeBlueMap ? 'available' : 'missing');
                return;
                }

                if (!alive) return;
                setStatus('available');
            } catch {
                if (!alive) return;
                setStatus('missing');
            }
        }
        check();
        return () => { alive = false; };
    }, [urlBase, rev]);

    const retry = () => setRev(n => n + 1);
    return { status, retry, rev };
}


export function MapPanel() {
    const { status, retry, rev } = useEndpointAvailability('/map/');

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

