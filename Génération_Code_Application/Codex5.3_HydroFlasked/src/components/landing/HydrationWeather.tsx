"use client";

import { useState } from "react";
import type { WeatherSnapshot } from "@/lib/open-meteo";
import { parseApiResponse } from "@/lib/parse-api-response";

type HydrationWeatherProps = {
  initial: WeatherSnapshot | null;
};

export function HydrationWeather({ initial }: HydrationWeatherProps) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadForCoords(latitude: number, longitude: number, label: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        label,
      });
      const res = await fetch(`/api/weather?${params}`);
      const data = await parseApiResponse(res);

      if (!res.ok) {
        setError((data.error as string) ?? "Weather unavailable");
        return;
      }

      setWeather(data.weather as WeatherSnapshot);
    } catch {
      setError("Could not reach the weather service.");
    } finally {
      setLoading(false);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void loadForCoords(
          pos.coords.latitude,
          pos.coords.longitude,
          "Near you",
        );
      },
      () => {
        setLoading(false);
        setError("Location permission denied. Showing default region instead.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  if (!weather) {
    return (
      <section
        id="hydration-weather"
        className="border-b border-white/10 bg-slate-900/30 py-12"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-slate-500">
            Live weather data is temporarily unavailable.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="hydration-weather"
      className="border-b border-white/10 bg-slate-900/30 py-16 sm:py-20"
      aria-labelledby="hydration-weather-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-400">
              Powered by Open-Meteo
            </p>
            <h2
              id="hydration-weather-heading"
              className="mt-2 text-2xl font-bold text-white sm:text-3xl"
            >
              Hydration & weather
            </h2>
            <p className="mt-3 text-slate-400">
              Real-time conditions help you pick the right HydroFlasked gear — cold
              tumblers on hot days, insulated mugs when the temperature drops.
            </p>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={loading}
              className="mt-6 rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-brand-500/50 hover:text-white disabled:opacity-50"
            >
              {loading ? "Loading…" : "Use my location"}
            </button>
            {error ? <p className="mt-3 text-sm text-amber-400">{error}</p> : null}
          </div>

          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950/80 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{weather.locationLabel}</p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white" aria-hidden>
                    {weather.weatherIcon}
                  </span>
                  <span className="text-4xl font-bold text-white">
                    {weather.temperatureC}°C
                  </span>
                </p>
                <p className="mt-1 text-slate-300">{weather.weatherLabel}</p>
              </div>
              <dl className="text-right text-sm text-slate-400">
                <div>
                  <dt className="inline">Humidity </dt>
                  <dd className="inline font-medium text-slate-200">
                    {weather.humidityPercent}%
                  </dd>
                </div>
              </dl>
            </div>

            <p className="mt-6 rounded-xl border border-brand-500/20 bg-brand-950/40 p-4 text-sm leading-relaxed text-slate-200">
              <span className="font-semibold text-brand-300">Today&apos;s tip: </span>
              {weather.hydrationTip}
            </p>

            <p className="mt-4 text-xs text-slate-600">
              Data from{" "}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 underline hover:text-slate-400"
              >
                Open-Meteo
              </a>
              {" · "}
              Updated {new Date(weather.fetchedAt).toLocaleString("en-CA")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
