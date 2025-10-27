import { useEffect, useRef, useState } from "react";

export default function InfoPopover({
    label = "What do these filters mean?",
    children,
}: {
    label?: string;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div className="relative inline-block" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                aria-label={label}
                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900"
                title={label}
            >
                ?
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label="Advancement filter info"
                    className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-lg dark:border-gray-800 dark:bg-gray-950"
                >
                    {children}
                </div>
            )}
        </div>
    );
}
