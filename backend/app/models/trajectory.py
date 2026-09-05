from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from app.database.database import Base


class Trajectory(Base):
    __tablename__ = "trajectories"

    id = Column(Integer, primary_key=True)
    iceberg_id = Column(String(20))
    prediction_hours = Column(Integer)
    path = Column(JSONB)
    