from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.weather import Weather
from services.weather_service import fetch_weather

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/weather")
def get_weather(lat: float, lon: float, db: Session = Depends(get_db)):
    data = fetch_weather(lat, lon)

    weather = Weather(
        latitude=lat,
        longitude=lon,
        temperature_c=data["temperature_c"],
        wind_speed_kmh=data["wind_speed_kmh"],
        visibility_km=data["visibility_km"],
        ocean_current_kmh=0,
        wave_height_m=0,
    )

    db.add(weather)
    db.commit()
    db.refresh(weather)

    return data