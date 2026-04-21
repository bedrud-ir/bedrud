import { GITHUB_REPO } from "./config";

const BASE = "https://api.github.com";
const TTL = 30 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();

async function fetchJSON<T>(path: string): Promise<T | null> {
  const key = path;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return (hit?.data as T) ?? null;
    const data = (await res.json()) as T;
    cache.set(key, { data, at: Date.now() });
    return data;
  } catch {
    return (hit?.data as T) ?? null;
  }
}

interface GitHubRepo {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
}

export async function fetchRepoInfo() {
  return fetchJSON<GitHubRepo>(`/repos/${GITHUB_REPO}`);
}
