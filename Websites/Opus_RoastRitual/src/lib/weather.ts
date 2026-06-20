import { siteConfig } from "@/config/site";

export type ChicoutimiWeather = {
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  condition: string;
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

/** WMO weather codes — labels in French for the Chicoutimi section */
const WEATHER_LABELS_FR: Record<number, string> = {
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
  82: "Averses violentes",
  85: "Averses de neige",
  86: "Averses de neige fortes",
  95: "Orage",
  96: "Orage avec grêle",
  99: "Orage violent avec grêle",
};

function weatherCodeToLabel(code: number): string {
  return WEATHER_LABELS_FR[code] ?? "Conditions variables";
}

export async function getChicoutimiWeather(): Promise<ChicoutimiWeather | null> {
  const { lat, lng } = siteConfig.location.coordinates;

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "weather_code",
      "wind_speed_10m",
    ].join(","),
    timezone: "America/Toronto",
    wind_speed_unit: "kmh",
  });

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      { next: { revalidate: 900 } },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as OpenMeteoResponse;
    const current = data.current;

    if (!current) return null;

    return {
      temperatureC: Math.round(current.temperature_2m),
      apparentTemperatureC: Math.round(current.apparent_temperature),
      humidityPercent: current.relative_humidity_2m,
      windSpeedKmh: Math.round(current.wind_speed_10m),
      condition: weatherCodeToLabel(current.weather_code),
      observedAt: new Date(current.time),
    };
  } catch {
    return null;
  }
}

export function formatWeatherUpdatedAt(date: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}
