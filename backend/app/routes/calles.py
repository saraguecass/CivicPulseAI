from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import StreetSearchResult
from app.services.ser_service import search_streets

router = APIRouter(prefix="/calles", tags=["Búsqueda de Calles"])

@router.get("/buscar", response_model=List[StreetSearchResult])
def buscar_calles(
    q: str = Query(..., min_length=2, description="Texto de búsqueda (nombre de calle)"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Busca calles en Madrid que cuentan con estacionamiento SER.
    Indica si la calle tiene plazas Verdes, Azules o Mixtas, el total de plazas
    y las coordenadas para centrar el mapa.
    """
    return search_streets(db=db, query_str=q, limit=limit)
