import { useEffect, useState } from "react";
import { fetchChicoutimiWeather, type ChicoutimiWeather } from "../api/weather";
import { weatherIcon, weatherLabel } from "../utils/weatherCodes";

function formatObservedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-CA", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Toronto",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function ChicoutimiWeatherCard() {
  const [weather, setWeather] = useState<ChicoutimiWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchChicoutimiWeather()
      .then((data) => {
        if (!cancelled) setWeather(data);
      })
      .catch(() => {
        if (!cancelled) setError("La météo n'est pas disponible pour le moment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside
      className="rounded-2xl border border-aura-200/80 bg-white/70 p-6 shadow-lg shadow-aura-950/5 backdrop-blur-md sm:p-8"
      aria-label="Météo à Chicoutimi"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-aura-600">Météo</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-aura-950">Chicoutimi</h2>
          <p className="mt-0.5 text-sm text-aura-600">Saguenay, Québec</p>
        </div>
        {!loading && !error && weather && (
          <span className="text-4xl" aria-hidden>
            {weatherIcon(weather.weatherCode)}
          </span>
        )}
      </div>

      {loading && (
        <div className="mt-6 space-y-3" aria-live="polite">
          <div className="h-10 w-24 animate-pulse rounded-lg bg-aura-200" />
          <div className="h-4 w-full animate-pulse rounded bg-aura-200/80" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-aura-200/80" />
        </div>
      )}

      {error && (
        <p className="mt-6 text-sm text-aura-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && weather && (
        <div className="mt-6">
          <p className="font-display text-5xl font-semibold tabular-nums text-aura-950">
            {Math.round(weather.temperature)}
            <span className="text-3xl text-aura-600">°C</span>
          </p>
          <p className="mt-2 text-sm font-medium text-aura-800">
            {weatherLabel(weather.weatherCode)}
          </p>
          <p className="mt-1 text-xs text-aura-500">
            Ressenti {Math.round(weather.apparentTemperature)} °C
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-aura-200 pt-5 text-sm">
            <div>
              <dt className="text-aura-500">Humidité</dt>
              <dd className="font-semibold text-aura-900">{weather.humidity} %</dd>
            </div>
            <div>
              <dt className="text-aura-500">Vent</dt>
              <dd className="font-semibold text-aura-900">{Math.round(weather.windSpeed)} km/h</dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-aura-500">
            Mis à jour {formatObservedAt(weather.observedAt)}
          </p>
        </div>
      )}
    </aside>
  );
}
