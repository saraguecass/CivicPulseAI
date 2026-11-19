import os
from pydantic_settings import BaseSettings
from typing import Optional

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEFAULT_DB_PATH = os.path.join(BACKEND_DIR, "civicpulse.db").replace("\\", "/")
DEFAULT_DB_URL = f"sqlite:///{DEFAULT_DB_PATH}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicPulseAI - SER Madrid"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database (usa ruta absoluta para civicpulse.db si no se define DATABASE_URL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", DEFAULT_DB_URL)
    
    # Web Push / VAPID (para notificaciones de aviso 30 min)
    VAPID_PUBLIC_KEY: Optional[str] = os.getenv("VAPID_PUBLIC_KEY", "")
    VAPID_PRIVATE_KEY: Optional[str] = os.getenv("VAPID_PRIVATE_KEY", "")
    VAPID_CLAIM_EMAIL: str = os.getenv("VAPID_CLAIM_EMAIL", "mailto:soporte@civicpulse.madrid")

    # APIs de Rutas y Geocodificación OSM / OSRM / Nominatim / Photon
    OSRM_BASE_URL: str = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")
    NOMINATIM_BASE_URL: str = os.getenv("NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org")
    PHOTON_BASE_URL: str = os.getenv("PHOTON_BASE_URL", "https://photon.komoot.io")
    GEOLOCATION_USER_AGENT: str = os.getenv(
        "GEOLOCATION_USER_AGENT",
        "CivicPulseAI-SER-Madrid/1.0 (Hackathon Madrid; soporte@civicpulse.madrid)"
    )
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
