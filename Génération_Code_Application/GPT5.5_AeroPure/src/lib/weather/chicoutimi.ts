const CHICOUTIMI_LAT = 48.4281;
const CHICOUTIMI_LON = -71.0533;

export type ChicoutimiWeather = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  fetchedAt: string;
};

/** WMO weather codes → French label + emoji (Open-Meteo) */
function weatherFromCode(code: number): { description: string; icon: string } {
  if (code === 0) return { description: "Ciel dégagé", icon: "☀️" };
  if (code === 1) return { description: "Principalement dégagé", icon: "🌤️" };
  if (code === 2) return { description: "Partiellement nuageux", icon: "⛅" };
  if (code === 3) return { description: "Couvert", icon: "☁️" };
  if (code === 45 || code === 48) return { description: "Brouillard", icon: "🌫️" };
  if (code >= 51 && code <= 57) return { description: "Bruine", icon: "🌦️" };
  if (code >= 61 && code <= 67) return { description: "Pluie", icon: "🌧️" };
  if (code >= 71 && code <= 77) return { description: "Neige", icon: "❄️" };
  if (code >= 80 && code <= 82) return { description: "Averses", icon: "🌧️" };
  if (code >= 85 && code <= 86) return { description: "Averses de neige", icon: "🌨️" };
  if (code >= 95) return { description: "Orage", icon: "⛈️" };
  return { description: "Conditions variables", icon: "🌡️" };
}

export async function getChicoutimiWeather(): Promise<ChicoutimiWeather | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(CHICOUTIMI_LAT));
  url.searchParams.set("longitude", String(CHICOUTIMI_LON));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
  );
  url.searchParams.set("timezone", "America/Toronto");

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const current = data?.current;
    if (!current) return null;

    const { description, icon } = weatherFromCode(current.weather_code ?? -1);

    return {
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      description,
      icon,
      fetchedAt: current.time ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
