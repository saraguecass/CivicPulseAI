import time
import json
import urllib.request
import urllib.parse
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.config import settings
from app.models import SERStreetSegment

# Caché en memoria para cumplir la política de Nominatim y optimizar respuestas
_cache_geocode: Dict[str, Tuple[float, float, str]] = {}
_cache_autocomplete: Dict[str, List[Dict[str, Any]]] = {}
_last_nominatim_request_time: float = 0.0

# Nodos y puntos emblemáticos de referencia en Madrid para búsqueda instantánea offline
MADRID_LOCAL_PLACES = [
    {"label": "Puerta del Sol", "lng": -3.7038, "lat": 40.4168, "tipo": "landmark", "distrito": "Centro"},
    {"label": "Plaza Mayor", "lng": -3.7074, "lat": 40.4154, "tipo": "landmark", "distrito": "Centro"},
    {"label": "Gran Vía (Callao / España)", "lng": -3.7035, "lat": 40.4203, "tipo": "landmark", "distrito": "Centro"},
    {"label": "Estación de Atocha", "lng": -3.6922, "lat": 40.4065, "tipo": "transporte", "distrito": "Retiro / Arganzuela"},
    {"label": "Plaza de Cibeles", "lng": -3.6921, "lat": 40.4196, "tipo": "landmark", "distrito": "Centro"},
    {"label": "Plaza de Colón", "lng": -3.6900, "lat": 40.4253, "tipo": "landmark", "distrito": "Salamanca"},
    {"label": "Parque de El Retiro (Puerta de Alcalá)", "lng": -3.6883, "lat": 40.4199, "tipo": "parque", "distrito": "Retiro"},
    {"label": "Intercambiador de Moncloa", "lng": -3.7196, "lat": 40.4354, "tipo": "transporte", "distrito": "Moncloa-Aravaca"},
    {"label": "Plaza de Castilla (Torres KIO)", "lng": -3.6893, "lat": 40.4665, "tipo": "transporte", "distrito": "Chamartín"},
    {"label": "Estación de Chamartín", "lng": -3.6825, "lat": 40.4720, "tipo": "transporte", "distrito": "Chamartín"},
    {"label": "Glorieta de Bilbao / Fuencarral", "lng": -3.7025, "lat": 40.4285, "tipo": "calle", "distrito": "Chamberí"},
    {"label": "Paseo de la Castellana (Nuevos Ministerios)", "lng": -3.6915, "lat": 40.4465, "tipo": "avenida", "distrito": "Chamberí / Tetuán"},
    {"label": "Estadio Santiago Bernabéu", "lng": -3.6883, "lat": 40.4530, "tipo": "estadio", "distrito": "Chamartín"},
    {"label": "Templo de Debod", "lng": -3.7178, "lat": 40.4240, "tipo": "monumento", "distrito": "Moncloa"},
    {"label": "Palacio Real de Madrid", "lng": -3.7143, "lat": 40.4180, "tipo": "monumento", "distrito": "Centro"}
]

