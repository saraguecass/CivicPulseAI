import json
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import SERStreetSegment
from app.schemas import (
    GeoJSONFeatureCollection,
    GeoJSONFeature,
    GeoJSONGeometry,
    GeoJSONProperties,
    StreetSearchResult
)

def get_zonas_geojson(
    db: Session,
    color: Optional[str] = None,
    distrito: Optional[str] = None,
    bbox: Optional[str] = None
) -> GeoJSONFeatureCollection:
    """
    Devuelve los tramos de las zonas SER en formato GeoJSON FeatureCollection.
    Permite filtrar por color ('VERDE', 'AZUL'), distrito y bounding box [min_lng, min_lat, max_lng, max_lat].
    """
    query = db.query(SERStreetSegment)

    if color and color.upper() in ["VERDE", "AZUL"]:
        query = query.filter(SERStreetSegment.color == color.upper())

    if distrito:
        query = query.filter(SERStreetSegment.distrito.ilike(f"%{distrito}%"))

    segments = query.all()
    features: List[GeoJSONFeature] = []

    # Parse bounding box si se provee
    bbox_coords = None
    if bbox:
        try:
            parts = [float(x.strip()) for x in bbox.split(",")]
            if len(parts) == 4:
                bbox_coords = parts  # [min_lng, min_lat, max_lng, max_lat]
        except Exception:
            pass

    for seg in segments:
        try:
            coords = json.loads(seg.coordinates_json)
        except Exception:
            continue

        # Filtro de bbox simple en memoria si se especifica
        if bbox_coords:
            min_lng, min_lat, max_lng, max_lat = bbox_coords
            in_bbox = any(
                min_lng <= pt[0] <= max_lng and min_lat <= pt[1] <= max_lat
                for pt in coords
            )
            if not in_bbox:
                continue

        feature = GeoJSONFeature(
            type="Feature",
            geometry=GeoJSONGeometry(
                type="LineString",
                coordinates=coords
            ),
            properties=GeoJSONProperties(
                id=seg.id,
                cod_via=seg.cod_via,
                nombre_calle=seg.nombre_calle,
                color=seg.color,
                tipo_reserva=seg.tipo_reserva,
                num_plazas=seg.num_plazas,
                distrito=seg.distrito,
                barrio=seg.barrio
            )
        )
        features.append(feature)

    return GeoJSONFeatureCollection(type="FeatureCollection", features=features)


def search_streets(db: Session, query_str: str, limit: int = 15) -> List[StreetSearchResult]:
    """
    Búsqueda rápida por nombre de calle.
    Agrupa por calle y distrito, indicando el tipo de estacionamiento (Verde, Azul o Mixto) y conteo de plazas.
    """
    if not query_str or len(query_str.strip()) < 2:
        return []

    clean_q = query_str.strip()
    segments = db.query(SERStreetSegment).filter(
        SERStreetSegment.nombre_calle.ilike(f"%{clean_q}%")
    ).all()

    # Agrupar por nombre_calle
    streets_dict = {}
    for seg in segments:
        key = seg.nombre_calle
        if key not in streets_dict:
            coords = json.loads(seg.coordinates_json)
            # Calcular centro aproximado
            first_pt = coords[0] if coords else [-3.703790, 40.416775]
            streets_dict[key] = {
                "nombre_calle": seg.nombre_calle,
                "distrito": seg.distrito or "Madrid",
                "colores": set(),
                "plazas_verde": 0,
                "plazas_azul": 0,
                "center_coords": first_pt
            }

        color = (seg.color or "VERDE").upper()
        streets_dict[key]["colores"].add(color)
        if color == "VERDE":
            streets_dict[key]["plazas_verde"] += seg.num_plazas
        elif color == "AZUL":
            streets_dict[key]["plazas_azul"] += seg.num_plazas

    results: List[StreetSearchResult] = []
    for info in list(streets_dict.values())[:limit]:
        colores = info["colores"]
        if "VERDE" in colores and "AZUL" in colores:
            tipo = "MIXTO"
        elif "AZUL" in colores:
            tipo = "AZUL"
        else:
            tipo = "VERDE"

        results.append(StreetSearchResult(
            nombre_calle=info["nombre_calle"],
            distrito=info["distrito"],
            tipo_estacionamiento=tipo,
            total_plazas=info["plazas_verde"] + info["plazas_azul"],
            plazas_verde=info["plazas_verde"],
            plazas_azul=info["plazas_azul"],
            center_coords=info["center_coords"]
        ))

    return results
