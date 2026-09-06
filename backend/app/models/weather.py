from sqlalchemy import Column, Integer, Float, DateTime
from app.database.database import Base
from datetime import datetime


class Weather(Base):
    __tablename__ = "weather"

    id = Column(Integer, primary_key=True)
    latitude = Column(Float)
    longitude = Column(Float)
    temperature_c = Column(Float)
    wind_speed_kmh = Column(Float)
    visibility_km = Column(Float)
    ocean_current_kmh = Column(Float, default=0)
    wave_height_m = Column(Float, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow)