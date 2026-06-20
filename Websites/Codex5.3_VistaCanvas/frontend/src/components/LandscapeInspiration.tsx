import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { InspirationFeed } from "../types/inspiration";

export default function LandscapeInspiration() {
  const [feed, setFeed] = useState<InspirationFeed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getInspiration()
      .then(setFeed)
      .catch(() =>
        setFeed({
          apod: null,
          scenic_weather: [],
          quote: null,
          apod_error: "Unable to reach inspiration service.",
          weather_error: null,
          quote_error: null,
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      id="inspiration"
      className="border-t border-white/5 bg-ink px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.3em] text-fog">
          Live from open APIs
        </p>
        <h2 className="mt-2 font-display text-4xl text-mist">
          Sky & scenery today
        </h2>
        <p className="mt-2 max-w-2xl text-mist/60">
          VistaCanvas draws mood from real skies and iconic landscapes — powered
          by{" "}
          <a
            href="https://api.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            NASA APOD
          </a>{" "}
          and{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            Open-Meteo
          </a>
          ,{" "}
          <a
            href="https://picsum.photos/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            Lorem Picsum
          </a>
          , and{" "}
          <a
            href="https://zenquotes.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            ZenQuotes
          </a>
          .
        </p>

        {feed?.quote && (
          <blockquote className="mt-8 rounded-sm border border-gold/20 bg-gold/5 px-6 py-5">
            <p className="font-display text-lg italic text-mist/90">
              &ldquo;{feed.quote.content}&rdquo;
            </p>
            <footer className="mt-2 text-sm text-mist/50">
              — {feed.quote.author} · {feed.quote.source}
            </footer>
          </blockquote>
        )}

        {loading ? (
          <p className="mt-12 text-center text-mist/50">Loading inspiration…</p>
        ) : (
          <div className="mt-12 grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              {feed?.apod ? (
                <article className="overflow-hidden rounded-sm border border-white/5 bg-deep/50">
                  {feed.apod.image_url && (
                    <a
                      href={feed.apod.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={feed.apod.image_url}
                        alt={feed.apod.title}
                        className="aspect-video w-full object-cover transition hover:opacity-95"
                      />
                    </a>
                  )}
                  <div className="p-6">
                    <span className="text-xs uppercase tracking-wider text-fog">
                      {feed.apod.source}
                      {feed.apod.date ? ` · ${feed.apod.date}` : ""}
                    </span>
                    <h3 className="mt-2 font-display text-2xl text-gold">
                      <a
                        href={feed.apod.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-mist transition"
                      >
                        {feed.apod.title}
                      </a>
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-mist/70">
                      {feed.apod.explanation}
                    </p>
                    {feed.apod.copyright && (
                      <p className="mt-3 text-xs text-mist/40">
                        © {feed.apod.copyright}
                      </p>
                    )}
                  </div>
                </article>
              ) : (
                <p className="rounded-sm border border-white/5 bg-deep/30 p-6 text-sm text-mist/50">
                  {feed?.apod_error ?? "No picture available today."}
                </p>
              )}
            </div>

            <div className="lg:col-span-2">
              <h3 className="font-display text-xl text-mist">
                Weather at scenic spots
              </h3>
              <p className="mt-1 text-sm text-mist/50">
                Conditions where our prints find their mood.
              </p>

              {feed?.scenic_weather && feed.scenic_weather.length > 0 ? (
                <ul className="mt-6 space-y-4">
                  {feed.scenic_weather.map((spot) => (
                    <li
                      key={spot.location}
                      className="rounded-sm border border-white/5 bg-deep/50 p-4"
                    >
                      <p className="font-medium text-gold">{spot.location}</p>
                      <p className="mt-1 text-2xl font-display text-mist">
                        {Math.round(spot.temperature_c)}°C
                      </p>
                      <p className="mt-1 text-sm text-mist/60">
                        {spot.weather_label}
                      </p>
                      <p className="mt-1 text-xs text-mist/40">
                        Wind {Math.round(spot.wind_speed_kmh)} km/h
                        {spot.sunrise && spot.sunset && (
                          <>
                            {" "}
                            · Golden hour {spot.sunrise} – {spot.sunset}
                          </>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 text-sm text-mist/50">
                  {feed?.weather_error ?? "Weather data unavailable."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
