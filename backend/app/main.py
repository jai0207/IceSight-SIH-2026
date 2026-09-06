from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine
from app.routes import iceberg, sea_ice, navigation, weather
from app.models import (
    weather as weather_model,
    iceberg as iceberg_model,
    sea_ice as sea_ice_model,
    trajectory as trajectory_model,
    route_recommendation as route_model,
)
from app.routes import iceberg, sea_ice, navigation, weather, risk
from app.routes import iceberg, sea_ice, navigation, weather, risk, ai
Base.metadata.create_all(bind=engine)



app = FastAPI(
    title="Antarctic Navigation Decision Support API",
    description="Backend APIs for iceberg, sea-ice and navigation data",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(iceberg.router)
app.include_router(sea_ice.router)
app.include_router(navigation.router)
app.include_router(weather.router)
app.include_router(risk.router)
app.include_router(ai.router)


@app.get("/")
def home():
    return {"message": "Antarctic Navigation Backend is running!"}


@app.get("/health")
def health():
    return {"status": "healthy"}