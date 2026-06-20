/** Chicoutimi, QC (Saguenay) — Open-Meteo, no API key required. */
const LATITUDE = 48.4294;
const LONGITUDE = -71.0528;
const TIMEZONE = 'America/Toronto';

export type ChicoutimiWeather = {
  location: string;
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  weatherCode: number;
  condition: string;
  icon: string;
  observedAt: string;
};

type OpenMeteoCurrent = {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
};

/** WMO weather interpretation codes (Open-Meteo). */
const WEATHER_BY_CODE: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Clear sky', icon: '☀️' },
  1: { condition: 'Mainly clear', icon: '🌤️' },
  2: { condition: 'Partly cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Fog', icon: '🌫️' },
  48: { condition: 'Depositing rime fog', icon: '🌫️' },
  51: { condition: 'Light drizzle', icon: '🌦️' },
  53: { condition: 'Drizzle', icon: '🌦️' },
  55: { condition: 'Dense drizzle', icon: '🌧️' },
  56: { condition: 'Freezing drizzle', icon: '🌧️' },
  57: { condition: 'Freezing drizzle', icon: '🌧️' },
  61: { condition: 'Light rain', icon: '🌧️' },
  63: { condition: 'Rain', icon: '🌧️' },
  65: { condition: 'Heavy rain', icon: '🌧️' },
  66: { condition: 'Freezing rain', icon: '🌨️' },
  67: { condition: 'Freezing rain', icon: '🌨️' },
  71: { condition: 'Light snow', icon: '🌨️' },
  73: { condition: 'Snow', icon: '❄️' },
  75: { condition: 'Heavy snow', icon: '❄️' },
  77: { condition: 'Snow grains', icon: '❄️' },
  80: { condition: 'Rain showers', icon: '🌦️' },
  81: { condition: 'Rain showers', icon: '🌧️' },
  82: { condition: 'Violent rain showers', icon: '⛈️' },
  85: { condition: 'Snow showers', icon: '🌨️' },
  86: { condition: 'Heavy snow showers', icon: '❄️' },
  95: { condition: 'Thunderstorm', icon: '⛈️' },
  96: { condition: 'Thunderstorm with hail', icon: '⛈️' },
  99: { condition: 'Thunderstorm with hail', icon: '⛈️' },
};

function describeWeather(code: number): { condition: string; icon: string } {
  return WEATHER_BY_CODE[code] ?? { condition: 'Unknown', icon: '🌡️' };
}

export async function fetchChicoutimiWeather(): Promise<ChicoutimiWeather | null> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(LATITUDE));
  url.searchParams.set('longitude', String(LONGITUDE));
  url.searchParams.set(
    'current',
    'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
  );
  url.searchParams.set('timezone', TIMEZONE);
  url.searchParams.set('forecast_days', '1');

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as OpenMeteoCurrent;
    const current = data.current;
    if (!current) return null;

    const { condition, icon } = describeWeather(current.weather_code);

    return {
      location: 'Chicoutimi, QC',
      temperatureC: Math.round(current.temperature_2m),
      apparentTemperatureC: Math.round(current.apparent_temperature),
      humidityPercent: Math.round(current.relative_humidity_2m),
      windSpeedKmh: Math.round(current.wind_speed_10m),
      weatherCode: current.weather_code,
      condition,
      icon,
      observedAt: current.time,
    };
  } catch {
    return null;
  }
}

export function formatObservedTime(isoLocal: string): string {
  try {
    const date = new Date(isoLocal);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return '';
  }
}
