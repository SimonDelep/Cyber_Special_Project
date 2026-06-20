const ADVICE_SLIP_URL = 'http://api.adviceslip.com/advice';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface DailyAdvice {
  id: number;
  advice: string;
  source: 'advice-slip' | 'fallback';
}

const FALLBACK_ADVICE = [
  'Create a wind-down ritual — dim the lights, breathe deeply, and let the day dissolve.',
  'Your bedroom is a sanctuary. Keep it cool, dark, and free from screens before sleep.',
  'Consistency is the secret to restful nights — aim for the same bedtime, even on weekends.',
  'Weighted pressure signals calm to the nervous system — like a gentle hug through the night.',
];

interface CacheEntry {
  data: DailyAdvice;
  expiresAt: number;
}

let cache: CacheEntry | null = null;

export async function fetchDailyAdvice(): Promise<DailyAdvice> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  try {
    const response = await fetch(ADVICE_SLIP_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error('Advice API unavailable');

    const json = (await response.json()) as { slip?: { id?: number; advice?: string } };
    const advice = json.slip?.advice?.trim();
    const id = json.slip?.id ?? 0;

    if (!advice) throw new Error('Empty advice');

    const data: DailyAdvice = { id, advice, source: 'advice-slip' };
    cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  } catch {
    const fallback: DailyAdvice = {
      id: 0,
      advice: FALLBACK_ADVICE[Math.floor(Math.random() * FALLBACK_ADVICE.length)],
      source: 'fallback',
    };
    return fallback;
  }
}
