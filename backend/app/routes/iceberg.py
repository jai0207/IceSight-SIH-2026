from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.iceberg import Iceberg

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# GET all icebergs
@router.get("/icebergs")
def get_icebergs(db: Session = Depends(get_db)):

    icebergs = db.query(Iceberg).all()

    return {
        "count": len(icebergs),
        "icebergs": [
            {
                "id": iceberg.id,
                "name": iceberg.name,
                "latitude": iceberg.latitude,
                "longitude": iceberg.longitude,
                "risk": iceberg.risk,
                "drift_speed": iceberg.drift_speed,
                "size": iceberg.size,
                "distance_km": iceberg.distance_km
            }
            for iceberg in icebergs
        ]
    }


# GET one iceberg
@router.get("/icebergs/{iceberg_id}")
def get_iceberg(iceberg_id: str, db: Session = Depends(get_db)):

    iceberg = db.query(Iceberg).filter(
        Iceberg.id == iceberg_id
    ).first()

    if not iceberg:
        raise HTTPException(
            status_code=404,
            detail="Iceberg not found"
        )

    return {
        "id": iceberg.id,
        "name": iceberg.name,
        "latitude": iceberg.latitude,
        "longitude": iceberg.longitude,
        "risk": iceberg.risk,
        "drift_speed": iceberg.drift_speed,
        "size": iceberg.size,
        "distance_km": iceberg.distance_km,
        "status": iceberg.status,
        "last_updated": iceberg.last_updated
    }