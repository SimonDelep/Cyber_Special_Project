import { useEffect, useState } from "react";
import {
  fetchChicoutimiWeather,
  formatTemp,
  weatherDescription,
  type ChicoutimiWeather,
} from "../api/weather";

export default function WeatherChicoutimi({ compact = false }: { compact?: boolean }) {
  const [weather, setWeather] = useState<ChicoutimiWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchChicoutimiWeather()
      .then(setWeather)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        className={`animate-pulse rounded-2xl bg-forest-100/80 ${compact ? "h-14" : "h-28"}`}
        aria-hidden
      />
    );
  }

  if (error || !weather) {
    return (
      <p className="rounded-2xl border border-forest-200/80 bg-white/60 px-4 py-3 text-sm text-stone-600">
        Météo Chicoutimi indisponible pour le moment.
      </p>
    );
  }

  const { label, icon } = weatherDescription(weather.weatherCode);

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 rounded-full border border-forest-200/80 bg-white/70 px-4 py-2 text-sm backdrop-blur-sm"
        role="status"
        aria-label={`Météo à Chicoutimi: ${label}, ${formatTemp(weather.temperature)}`}
      >
        <span className="text-xl" aria-hidden>
          {icon}
        </span>
        <span className="font-medium text-forest-800">Chicoutimi</span>
        <span className="text-forest-700">{formatTemp(weather.temperature)}</span>
        <span className="hidden text-stone-500 sm:inline">{label}</span>
      </div>
    );
  }

  return (
    <aside
      className="rounded-2xl border border-forest-200/80 bg-gradient-to-br from-sky-50 to-forest-50/80 p-5 shadow-sm"
      role="region"
      aria-label="Météo à Chicoutimi"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-stone-600">
            Météo locale
          </p>
          <h2 className="font-display mt-1 text-xl font-semibold text-forest-800">
            Chicoutimi, QC
          </h2>
          <p className="mt-1 text-sm text-stone-600">{label}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-5xl" aria-hidden>
            {icon}
          </span>
          <p className="font-display text-4xl font-semibold text-forest-800">
            {formatTemp(weather.temperature)}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-forest-200/60 pt-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-stone-500">Ressenti</dt>
          <dd className="font-medium text-forest-700">{formatTemp(weather.apparentTemperature)}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Min / max</dt>
          <dd className="font-medium text-forest-700">
            {formatTemp(weather.low)} / {formatTemp(weather.high)}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Humidité</dt>
          <dd className="font-medium text-forest-700">{weather.humidity}%</dd>
        </div>
        <div>
          <dt className="text-stone-500">Vent</dt>
          <dd className="font-medium text-forest-700">{Math.round(weather.windSpeed)} km/h</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-stone-500">Données Open-Meteo · fuseau America/Toronto</p>
    </aside>
  );
}
