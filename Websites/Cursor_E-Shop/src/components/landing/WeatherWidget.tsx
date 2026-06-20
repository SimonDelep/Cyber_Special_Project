import type { ChicoutimiWeather } from "@/lib/weather";

interface WeatherWidgetProps {
  weather: ChicoutimiWeather | null;
}

function formatObservedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  return (
    <section className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cyan-400">Local conditions</p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-50 sm:text-2xl">
                Weather in Chicoutimi, QC
              </h2>
            </div>
            {weather ? (
              <p className="text-xs text-zinc-500">
                Updated {formatObservedAt(weather.observedAt)}
              </p>
            ) : null}
          </div>

          {weather ? (
            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <p className="text-5xl font-bold tracking-tight text-zinc-50 sm:text-6xl">
                  {Math.round(weather.temperatureC)}°
                  <span className="text-2xl font-semibold text-zinc-400 sm:text-3xl">C</span>
                </p>
                <p className="pb-2 text-lg text-zinc-300">{weather.condition}</p>
              </div>

              <dl className="flex flex-wrap gap-6 text-sm">
                <div>
                  <dt className="text-zinc-500">Humidity</dt>
                  <dd className="mt-0.5 font-medium text-zinc-200">
                    {Math.round(weather.humidityPercent)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Wind</dt>
                  <dd className="mt-0.5 font-medium text-zinc-200">
                    {Math.round(weather.windSpeedKmh)} km/h
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">
              Weather is temporarily unavailable. Check back shortly.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
