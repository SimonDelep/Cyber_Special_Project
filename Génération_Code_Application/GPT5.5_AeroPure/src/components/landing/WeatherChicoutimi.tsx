import { getChicoutimiWeather } from "@/lib/weather/chicoutimi";

export async function WeatherChicoutimi() {
  let weather = null;
  try {
    weather = await getChicoutimiWeather();
  } catch {
    weather = null;
  }

  if (!weather) {
    return (
      <aside
        className="w-full max-w-sm rounded-2xl border border-border bg-surface/80 p-5 text-center backdrop-blur-sm"
        aria-label="Météo Chicoutimi"
      >
        <p className="text-sm font-medium">Météo — Chicoutimi</p>
        <p className="mt-2 text-sm text-muted">Données indisponibles</p>
      </aside>
    );
  }

  const updatedTime = new Date(weather.fetchedAt).toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Toronto",
  });

  return (
    <aside
      className="w-full max-w-sm rounded-2xl border border-border bg-surface/90 p-5 shadow-sm backdrop-blur-sm"
      aria-label="Météo Chicoutimi"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Météo locale
          </p>
          <p className="font-semibold">Chicoutimi, QC</p>
        </div>
        <span className="text-4xl" role="img" aria-hidden>
          {weather.icon}
        </span>
      </div>

      <p className="mt-4 text-4xl font-bold tracking-tight">
        {weather.temperature}°C
      </p>
      <p className="mt-1 text-sm text-muted">{weather.description}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
        <div>
          <dt className="text-muted">Humidité</dt>
          <dd className="font-medium">{weather.humidity}%</dd>
        </div>
        <div>
          <dt className="text-muted">Vent</dt>
          <dd className="font-medium">{weather.windSpeed} km/h</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-muted">Mis à jour à {updatedTime}</p>
    </aside>
  );
}
