/** Chicoutimi, QC — Open-Meteo (no API key) */
const CHICOUTIMI = { lat: 48.4284, lon: -71.0688 };

export interface ChicoutimiWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  high: number;
  low: number;
  fetchedAt: string;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

export async function fetchChicoutimiWeather(): Promise<ChicoutimiWeather> {
  const params = new URLSearchParams({
    latitude: String(CHICOUTIMI.lat),
    longitude: String(CHICOUTIMI.lon),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "weather_code",
      "wind_speed_10m",
    ].join(","),
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "America/Toronto",
    forecast_days: "1",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error("Weather unavailable");

  const data = (await res.json()) as OpenMeteoResponse;
  return {
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    weatherCode: data.current.weather_code,
    high: data.daily.temperature_2m_max[0],
    low: data.daily.temperature_2m_min[0],
    fetchedAt: new Date().toISOString(),
  };
}

export function weatherDescription(code: number): { label: string; icon: string } {
  const map: Record<number, { label: string; icon: string }> = {
    0: { label: "Dégagé", icon: "☀️" },
    1: { label: "Principalement dégagé", icon: "🌤️" },
    2: { label: "Partiellement nuageux", icon: "⛅" },
    3: { label: "Couvert", icon: "☁️" },
    45: { label: "Brouillard", icon: "🌫️" },
    48: { label: "Brouillard givrant", icon: "🌫️" },
    51: { label: "Bruine légère", icon: "🌦️" },
    53: { label: "Bruine", icon: "🌦️" },
    55: { label: "Bruine dense", icon: "🌧️" },
    61: { label: "Pluie légère", icon: "🌧️" },
    63: { label: "Pluie", icon: "🌧️" },
    65: { label: "Forte pluie", icon: "🌧️" },
    71: { label: "Neige légère", icon: "🌨️" },
    73: { label: "Neige", icon: "❄️" },
    75: { label: "Forte neige", icon: "❄️" },
    77: { label: "Grains de neige", icon: "🌨️" },
    80: { label: "Averses légères", icon: "🌦️" },
    81: { label: "Averses", icon: "🌧️" },
    82: { label: "Fortes averses", icon: "⛈️" },
    85: { label: "Averses de neige", icon: "🌨️" },
    86: { label: "Fortes averses de neige", icon: "❄️" },
    95: { label: "Orage", icon: "⛈️" },
  };
  return map[code] ?? { label: "Conditions variables", icon: "🌡️" };
}

export function formatTemp(c: number): string {
  return `${Math.round(c)}°C`;
}
