import { jsonError, jsonOk } from "@/lib/api";
import { fetchWeatherSnapshot } from "@/lib/open-meteo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number.parseFloat(searchParams.get("latitude") ?? "");
  const lon = Number.parseFloat(searchParams.get("longitude") ?? "");
  const label = searchParams.get("label")?.trim() || "Your location";

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return jsonError("latitude and longitude are required");
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return jsonError("Invalid coordinates");
  }

  const weather = await fetchWeatherSnapshot(lat, lon, label);

  if (!weather) {
    return jsonError("Could not load weather data", 502);
  }

  return jsonOk({ weather });
}
