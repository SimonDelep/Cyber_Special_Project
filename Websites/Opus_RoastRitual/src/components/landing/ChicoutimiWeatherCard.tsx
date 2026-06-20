import type { ChicoutimiWeather } from "@/lib/weather";
import { formatWeatherUpdatedAt } from "@/lib/weather";

type ChicoutimiWeatherCardProps = {
  weather: ChicoutimiWeather | null;
};

export function ChicoutimiWeatherCard({ weather }: ChicoutimiWeatherCardProps) {
  if (!weather) {
    return (
      <div className="mt-8 rounded-2xl border border-cream/20 bg-cream/5 p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-cream/60">
          Météo
        </p>
        <p className="mt-2 text-sm text-cream/70">
          Météo actuelle indisponible. Réessayez plus tard.
        </p>
      </div>
    );
  }

  return (
    <div
      className="mt-8 rounded-2xl border border-cream/20 bg-cream/10 p-6 backdrop-blur-sm"
      aria-live="polite"
    >
      <p className="text-xs font-medium uppercase tracking-widest text-cream/70">
        Météo actuelle · Chicoutimi
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <p className="font-display text-5xl leading-none text-cream">
          {weather.temperatureC}°
          <span className="text-2xl text-cream/80">C</span>
        </p>
        <p className="pb-1 text-lg text-cream/90">{weather.condition}</p>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-cream/60">Ressenti</dt>
          <dd className="mt-0.5 font-medium text-cream">
            {weather.apparentTemperatureC}°C
          </dd>
        </div>
        <div>
          <dt className="text-cream/60">Humidité</dt>
          <dd className="mt-0.5 font-medium text-cream">
            {weather.humidityPercent}%
          </dd>
        </div>
        <div>
          <dt className="text-cream/60">Vent</dt>
          <dd className="mt-0.5 font-medium text-cream">
            {weather.windSpeedKmh} km/h
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-cream/50">
        Mis à jour {formatWeatherUpdatedAt(weather.observedAt)}
      </p>
    </div>
  );
}
