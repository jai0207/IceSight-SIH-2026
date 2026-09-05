from sqlalchemy import Column, Integer, Float, DateTime
from app.database.database import Base


class Weather(Base):
    __tablename__ = "weather"

    id = Column(Integer, primary_key=True)
    temperature_c = Column(Float)
    wind_speed_kmh = Column(Float)
    visibility_km = Column(Float)
    ocean_current_kmh = Column(Float)
    wave_height_m = Column(Float)
    updated_at = Column(DateTime)
    