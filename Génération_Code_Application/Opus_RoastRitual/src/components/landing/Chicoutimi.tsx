import { ChicoutimiWeatherCard } from "@/components/landing/ChicoutimiWeatherCard";
import { siteConfig } from "@/config/site";
import { getChicoutimiWeather } from "@/lib/weather";

const { location } = siteConfig;

export async function Chicoutimi() {
  const weather = await getChicoutimiWeather();
  const coordinateLabel = `${location.coordinates.lat.toFixed(2)}° N · ${Math.abs(location.coordinates.lng).toFixed(2)}° W`;

  return (
    <section
      id="chicoutimi"
      className="scroll-mt-20 bg-gradient-to-br from-espresso via-espresso-light to-sage-dark px-6 py-20 text-cream"
      aria-labelledby="chicoutimi-heading"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-cream/70">
            Rooted in the Saguenay
          </p>
          <h2
            id="chicoutimi-heading"
            className="mt-4 font-display text-4xl leading-tight md:text-5xl"
          >
            {location.city}
          </h2>
          <p className="mt-2 text-lg text-cream/85">
            {location.region}, {location.province}, {location.country}
          </p>
          <p className="mt-6 max-w-lg leading-relaxed text-cream/80">
            RoastRitual is proud to call Chicoutimi home. From our small-batch
            roastery to your morning cup, we bring global specialty coffee and
            herbal tea traditions to the heart of the Saguenay — with the warmth
            and craft of our local community.
          </p>
          <ChicoutimiWeatherCard weather={weather} />

          <dl className="mt-6 flex flex-wrap gap-6 text-sm">
            <div>
              <dt className="text-cream/60">Coordinates</dt>
              <dd className="mt-1 font-mono text-cream">{coordinateLabel}</dd>
            </div>
            <div>
              <dt className="text-cream/60">Timezone</dt>
              <dd className="mt-1 text-cream">Eastern (ET)</dd>
            </div>
          </dl>
          <a
            href={location.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-cream/30 bg-cream/10 px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-cream/20"
          >
            View on map
            <span aria-hidden>↗</span>
          </a>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            className="aspect-square overflow-hidden rounded-3xl border border-cream/20 bg-cream/5 shadow-2xl shadow-black/20"
            role="img"
            aria-label={`Stylized map highlighting ${location.city}, ${location.region}`}
          >
            <div className="relative flex h-full flex-col items-center justify-center p-8">
              <div
                className="absolute inset-0 opacity-30"
                aria-hidden
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(250,246,240,0.08) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(250,246,240,0.08) 1px, transparent 1px)
                  `,
                  backgroundSize: "32px 32px",
                }}
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-transparent to-transparent"
                aria-hidden
              />

              <svg
                viewBox="0 0 200 200"
                className="relative h-full w-full text-cream/20"
                aria-hidden
              >
                <ellipse
                  cx="100"
                  cy="105"
                  rx="72"
                  ry="58"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <path
                  d="M 40 95 Q 70 60 100 75 T 160 90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.75"
                />
                <path
                  d="M 55 120 Q 100 140 145 115"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.75"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-dark shadow-lg ring-4 ring-cream/30">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7 text-cream"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                    </svg>
                  </span>
                  <p className="mt-4 font-display text-2xl text-cream">
                    {location.city}
                  </p>
                  <p className="text-sm text-cream/70">{location.region}</p>
                </div>
              </div>
            </div>
          </div>

          {weather && (
            <div className="absolute -bottom-4 -right-4 rounded-2xl border border-cream/20 bg-sage-dark px-4 py-3 shadow-lg lg:-right-6">
              <p className="text-xs font-medium uppercase tracking-wider text-cream/80">
                Météo
              </p>
              <p className="text-2xl font-display text-cream">
                {weather.temperatureC}°C
              </p>
              <p className="text-xs text-cream/70 line-clamp-1">
                {weather.condition}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
