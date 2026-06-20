const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface SleepWeather {
  city: string;
  date: string;
  tempMin: number;
  tempMax: number;
  unit: string;
  sleepTip: string;
  source: 'open-meteo';
}

interface CacheEntry {
  data: SleepWeather;
  expiresAt: number;
}

let cache: CacheEntry | null = null;

function sleepTipForTemps(min: number, max: number): string {
  if (max >= 26) {
    return 'A warm night ahead — bamboo lyocell sheets help your body stay cool and dry.';
  }
  if (min <= 10) {
    return 'Cooler overnight lows — layer with a lavender weighted blanket for grounded warmth.';
  }
  return 'Mild conditions tonight — a silk sleep mask can help you drift off without distraction.';
}

export async function fetchSleepWeather(
  latitude = 45.5017,
  longitude = -73.5673,
  city = 'Montréal'
): Promise<SleepWeather | null> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'temperature_2m_min,temperature_2m_max',
    timezone: 'America/Toronto',
    forecast_days: '1',
  });

  try {
    const response = await fetch(`${OPEN_METEO_URL}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;

    const json = (await response.json()) as {
      daily?: {
        time?: string[];
        temperature_2m_min?: number[];
        temperature_2m_max?: number[];
      };
      daily_units?: { temperature_2m_min?: string };
    };

    const date = json.daily?.time?.[0];
    const tempMin = json.daily?.temperature_2m_min?.[0];
    const tempMax = json.daily?.temperature_2m_max?.[0];
    const unit = json.daily_units?.temperature_2m_min ?? '°C';

    if (date === undefined || tempMin === undefined || tempMax === undefined) {
      return null;
    }

    const data: SleepWeather = {
      city,
      date,
      tempMin,
      tempMax,
      unit,
      sleepTip: sleepTipForTemps(tempMin, tempMax),
      source: 'open-meteo',
    };

    cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  } catch {
    return null;
  }
}
