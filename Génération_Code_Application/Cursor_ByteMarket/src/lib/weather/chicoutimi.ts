/** Chicoutimi (Saguenay), QC — Open-Meteo, no API key required. */
const LATITUDE = 48.43;
const LONGITUDE = -71.07;
const TIMEZONE = "America/Toronto";

const OPEN_METEO_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&timezone=${encodeURIComponent(TIMEZONE)}`;

export type ChicoutimiWeather = {
  city: string;
  temperatureC: number;
  feelsLikeC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  conditionLabel: string;
  conditionIcon: string;
  observedAt: Date;
};

type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  weather_code: number;
  wind_speed_10m: number;
};

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent;
};

const WMO_LABELS_FR: Record<number, string> = {
  0: "Ciel dégagé",
  1: "Principalement dégagé",
  2: "Partiellement nuageux",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine légère",
  53: "Bruine",
  55: "Bruine dense",
  56: "Bruine verglaçante",
  57: "Bruine verglaçante dense",
  61: "Pluie faible",
  63: "Pluie",
  65: "Pluie forte",
  66: "Pluie verglaçante",
  67: "Pluie verglaçante forte",
  71: "Neige faible",
  73: "Neige",
  75: "Neige forte",
  77: "Grains de neige",
  80: "Averses faibles",
  81: "Averses",
  82: "Averses fortes",
  85: "Averses de neige",
  86: "Fortes averses de neige",
  95: "Orage",
  96: "Orage avec grêle",
  99: "Orage violent",
};

const WMO_ICONS: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  56: "🌧️",
  57: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  66: "🌧️",
  67: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "❄️",
  77: "❄️",
  80: "🌦️",
  81: "🌧️",
  82: "🌧️",
  85: "🌨️",
  86: "❄️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

function labelForCode(code: number): string {
  return WMO_LABELS_FR[code] ?? "Conditions variables";
}

function iconForCode(code: number): string {
  return WMO_ICONS[code] ?? "🌡️";
}

let cache: { data: ChicoutimiWeather; expiresAt: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function getChicoutimiWeather(): Promise<ChicoutimiWeather | null> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  try {
    const response = await fetch(OPEN_METEO_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;

    const json = (await response.json()) as OpenMeteoResponse;
    const current = json.current;
    if (!current) return null;

    const data: ChicoutimiWeather = {
      city: "Chicoutimi",
      temperatureC: Math.round(current.temperature_2m),
      feelsLikeC: Math.round(current.apparent_temperature),
      humidityPercent: Math.round(current.relative_humidity_2m),
      windSpeedKmh: Math.round(current.wind_speed_10m),
      conditionLabel: labelForCode(current.weather_code),
      conditionIcon: iconForCode(current.weather_code),
      observedAt: new Date(current.time),
    };

    cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  } catch {
    return null;
  }
}

export function formatObservedAt(date: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
