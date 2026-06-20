import { useEffect, useState } from "react";
import { externalApi } from "../api/client";

const LOCATIONS = [
  { value: "montreal", label: "Montreal" },
  { value: "quebec", label: "Quebec City" },
  { value: "toronto", label: "Toronto" },
];

export default function GardenInsights() {
  const [location, setLocation] = useState("montreal");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    externalApi
      .gardenInsights(location)
      .then(setData)
      .catch((err) => {
        setError(err.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [location]);

  return (
    <section id="garden-insights" className="py-24 bg-soil-100/50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-sprout-600">
              Live from external APIs
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-soil-950">
              Garden insights
            </h2>
            <p className="mt-2 text-soil-600 max-w-xl">
              Real-time outdoor growing conditions and a daily herb spotlight — powered by
              Open-Meteo and Wikipedia.
            </p>
          </div>

          <div>
            <label htmlFor="insight-location" className="block text-xs font-medium text-soil-600 mb-1">
              Location
            </label>
            <select
              id="insight-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-lg border border-soil-200 bg-white px-3 py-2 text-sm"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 animate-pulse rounded-2xl bg-soil-200/60" />
            <div className="h-64 animate-pulse rounded-2xl bg-soil-200/60" />
          </div>
        )}

        {error && !loading && (
          <p className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}

        {data && !loading && (
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-soil-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-soil-900">
                  Growing conditions
                </h3>
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                  {data.growing_conditions.source}
                </span>
              </div>
              <p className="mt-1 text-sm text-soil-500">
                {data.growing_conditions.location_label}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-soil-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-soil-500">
                    Temperature
                  </p>
                  <p className="mt-1 text-2xl font-bold text-soil-900">
                    {Math.round(data.growing_conditions.temperature_c)}°C
                  </p>
                </div>
                <div className="rounded-xl bg-soil-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-soil-500">
                    Humidity
                  </p>
                  <p className="mt-1 text-2xl font-bold text-soil-900">
                    {data.growing_conditions.humidity_percent}%
                  </p>
                </div>
                <div className="rounded-xl bg-soil-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-soil-500">
                    Daylight
                  </p>
                  <p className="mt-1 text-2xl font-bold text-soil-900">
                    {data.growing_conditions.daylight_hours}h
                  </p>
                </div>
                <div className="rounded-xl bg-soil-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-soil-500">
                    Sun hours
                  </p>
                  <p className="mt-1 text-sm font-semibold text-soil-900">
                    ↑ {data.growing_conditions.sunrise}
                    <br />↓ {data.growing_conditions.sunset}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-soil-500">
                Compare outdoor conditions to your SproutSoil smart garden&apos;s built-in grow lights.
              </p>
            </article>

            <article className="rounded-2xl border border-soil-200 bg-white p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-soil-900">
                  Herb spotlight
                </h3>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  {data.herb_spotlight.source}
                </span>
              </div>
              <p className="mt-1 text-sm text-soil-500">Changes daily</p>

              <div className="mt-4 flex gap-4 flex-1">
                {data.herb_spotlight.image_url && (
                  <img
                    src={data.herb_spotlight.image_url}
                    alt={data.herb_spotlight.name}
                    className="h-24 w-24 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0">
                  <h4 className="font-display text-xl font-bold text-sprout-700">
                    {data.herb_spotlight.name}
                  </h4>
                  <p className="mt-2 text-sm text-soil-600 leading-relaxed line-clamp-5">
                    {data.herb_spotlight.summary}
                  </p>
                </div>
              </div>

              {data.herb_spotlight.wikipedia_url && (
                <a
                  href={data.herb_spotlight.wikipedia_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-medium text-sprout-600 hover:underline"
                >
                  Read more on Wikipedia →
                </a>
              )}
            </article>
          </div>
        )}
      </div>
    </section>
  );
}
