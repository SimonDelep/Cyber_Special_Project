from datetime import datetime

import httpx
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.external import (
    GardenInsightsRead,
    GrowingConditionsRead,
    HerbSpotlightRead,
)

router = APIRouter(prefix="/external", tags=["external"])

HERBS = ["Basil", "Mint", "Thyme", "Rosemary", "Parsley", "Chives", "Cilantro", "Oregano"]
WIKI_USER_AGENT = "SproutSoil/1.0 (https://sproutsoil.local; indoor gardening project)"

LOCATIONS = {
    "montreal": {"label": "Montreal, QC", "lat": 45.5017, "lon": -73.5673},
    "quebec": {"label": "Quebec City, QC", "lat": 46.8139, "lon": -71.2080},
    "toronto": {"label": "Toronto, ON", "lat": 43.6532, "lon": -79.3832},
}


async def _fetch_growing_conditions(lat: float, lon: float, label: str) -> GrowingConditionsRead:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m",
                "daily": "sunrise,sunset,daylight_duration",
                "timezone": "auto",
                "forecast_days": 1,
            },
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not fetch weather data from Open-Meteo",
            )
        data = response.json()

    current = data["current"]
    daily = data["daily"]
    daylight_seconds = daily["daylight_duration"][0]
    daylight_hours = round(daylight_seconds / 3600, 1)

    sunrise = daily["sunrise"][0].split("T")[1][:5]
    sunset = daily["sunset"][0].split("T")[1][:5]

    return GrowingConditionsRead(
        location_label=label,
        temperature_c=current["temperature_2m"],
        humidity_percent=current["relative_humidity_2m"],
        daylight_hours=daylight_hours,
        sunrise=sunrise,
        sunset=sunset,
    )


async def _fetch_herb_spotlight() -> HerbSpotlightRead:
    herb = HERBS[datetime.now().timetuple().tm_yday % len(HERBS)]

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            f"https://en.wikipedia.org/api/rest_v1/page/summary/{herb}",
            headers={"User-Agent": WIKI_USER_AGENT},
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not fetch herb data from Wikipedia",
            )
        data = response.json()

    thumbnail = data.get("thumbnail", {})
    content_urls = data.get("content_urls", {}).get("desktop", {})

    return HerbSpotlightRead(
        name=data.get("title", herb),
        summary=data.get("extract", ""),
        image_url=thumbnail.get("source"),
        wikipedia_url=content_urls.get("page"),
    )


@router.get("/garden-insights", response_model=GardenInsightsRead)
async def garden_insights(
    location: str = Query(default="montreal", pattern="^(montreal|quebec|toronto)$"),
):
    loc = LOCATIONS[location]
    try:
        growing = await _fetch_growing_conditions(loc["lat"], loc["lon"], loc["label"])
        herb = await _fetch_herb_spotlight()
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="External API unavailable",
        ) from None

    return GardenInsightsRead(growing_conditions=growing, herb_spotlight=herb)
