export const prettyId = (id: string) =>
  id.replace(/^minecraft:/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export const ticksToHours = (t: number) => (t / 72000).toFixed(1);

export const cmToKm = (cm: number) => (cm / 100_000).toFixed(2);

export const kdr = (kills: number, deaths: number) => (deaths ? (kills / deaths).toFixed(2) : `${kills}.00`);

export const avatarUrl = (uuid: string) => `https://crafatar.com/avatars/${uuid}?overlay`;

export const fmtRel = (iso?: string | null) => {
    if (!iso) return "unknown";
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins/60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs/24);
    return `${days}d ago`;
};

