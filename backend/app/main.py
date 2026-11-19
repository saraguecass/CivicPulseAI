from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routes import zonas, calles, estacionamientos
from app.scheduler import start_scheduler, stop_scheduler
from app.etl.mock_madrid_data import seed_database_if_empty

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización de tablas y datos semilla
    print("[Startup] Inicializando tablas de base de datos...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()

    # Inicio de cron para avisos de estacionamiento
    start_scheduler()

    yield

    # Limpieza
    stop_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API de CivicPulseAI para visualización del SER de Madrid, búsqueda de plazas y avisos de estacionamiento.",
    lifespan=lifespan
)

# CORS para comunicación fluida con el frontend (React / Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión de routers con prefijo /api
app.include_router(zonas.router, prefix=settings.API_V1_STR)
app.include_router(calles.router, prefix=settings.API_V1_STR)
app.include_router(estacionamientos.router, prefix=settings.API_V1_STR)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs": "/docs",
        "endpoints": {
            "zonas": "/api/zonas",
            "buscar_calles": "/api/calles/buscar?q=serrano",
            "estacionamientos": "/api/estacionamientos"
        }
    }
