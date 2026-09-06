from sqlalchemy import Column, Integer, Float, String
from app.database.database import Base


class SeaIce(Base):
    __tablename__ = "sea_ice"

    id = Column(Integer, primary_key=True)
    region = Column(String(100))
    coverage_percent = Column(Float)
    change_percent = Column(Float)
    fractures_detected = Column(Integer)
    confidence = Column(Float)
    