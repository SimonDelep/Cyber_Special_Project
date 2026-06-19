import type { YogaCategory, YogaLevel, YogaPose } from './types';

const DEFAULT_BASE = 'https://yoga-api-nzy4.onrender.com/v1';
const FETCH_TIMEOUT_MS = 45_000;

type CacheEntry<T> = { data: T; expiresAt: number };
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 60 * 60 * 1000;

function getBaseUrl(): string {
  return import.meta.env.YOGA_API_BASE_URL ?? DEFAULT_BASE;
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Yoga API error (${res.status})`);
  }

  return res.json() as Promise<T>;
}

function flattenPoses(data: unknown): YogaPose[] {
  const poses: YogaPose[] = [];

  if (!data) return poses;

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === 'object' && 'poses' in item) {
        const cat = item as YogaCategory;
        poses.push(...(cat.poses ?? []));
      } else if (item && typeof item === 'object' && 'english_name' in item) {
        poses.push(item as YogaPose);
      }
    }
    return poses;
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.poses)) {
      return obj.poses as YogaPose[];
    }
    if ('english_name' in obj) {
      return [data as YogaPose];
    }
  }

  return poses;
}

export async function fetchPosesByLevel(
  level: YogaLevel,
  limit = 24,
): Promise<YogaPose[]> {
  const cacheKey = `poses:${level}:${limit}`;
  const cached = getCached<YogaPose[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchJson<unknown>(`/poses?level=${level}`);
  const poses = flattenPoses(data).slice(0, limit);
  setCache(cacheKey, poses);
  return poses;
}

export async function fetchCategories(): Promise<YogaCategory[]> {
  const cacheKey = 'categories';
  const cached = getCached<YogaCategory[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchJson<YogaCategory[]>('/categories');
  const categories = Array.isArray(data) ? data : [];
  setCache(cacheKey, categories);
  return categories;
}

export async function fetchFeaturedPoses(limit = 6): Promise<YogaPose[]> {
  try {
    return await fetchPosesByLevel('beginner', limit);
  } catch {
    try {
      const categories = await fetchCategories();
      const all = categories.flatMap((c) => c.poses ?? []);
      return all.slice(0, limit);
    } catch {
      return [];
    }
  }
}

export async function searchPoses(query: string, limit = 24): Promise<YogaPose[]> {
  const q = query.trim().toLowerCase();
  if (!q) return fetchPosesByLevel('beginner', limit);

  const categories = await fetchCategories();
  const all = categories.flatMap((c) =>
    (c.poses ?? []).map((p) => ({ ...p, category_name: c.category_name })),
  );

  return all
    .filter(
      (p) =>
        p.english_name.toLowerCase().includes(q) ||
        p.sanskrit_name_adapted.toLowerCase().includes(q) ||
        p.pose_description.toLowerCase().includes(q) ||
        (p.category_name?.toLowerCase().includes(q) ?? false),
    )
    .slice(0, limit);
}
