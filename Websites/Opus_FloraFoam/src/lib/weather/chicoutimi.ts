const CHICOUTIMI_LAT = 48.4284;
const CHICOUTIMI_LON = -71.0687;

type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
};

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent;
};

export type ChicoutimiWeather = {
  temperatureC: number;
  feelsLikeC: number;
  humidityPercent: number;
  windKmh: number;
  condition: string;
  icon: string;
  observedAt: string;
};

const WMO_WEATHER: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Depositing rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Dense drizzle", icon: "🌧️" },
  56: { label: "Freezing drizzle", icon: "🌧️" },
  57: { label: "Freezing drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌦️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  66: { label: "Freezing rain", icon: "🌨️" },
  67: { label: "Freezing rain", icon: "🌨️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "❄️" },
  75: { label: "Heavy snow", icon: "❄️" },
  77: { label: "Snow grains", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Rain showers", icon: "🌧️" },
  82: { label: "Violent rain showers", icon: "⛈️" },
  85: { label: "Snow showers", icon: "🌨️" },
  86: { label: "Heavy snow showers", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Thunderstorm with hail", icon: "⛈️" },
};

function mapWeatherCode(code: number): { label: string; icon: string } {
  return WMO_WEATHER[code] ?? { label: "Unknown", icon: "🌡️" };
}

export async function fetchChicoutimiWeather(): Promise<ChicoutimiWeather | null> {
  const params = new URLSearchParams({
    latitude: String(CHICOUTIMI_LAT),
    longitude: String(CHICOUTIMI_LON),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "weather_code",
      "relative_humidity_2m",
      "wind_speed_10m",
    ].join(","),
    timezone: "America/Toronto",
  });

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      { next: { revalidate: 1800 } },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as OpenMeteoResponse;
    const current = data.current;
    if (!current) return null;

    const { label, icon } = mapWeatherCode(current.weather_code);

    return {
      temperatureC: Math.round(current.temperature_2m),
      feelsLikeC: Math.round(current.apparent_temperature),
      humidityPercent: current.relative_humidity_2m,
      windKmh: Math.round(current.wind_speed_10m),
      condition: label,
      icon,
      observedAt: current.time,
    };
  } catch {
    return null;
  }
}
