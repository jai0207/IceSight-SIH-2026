import requests

BASE_URL = "https://marine-api.open-meteo.com/v1/marine"


def fetch_sea_ice(latitude: float, longitude: float):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": [
            "wave_height",
            "ocean_current_velocity",
            "ocean_current_direction"
        ]
    }

    response = requests.get(BASE_URL, params=params, timeout=10)
    response.raise_for_status()

    current = response.json()["current"]

    return {
        "wave_height_m": current.get("wave_height"),
        "ocean_current_kmh": round((current.get("ocean_current_velocity") or 0) * 3.6, 2),
        "ocean_current_direction": current.get("ocean_current_direction")
    }