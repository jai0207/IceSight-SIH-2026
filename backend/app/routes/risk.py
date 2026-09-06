from fastapi import APIRouter

from services.weather_service import fetch_weather
from services.sea_ice_service import fetch_sea_ice
from services.risk_service import calculate_risk

router = APIRouter()


@router.get("/risk")
def get_risk(lat: float, lon: float):
    weather = fetch_weather(lat, lon)
    sea_ice = fetch_sea_ice(lat, lon)
    risk = calculate_risk(weather, sea_ice)

    return {
        "location": {
            "latitude": lat,
            "longitude": lon
        },
        "weather": weather,
        "sea_ice": sea_ice,
        "risk": risk
    }