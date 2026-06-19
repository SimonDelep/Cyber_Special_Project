from typing import Optional

from pydantic import BaseModel


class GrowingConditionsRead(BaseModel):
    location_label: str
    temperature_c: float
    humidity_percent: int
    daylight_hours: float
    sunrise: str
    sunset: str
    source: str = "Open-Meteo"


class HerbSpotlightRead(BaseModel):
    name: str
    summary: str
    image_url: Optional[str]
    wikipedia_url: Optional[str]
    source: str = "Wikipedia"


class GardenInsightsRead(BaseModel):
    growing_conditions: GrowingConditionsRead
    herb_spotlight: HerbSpotlightRead
