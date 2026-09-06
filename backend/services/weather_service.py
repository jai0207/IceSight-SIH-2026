import requests

BASE_URL = "https://api.open-meteo.com/v1/forecast"


def fetch_weather(latitude: float, longitude: float):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": [
            "temperature_2m",
            "wind_speed_10m",
            "visibility"
        ]
    }

    response = requests.get(BASE_URL, params=params, timeout=10)
    response.raise_for_status()

    data = response.json()["current"]

    return {
        "temperature_c": data["temperature_2m"],
        "wind_speed_kmh": data["wind_speed_10m"],
        "visibility_km": round(data["visibility"] / 1000, 2)
    }