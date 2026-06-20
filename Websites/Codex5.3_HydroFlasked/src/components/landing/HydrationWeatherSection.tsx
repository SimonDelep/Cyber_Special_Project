import { HydrationWeather } from "@/components/landing/HydrationWeather";
import { DEFAULT_WEATHER_LOCATION, fetchWeatherSnapshot } from "@/lib/open-meteo";

export async function HydrationWeatherSection() {
  const initial = await fetchWeatherSnapshot(
    DEFAULT_WEATHER_LOCATION.latitude,
    DEFAULT_WEATHER_LOCATION.longitude,
    DEFAULT_WEATHER_LOCATION.label,
  );

  return <HydrationWeather initial={initial} />;
}
