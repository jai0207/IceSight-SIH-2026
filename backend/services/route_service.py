from services.weather_service import fetch_weather
from services.sea_ice_service import fetch_sea_ice
from services.iceberg_service import fetch_iceberg_conditions
from services.risk_service import calculate_risk


def recommend_route(origin_lat, origin_lon, dest_lat, dest_lon):
    weather = fetch_weather(dest_lat, dest_lon)
    sea_ice = fetch_sea_ice(dest_lat, dest_lon)
    iceberg = fetch_iceberg_conditions(dest_lat, dest_lon)

    risk = calculate_risk(weather, sea_ice)

    recommendation = "SAFE"

    if risk["risk_level"] == "High" or iceberg["iceberg_probability"] >= 70:
        recommendation = "AVOID ROUTE"
    elif risk["risk_level"] == "Moderate":
        recommendation = "PROCEED WITH CAUTION"

    return {
        "origin": {
            "lat": origin_lat,
            "lon": origin_lon
        },
        "destination": {
            "lat": dest_lat,
            "lon": dest_lon
        },
        "risk": risk,
        "iceberg": iceberg,
        "recommendation": recommendation
    }