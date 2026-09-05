from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.trajectory import Trajectory
from app.models.route_recommendation import RouteRecommendation

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- TRAJECTORY API ----------

@router.get("/trajectory/{iceberg_id}")
def get_trajectory(iceberg_id: str, db: Session = Depends(get_db)):

    trajectory = db.query(Trajectory).filter(
        Trajectory.iceberg_id == iceberg_id
    ).first()

    if not trajectory:
        return {
            "message": "Trajectory data not found"
        }

    return {
        "iceberg_id": trajectory.iceberg_id,
        "prediction_hours": trajectory.prediction_hours,
        "path": trajectory.path
    }


# ---------- ROUTE RECOMMENDATION API ----------

class Coordinates(BaseModel):
    lat: float
    lng: float


class RouteRequest(BaseModel):
    ship: str
    origin: Coordinates
    destination: Coordinates


@router.post("/route/recommend")
def recommend_route(
    data: RouteRequest,
    db: Session = Depends(get_db)
):

    route_data = db.query(RouteRecommendation).filter(
        RouteRecommendation.ship == data.ship,
        RouteRecommendation.origin_lat == data.origin.lat,
        RouteRecommendation.origin_lng == data.origin.lng,
        RouteRecommendation.destination_lat == data.destination.lat,
        RouteRecommendation.destination_lng == data.destination.lng
    ).first()

    if not route_data:
        raise HTTPException(
            status_code=404,
            detail="Route recommendation not found"
        )

    return {
        "status": route_data.status,
        "fuel_saving_percent": route_data.fuel_saving_percent,
        "time_saved_hours": route_data.time_saved_hours,
        "risk_score": route_data.risk_score,
        "route": route_data.route
    }
