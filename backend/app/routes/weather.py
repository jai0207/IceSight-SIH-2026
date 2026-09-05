from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.weather import Weather

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/weather")
def get_weather(db: Session = Depends(get_db)):

    weather = db.query(Weather).order_by(
        Weather.updated_at.desc()
    ).first()

    if not weather:
        return {
            "message": "Weather data not found"
        }

    return {
        "temperature_c": weather.temperature_c,
        "wind_speed_kmh": weather.wind_speed_kmh,
        "visibility_km": weather.visibility_km,
        "ocean_current_kmh": weather.ocean_current_kmh,
        "wave_height_m": weather.wave_height_m,
        "updated_at": weather.updated_at
    }