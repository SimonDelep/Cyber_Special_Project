import { fetchChicoutimiWeather } from "@/lib/weather/chicoutimi";

export async function ChicoutimiWeather() {
  const weather = await fetchChicoutimiWeather();

  if (!weather) {
    return (
      <section
        aria-label="Météo à Chicoutimi"
        className="border-b border-sage-200/40 bg-sage-50/60"
      >
        <div className="mx-auto max-w-6xl px-6 py-4">
          <p className="text-sm text-sage-600">
            Météo à Chicoutimi — données temporairement indisponibles.
          </p>
        </div>
      </section>
    );
  }

  const observed = new Date(weather.observedAt).toLocaleString("fr-CA", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "2-digit",
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <section
      aria-label="Météo à Chicoutimi"
      className="border-b border-sage-200/40 bg-gradient-to-r from-sage-50/80 via-cream-50 to-sage-100/50"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="text-4xl" aria-hidden>
            {weather.icon}
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-sage-500">
              Météo à Chicoutimi
            </p>
            <p className="font-display text-3xl font-semibold text-sage-900">
              {weather.temperatureC}°C
              <span className="ml-2 text-lg font-normal text-sage-600">{weather.condition}</span>
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-sage-700">
          <div>
            <dt className="inline text-sage-500">Ressenti&nbsp;</dt>
            <dd className="inline font-medium text-sage-900">{weather.feelsLikeC}°C</dd>
          </div>
          <div>
            <dt className="inline text-sage-500">Humidité&nbsp;</dt>
            <dd className="inline font-medium text-sage-900">{weather.humidityPercent}%</dd>
          </div>
          <div>
            <dt className="inline text-sage-500">Vent&nbsp;</dt>
            <dd className="inline font-medium text-sage-900">{weather.windKmh} km/h</dd>
          </div>
        </dl>

        <p className="text-xs text-sage-500">Mis à jour {observed}</p>
      </div>
    </section>
  );
}
