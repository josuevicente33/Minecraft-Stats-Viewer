export function extractPlayerKey(rawUrl: string): string | null {
    const { pathname } = new URL(rawUrl, "http://localhost");
    const parts = pathname.split("/").filter(Boolean);

    const i = parts.indexOf("player");
    if (i === -1 || !parts[i + 1]) return null;

    if (parts[i + 2] && parts[i + 2] !== "advancements") return null;

    return decodeURIComponent(parts[i + 1]);
}

export function latestCriteriaTime(v: any): string | null {
    if (typeof v?.done === "string") return v.done;
    const crit = v?.criteria && Object.values(v.criteria);

    if (Array.isArray(crit) && crit.length) {
        return crit.reduce((a: string, b: string) => (a > b ? a : b));
    }
    if (Array.isArray(v?.granted) && v.granted.length) return v.granted.reduce((a: string, b: string) => (a > b ? a : b));
    if (v?.done === true) return "true";
    return null;
}