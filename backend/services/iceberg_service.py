import requests

BASE_URL = "https://marine-api.open-meteo.com/v1/marine"


def fetch_iceberg_conditions(latitude: float, longitude: float):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ["wave_height", "ocean_current_velocity"]
    }

    response = requests.get(BASE_URL, params=params, timeout=10)
    response.raise_for_status()

    current = response.json()["current"]

    wave = current.get("wave_height") or 0
    current_speed = (current.get("ocean_current_velocity") or 0) * 3.6

    probability = 50

    if wave > 3:
        probability += 20
    elif wave > 1.5:
        probability += 10

    if current_speed > 4:
        probability += 20
    elif current_speed > 2:
        probability += 10

    probability = min(probability, 100)

    return {
        "wave_height_m": wave,
        "ocean_current_kmh": round(current_speed, 2),
        "iceberg_probability": probability
    }