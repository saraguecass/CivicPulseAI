from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.geocoding_service import search_local_madrid, autocomplete_photon, resolve_location

router = APIRouter(prefix="/geocoding", tags=["Geocodificación y Autocompletado"])

@router.get("/autocomplete")
def geocoding_autocomplete(
    q: str = Query(..., min_length=1, description="Texto de búsqueda para autocompletar"),
    limit: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db)
):
    """
    Autocompletado ultra-rápido para el buscador y planificador de rutas:
    1. Busca en el catálogo de Madrid y calles SER (0 ms).
    2. Enriquece con sugerencias de Photon (OpenStreetMap) si hay conectividad.
    """
    local_items = search_local_madrid(q, db=db, limit=limit)
    if len(local_items) >= limit:
        return local_items

    # Intentar completar con Photon OSM
    remaining = limit - len(local_items)
    photon_items = autocomplete_photon(q, limit=remaining)

    # Combinar evitando duplicados
    seen_labels = {item["label"].lower() for item in local_items}
    combined = list(local_items)

    for item in photon_items:
        if item["label"].lower() not in seen_labels:
            seen_labels.add(item["label"].lower())
            combined.append(item)

    return combined

@router.get("/search")
def geocoding_search(
    q: str = Query(..., min_length=2, description="Texto de búsqueda para resolver coordenadas"),
    db: Session = Depends(get_db)
):
    """
    Resuelve el nombre de un lugar a coordenadas [lng, lat] con Nominatim / Photon / Local.
    """
    lng, lat, display_name = resolve_location(q, db=db)
    return {
        "query": q,
        "lng": lng,
        "lat": lat,
        "display_name": display_name
    }
