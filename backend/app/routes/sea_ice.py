from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.sea_ice import SeaIce

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/sea-ice")
def get_sea_ice(db: Session = Depends(get_db)):

    sea_ice = db.query(SeaIce).first()

    if not sea_ice:
        return {
            "message": "Sea-ice data not found"
        }

    return {
        "region": sea_ice.region,
        "coverage_percent": sea_ice.coverage_percent,
        "change_percent": sea_ice.change_percent,
        "fractures_detected": sea_ice.fractures_detected,
        "confidence": sea_ice.confidence,

        "grid": []
    }