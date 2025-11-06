import { useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';
function getSystemPrefersDark() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = localStorage.getItem('theme') as Theme | null;
        return stored ?? 'dark';
    });

    useEffect(() => {
        const root = document.documentElement;

        if (theme === 'system') {
            localStorage.removeItem('theme');
            const sysDark = getSystemPrefersDark();
            root.classList.toggle('dark', sysDark);
            root.style.colorScheme = sysDark ? 'dark' : 'light';
        } else {
            localStorage.setItem('theme', theme);
            const isDark = theme === 'dark';
            root.classList.toggle('dark', isDark);
            root.style.colorScheme = isDark ? 'dark' : 'light';
        }
    }, [theme]);

    // Only react to OS changes when in 'system' mode
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            if (theme !== 'system') return;
            const dark = mq.matches;
            document.documentElement.classList.toggle('dark', dark);
            document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
        };
        mq.addEventListener?.('change', handler);
        return () => mq.removeEventListener?.('change', handler);
    }, [theme]);


    const cycle = useCallback(() => {
        setTheme((t) => (t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light'));
    }, []);

    const label = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';

    return (
        <button
            type="button"
            onClick={cycle}
            aria-label="Toggle color theme"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
            <ThemeIcon theme={theme} />
            <span className="text-sm">{label}</span>
        </button>
    );
}

function ThemeIcon({ theme }: { theme: Theme }) {
    if (theme === 'dark') return (
        <svg width="16" height="16" viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
    );
    if (theme === 'light') return (
        <svg width="16" height="16" viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 1v2m0 18v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
    );
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path d="M6 12a6 6 0 0 0 12 0c0-3-6-9-6-9s-6 6-6 9z"></path>
        </svg>
    );
}
