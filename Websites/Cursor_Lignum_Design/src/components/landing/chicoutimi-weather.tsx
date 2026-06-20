import { getChicoutimiWeather } from "@/lib/weather";

export async function ChicoutimiWeather() {
  try {
    const w = await getChicoutimiWeather();
    const temp = Math.round(w.temperatureC);
    const wind = Math.round(w.windKmh);
    const observed = new Date(w.observedAt).toLocaleString("fr-CA", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return (
      <section className="border-b border-border/60 bg-background/60 pt-16">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
                Météo locale
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight">
                Chicoutimi
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-border bg-surface px-4 py-2">
                {w.summaryFr}
              </span>
              <span className="rounded-full border border-border bg-surface px-4 py-2">
                {temp}°C
              </span>
              <span className="rounded-full border border-border bg-surface px-4 py-2">
                Vent {wind} km/h
              </span>
              <span className="text-xs text-muted">Mis à jour: {observed}</span>
            </div>
          </div>
        </div>
      </section>
    );
  } catch {
    // Fail-safe: landing page should never 500 because weather API is down.
    return (
      <section className="border-b border-border/60 bg-background/60 pt-16">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
                Météo locale
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight">
                Chicoutimi
              </h2>
            </div>
            <p className="text-sm text-muted">
              Météo temporairement indisponible.
            </p>
          </div>
        </div>
      </section>
    );
  }
}

