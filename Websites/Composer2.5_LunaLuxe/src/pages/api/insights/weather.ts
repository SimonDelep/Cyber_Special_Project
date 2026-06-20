import type { APIRoute } from 'astro';
import { fetchSleepWeather } from '@/lib/api/open-meteo';
import { jsonResponse } from '@/lib/auth/response';

export const prerender = false;

/** Public JSON endpoint — proxies Open-Meteo sleep weather data. */
export const GET: APIRoute = async () => {
  const weather = await fetchSleepWeather();

  if (!weather) {
    return jsonResponse({ error: 'Weather data unavailable' }, 503);
  }

  return jsonResponse(weather);
};
