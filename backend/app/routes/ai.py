from fastapi import APIRouter

from services.ai_service import generate_navigation_prediction

router = APIRouter()


@router.get("/ai/predict")
def ai_prediction(lat: float, lon: float):
    return generate_navigation_prediction(lat, lon)