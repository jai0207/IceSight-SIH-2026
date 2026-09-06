from sqlalchemy import Column, String, Float, DateTime
from app.database.database import Base


class Iceberg(Base):
    __tablename__ = "icebergs"

    id = Column(String(20), primary_key=True)
    name = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    risk = Column(String(20))
    drift_speed = Column(Float)
    size = Column(Float)
    distance_km = Column(Float)
    status = Column(String(20))
    last_updated = Column(DateTime)
    