from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.dialects.postgresql import JSONB
from app.database.database import Base


class RouteRecommendation(Base):
    __tablename__ = "route_recommendations"

    id = Column(Integer, primary_key=True)
    ship = Column(String(100))
    origin_lat = Column(Float)
    origin_lng = Column(Float)
    destination_lat = Column(Float)
    destination_lng = Column(Float)
    status = Column(String(50))
    time_saved_hours = Column(Float)
    fuel_saving_percent = Column(Float)
    risk_score = Column(Float)
    route = Column(JSONB)
    