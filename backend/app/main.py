from fastapi import FastAPI
from app.routes import iceberg, sea_ice, navigation, weather
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/")
def home():
    return {"message": "Antarctic Navigation Backend is running!"}


@app.get("/health")
def health():
    return {"status": "healthy"}