def search_local_madrid(query: str, db: Optional[Session] = None, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Búsqueda rápida en el catálogo de Madrid y base de datos SER.
    Responde en 0 ms sin depender de red externa.
    """
    results: List[Dict[str, Any]] = []
    q_norm = query.lower().strip()

    # 1. Puntos emblemáticos locales
    for place in MADRID_LOCAL_PLACES:
        if q_norm in place["label"].lower() or any(w in place["label"].lower() for w in q_norm.split()):
            results.append({
                "label": f"{place['label']}, Madrid",
                "lat": place["lat"],
                "lng": place["lng"],
                "tipo": place["tipo"],
                "distrito": place["distrito"]
            })
            if len(results) >= limit:
                return results

    # 2. Tramos SER en la base de datos
    if db:
        segments = db.query(SERStreetSegment).filter(
            SERStreetSegment.nombre_calle.ilike(f"%{q_norm}%")
        ).limit(limit).all()

        seen_streets = set()
        for seg in segments:
            if seg.nombre_calle in seen_streets:
                continue
            seen_streets.add(seg.nombre_calle)
            try:
                coords = json.loads(seg.coordinates_json)
                if coords:
                    mid = coords[len(coords) // 2]
                    results.append({
                        "label": f"{seg.nombre_calle} ({seg.color}), Madrid",
                        "lat": mid[1],
                        "lng": mid[0],
                        "tipo": f"ser_{seg.color.lower()}",
                        "distrito": seg.distrito or "Madrid"
                    })
                    if len(results) >= limit:
                        return results
            except Exception:
                pass

    return results

def autocomplete_photon(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Autocompletado mediante Photon (OSM geocoder optimizado para search-as-you-type).
    """
    q_clean = query.strip()
    if not q_clean or len(q_clean) < 2:
        return []

    cache_key = f"photon:{q_clean.lower()}"
    if cache_key in _cache_autocomplete:
        return _cache_autocomplete[cache_key]

    try:
        # Bounding box y centroide de Madrid para priorizar resultados locales
        params = urllib.parse.urlencode({
            "q": f"{q_clean} Madrid",
            "lat": 40.4168,
            "lon": -3.7038,
            "limit": limit
        })
        url = f"{settings.PHOTON_BASE_URL.rstrip('/')}/api/?{params}"
        req = urllib.request.Request(url, headers={"User-Agent": settings.GEOLOCATION_USER_AGENT})
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        results = []
        for feat in data.get("features", []):
            coords = feat.get("geometry", {}).get("coordinates", [])
            props = feat.get("properties", {})
            if len(coords) >= 2:
                name = props.get("name") or props.get("street") or q_clean
                city = props.get("city") or props.get("state") or "Madrid"
                results.append({
                    "label": f"{name}, {city}",
                    "lat": coords[1],
                    "lng": coords[0],
                    "tipo": props.get("osm_value", "lugar"),
                    "distrito": props.get("district", "Madrid")
                })

        _cache_autocomplete[cache_key] = results
        return results
    except Exception:
        return []

def geocode_nominatim(query: str) -> Optional[Tuple[float, float, str]]:
    """
    Geocodificación con Nominatim respetando escrupulosamente:
    1. Máximo 1 petición por segundo.
    2. User-Agent identificativo.
    3. Caché obligatoria.
    """
    global _last_nominatim_request_time
    q_norm = query.lower().strip()

    if q_norm in _cache_geocode:
        return _cache_geocode[q_norm]

    # Control de tasa de peticiones (1 req / seg)
    elapsed = time.time() - _last_nominatim_request_time
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)

    try:
        params = urllib.parse.urlencode({
            "q": f"{query}, Madrid, España",
            "format": "json",
            "limit": 1,
            "countrycodes": "es",
            "viewbox": "-3.85,40.52,-3.55,40.32", # Bounding Box Comunidad / Capital de Madrid
            "bounded": 1
        })
        url = f"{settings.NOMINATIM_BASE_URL.rstrip('/')}/search?{params}"
        req = urllib.request.Request(url, headers={"User-Agent": settings.GEOLOCATION_USER_AGENT})
        _last_nominatim_request_time = time.time()

        with urllib.request.urlopen(req, timeout=3.0) as resp:
            items = json.loads(resp.read().decode("utf-8"))

        if items and len(items) > 0:
            best = items[0]
            lat = float(best["lat"])
            lng = float(best["lon"])
            name = best.get("display_name", query)
            res = (lng, lat, name)
            _cache_geocode[q_norm] = res
            return res
    except Exception:
        pass

    return None

def resolve_location(query_or_coords: Any, db: Optional[Session] = None) -> Tuple[float, float, str]:
    """
    Resuelve robustamente cualquier entrada (coordenadas, calle o punto):
    1. Array / lista [lng, lat]
    2. Dict {'lat': ..., 'lng': ...}
    3. Cadena 'lat, lng'
    4. Búsqueda local de Madrid / SER (0 ms)
    5. Geocodificación remota Nominatim / Photon
    6. Fallback a Madrid Centro (Puerta del Sol)
    """
    # 1. Lista / tupla [lng, lat]
    if isinstance(query_or_coords, (list, tuple)) and len(query_or_coords) >= 2:
        return float(query_or_coords[0]), float(query_or_coords[1]), "Ubicación fijada"

    # 2. Diccionario {'lat': ..., 'lng': ...}
    if isinstance(query_or_coords, dict):
        if "lng" in query_or_coords and "lat" in query_or_coords:
            return float(query_or_coords["lng"]), float(query_or_coords["lat"]), "Ubicación fijada"
        if "lon" in query_or_coords and "lat" in query_or_coords:
            return float(query_or_coords["lon"]), float(query_or_coords["lat"]), "Ubicación fijada"

    # 3. String
    if isinstance(query_or_coords, str):
        clean = query_or_coords.strip()

        # Comprobar si son coordenadas en string 'lat, lng' o 'lng, lat'
        if "," in clean:
            parts = clean.split(",")
            if len(parts) == 2:
                try:
                    p1 = float(parts[0].strip())
                    p2 = float(parts[1].strip())
                    # En Madrid latitud ~ 40.4 y longitud ~ -3.7
                    if 39.0 <= p1 <= 42.0 and -5.0 <= p2 <= -2.0:
                        return p2, p1, "Coordenadas fijadas"
                    elif -5.0 <= p1 <= -2.0 and 39.0 <= p2 <= 42.0:
                        return p1, p2, "Coordenadas fijadas"
                except ValueError:
                    pass

        # Búsqueda local inmediata
        local_results = search_local_madrid(clean, db=db, limit=1)
        if local_results:
            first = local_results[0]
            return first["lng"], first["lat"], first["label"]

        # Intento con Nominatim (con caché y rate limit)
        nom_res = geocode_nominatim(clean)
        if nom_res:
            return nom_res

        # Intento con Photon
        photon_res = autocomplete_photon(clean, limit=1)
        if photon_res:
            first = photon_res[0]
            return first["lng"], first["lat"], first["label"]

    # Fallback predeterminado seguro a Madrid Centro
    return -3.7038, 40.4168, "Puerta del Sol, Madrid"
