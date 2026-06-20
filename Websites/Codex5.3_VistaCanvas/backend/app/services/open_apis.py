"""Fetch public data from open APIs (NASA APOD, Open-Meteo, Picsum, ZenQuotes)."""

import random

import httpx

NASA_APOD_URL = "https://api.nasa.gov/planetary/apod"
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
ZENQUOTES_URL = "https://zenquotes.io/api/random"
PICSUM_INFO_URL = "https://picsum.photos/v1/id/{photo_id}"
# Curated Picsum IDs with strong landscape / nature compositions
PICSUM_LANDSCAPE_IDS = [10, 11, 14, 15, 17, 28, 37, 38, 39]

HTTP_HEADERS = {
    "User-Agent": "VistaCanvas/1.0 (landscape art shop; educational demo)",
}

# Iconic landscapes that inspire VistaCanvas collections
SCENIC_LOCATIONS = [
    {"name": "Scottish Highlands", "latitude": 57.12, "longitude": -4.71},
    {"name": "Swiss Alps", "latitude": 46.55, "longitude": 7.98},
    {"name": "Oregon Coast", "latitude": 44.96, "longitude": -124.02},
]

# WMO weather interpretation codes (Open-Meteo)
WEATHER_LABELS: dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    95: "Thunderstorm",
}


def _weather_label(code: int) -> str:
    return WEATHER_LABELS.get(code, "Variable conditions")


def _format_time(iso_value: str | None) -> str | None:
    if not iso_value:
        return None
    try:
        return iso_value.split("T")[1][:5]
    except IndexError:
        return iso_value


async def fetch_nasa_apod() -> dict:
    async with httpx.AsyncClient(timeout=25.0, headers=HTTP_HEADERS) as client:
        response = await client.get(
            NASA_APOD_URL,
            params={"api_key": "DEMO_KEY"},
        )
        response.raise_for_status()
        return response.json()


async def fetch_picsum_landscape() -> dict:
    photo_id = random.choice(PICSUM_LANDSCAPE_IDS)
    async with httpx.AsyncClient(timeout=15.0, headers=HTTP_HEADERS) as client:
        response = await client.get(PICSUM_INFO_URL.format(photo_id=photo_id))
        response.raise_for_status()
        data = response.json()
        author = str(data.get("author", "Picsum photographer"))
        return {
            "title": "Landscape study",
            "explanation": (
                "Open photography from Picsum — a rotating landscape "
                "reference for mood and composition."
            ),
            "image_url": f"https://picsum.photos/id/{photo_id}/1200/800",
            "page_url": data.get("url", f"https://picsum.photos/id/{photo_id}"),
            "date": "",
            "copyright": author,
            "source": "Lorem Picsum",
        }


async def fetch_nature_quote() -> dict:
    async with httpx.AsyncClient(timeout=10.0, headers=HTTP_HEADERS) as client:
        response = await client.get(ZENQUOTES_URL)
        response.raise_for_status()
        rows = response.json()
        if not rows:
            raise ValueError("No quotes returned")
        row = rows[0]
        return {
            "content": str(row.get("q", "")),
            "author": str(row.get("a", "Unknown")),
        }


async def fetch_scenic_weather() -> list[dict]:
    results: list[dict] = []
    async with httpx.AsyncClient(timeout=12.0, headers=HTTP_HEADERS) as client:
        for spot in SCENIC_LOCATIONS:
            response = await client.get(
                OPEN_METEO_URL,
                params={
                    "latitude": spot["latitude"],
                    "longitude": spot["longitude"],
                    "current": "temperature_2m,weather_code,wind_speed_10m",
                    "daily": "sunrise,sunset",
                    "timezone": "auto",
                    "forecast_days": 1,
                },
            )
            response.raise_for_status()
            data = response.json()
            current = data.get("current", {})
            daily = data.get("daily", {})
            sunrise_list = daily.get("sunrise") or []
            sunset_list = daily.get("sunset") or []
            results.append(
                {
                    "location": spot["name"],
                    "temperature_c": float(current.get("temperature_2m", 0)),
                    "weather_label": _weather_label(int(current.get("weather_code", 0))),
                    "wind_speed_kmh": float(current.get("wind_speed_10m", 0)),
                    "sunrise": _format_time(sunrise_list[0] if sunrise_list else None),
                    "sunset": _format_time(sunset_list[0] if sunset_list else None),
                }
            )
    return results
