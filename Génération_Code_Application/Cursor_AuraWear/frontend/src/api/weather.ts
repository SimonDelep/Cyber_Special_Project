const CHICOUTIMI_LAT = 48.429;
const CHICOUTIMI_LON = -71.054;

export interface ChicoutimiWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  observedAt: string;
}

interface OpenMeteoCurrent {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  weather_code: number;
  wind_speed_10m: number;
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
}

export async function fetchChicoutimiWeather(): Promise<ChicoutimiWeather> {
  const params = new URLSearchParams({
    latitude: String(CHICOUTIMI_LAT),
    longitude: String(CHICOUTIMI_LON),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "weather_code",
      "wind_speed_10m",
    ].join(","),
    timezone: "America/Toronto",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) {
    throw new Error("Impossible de charger la météo");
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const current = data.current;

  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
    observedAt: current.time,
  };
}
