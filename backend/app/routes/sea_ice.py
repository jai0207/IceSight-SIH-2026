from fastapi import APIRouter

from services.sea_ice_service import fetch_sea_ice

router = APIRouter()


@router.get("/sea-ice")
def get_sea_ice(lat: float, lon: float):
    return fetch_sea_ice(lat, lon)