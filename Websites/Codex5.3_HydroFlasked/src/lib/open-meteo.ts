/** Open-Meteo — free weather API, no key required. https://open-meteo.com/ */

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export const DEFAULT_WEATHER_LOCATION = {
  latitude: 48.428,
  longitude: -71.253,
  label: "Saguenay (Chicoutimi)",
} as const;

type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  weather_code: number;
};

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: OpenMeteoCurrent;
};

export type WeatherSnapshot = {
  locationLabel: string;
  latitude: number;
  longitude: number;
  temperatureC: number;
  humidityPercent: number;
  weatherLabel: string;
  weatherIcon: string;
  hydrationTip: string;
  fetchedAt: string;
  source: "open-meteo";
};

/** WMO weather interpretation codes (Open-Meteo). */
export function weatherCodeToLabel(code: number): { label: string; icon: string } {
  if (code === 0) return { label: "Clear sky", icon: "☀️" };
  if (code <= 3) return { label: "Partly cloudy", icon: "⛅" };
  if (code <= 48) return { label: "Foggy", icon: "🌫️" };
  if (code <= 57) return { label: "Drizzle", icon: "🌦️" };
  if (code <= 67) return { label: "Rain", icon: "🌧️" };
  if (code <= 77) return { label: "Snow", icon: "❄️" };
  if (code <= 82) return { label: "Rain showers", icon: "🌧️" };
  if (code <= 86) return { label: "Snow showers", icon: "🌨️" };
  if (code <= 99) return { label: "Thunderstorm", icon: "⛈️" };
  return { label: "Variable conditions", icon: "🌡️" };
}

export function hydrationTipForWeather(
  temperatureC: number,
  humidityPercent: number,
): string {
  if (temperatureC >= 28) {
    return "Heat alert: keep a cold tumbler within reach and sip water regularly — our double-wall steel holds ice for hours.";
  }
  if (temperatureC >= 20) {
    return "Warm day ahead: ideal for iced drinks in a travel tumbler. Aim for steady sips through the afternoon.";
  }
  if (temperatureC >= 10) {
    return "Mild conditions: room-temperature or lightly chilled water works well. A sealed lid keeps dust out on the go.";
  }
  if (temperatureC >= 0) {
    return "Cool weather: herbal tea or warm lemon water in an insulated mug keeps comfort high without spills.";
  }
  if (humidityPercent >= 75) {
    return "Cold and humid: you still lose moisture indoors. Warm drinks in an insulated wine mug or tumbler help you hydrate.";
  }
  return "Freezing outside: reach for hot beverages in vacuum-insulated drinkware — heat retention is your best friend today.";
}

export async function fetchWeatherSnapshot(
  latitude: number,
  longitude: number,
  locationLabel: string,
): Promise<WeatherSnapshot | null> {
  try {
    const url = new URL(FORECAST_URL);
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,weather_code");
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url.toString(), {
      next: { revalidate: 900 },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as OpenMeteoResponse;
    const { label, icon } = weatherCodeToLabel(data.current.weather_code);

    return {
      locationLabel,
      latitude: data.latitude,
      longitude: data.longitude,
      temperatureC: Math.round(data.current.temperature_2m),
      humidityPercent: data.current.relative_humidity_2m,
      weatherLabel: label,
      weatherIcon: icon,
      hydrationTip: hydrationTipForWeather(
        data.current.temperature_2m,
        data.current.relative_humidity_2m,
      ),
      fetchedAt: data.current.time,
      source: "open-meteo",
    };
  } catch {
    return null;
  }
}
