const CHICOUTIMI_LAT = 48.4284;
const CHICOUTIMI_LON = -71.0658;
const TIMEZONE = "America/Toronto";

const OPEN_METEO_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${CHICOUTIMI_LAT}&longitude=${CHICOUTIMI_LON}` +
  `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=${TIMEZONE}`;

interface OpenMeteoCurrent {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  weather_code: number;
  wind_speed_10m: number;
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
}

export interface ChicoutimiWeather {
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  condition: string;
  observedAt: string;
}

function weatherCodeToCondition(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

export async function getChicoutimiWeather(): Promise<ChicoutimiWeather | null> {
  try {
    const response = await fetch(OPEN_METEO_URL, {
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as OpenMeteoResponse;
    const current = data.current;

    if (!current) {
      return null;
    }

    return {
      temperatureC: current.temperature_2m,
      humidityPercent: current.relative_humidity_2m,
      windSpeedKmh: current.wind_speed_10m,
      condition: weatherCodeToCondition(current.weather_code),
      observedAt: current.time,
    };
  } catch {
    return null;
  }
}
