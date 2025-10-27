import * as fs from "fs/promises";

export async function safeJson<T = any>(path: string, fallback: T): Promise<T> {
  try {
    const s = await fs.readFile(path, "utf8");
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export async function listFiles(dir: string, endsWith: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dir);
    return files.filter(f => f.endsWith(endsWith));
  } catch {
    return [];
  }
}
