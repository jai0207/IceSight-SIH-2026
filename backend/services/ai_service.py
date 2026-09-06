from services.weather_service import fetch_weather
from services.sea_ice_service import fetch_sea_ice
from services.iceberg_service import fetch_iceberg_conditions
from services.risk_service import calculate_risk


def generate_navigation_prediction(lat, lon):
    weather = fetch_weather(lat, lon)
    sea_ice = fetch_sea_ice(lat, lon)
    iceberg = fetch_iceberg_conditions(lat, lon)
    risk = calculate_risk(weather, sea_ice)

    if risk["risk_level"] == "High":
        advice = "Avoid this route. High environmental risk detected."
    elif risk["risk_level"] == "Moderate":
        advice = "Proceed with caution and monitor conditions."
    else:
        advice = "Route appears safe under current conditions."

    return {
        "weather": weather,
        "sea_ice": sea_ice,
        "iceberg": iceberg,
        "risk": risk,
        "ai_prediction": advice
    }