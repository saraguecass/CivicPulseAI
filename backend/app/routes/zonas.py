from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import GeoJSONFeatureCollection
from app.services.ser_service import get_zonas_geojson

router = APIRouter(prefix="/zonas", tags=["Zonas SER"])

@router.get("", response_model=GeoJSONFeatureCollection)
def get_zonas(
    color: Optional[str] = Query(None, description="Filtro por color: 'VERDE' o 'AZUL'"),
    distrito: Optional[str] = Query(None, description="Filtro por nombre de distrito (ej: 'Salamanca')"),
    bbox: Optional[str] = Query(None, description="Bounding box 'min_lng,min_lat,max_lng,max_lat'"),
    db: Session = Depends(get_db)
):
    """
    Retorna la geometría de los tramos SER en formato GeoJSON FeatureCollection
    con propiedades de color, plazas y distrito para renderizar directamente en MapLibre GL JS.
    """
    return get_zonas_geojson(db=db, color=color, distrito=distrito, bbox=bbox)
