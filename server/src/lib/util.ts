export function toISOFromMc(s?: string | null): string | null {
  if (!s) return null;

  // "YYYY-MM-DD HH:mm:ss +0000"  ->  "YYYY-MM-DDTHH:mm:ss+00:00"
  const isoish = s.trim().replace(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})\s*([+-]\d{2})(\d{2})$/,
    "$1T$2$3:$4"
  );

  const d = new Date(isoish);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

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