from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# --- Esquemas GeoJSON ---
class GeoJSONGeometry(BaseModel):
    type: str = "LineString"
    coordinates: List[List[float]]

class GeoJSONProperties(BaseModel):
    id: int
    cod_via: Optional[int] = None
    nombre_calle: str
    color: str
    tipo_reserva: str
    num_plazas: int
    distrito: Optional[str] = None
    barrio: Optional[str] = None

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJSONGeometry
    properties: GeoJSONProperties

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

# --- Esquema de Búsqueda de Calles ---
class StreetSearchResult(BaseModel):
    nombre_calle: str
    distrito: str
    tipo_estacionamiento: str  # "VERDE", "AZUL", "MIXTO"
    total_plazas: int
    plazas_verde: int
    plazas_azul: int
    center_coords: List[float] # [lng, lat] para centrar el mapa

# --- Esquemas de Estacionamiento ---
class ParkingCreate(BaseModel):
    user_id: Optional[str] = "anon-user"
    calle: Optional[str] = "Calle Madrid"
    tipo_plaza: str = "VERDE"
    lat: float
    lng: float
    start_time: datetime
    end_time: datetime
    tipo_vehiculo: Optional[str] = "turismo"
    distintivo_dgt: Optional[str] = "C"
    push_subscription: Optional[Dict[str, Any]] = None

class ParkingOut(BaseModel):
    id: int
    user_id: str
    calle: Optional[str]
    tipo_plaza: str
    lat: float
    lng: float
    start_time: datetime
    end_time: datetime
    alert_time: datetime
    notification_sent: bool
    created_at: datetime
    minutos_restantes: int = 0
    limitado_por_ser: bool = False
    explicacion_ajuste: Optional[str] = None

    class Config:
        from_attributes = True

# --- Esquemas de Cálculo de Tarifas y SER ---
class TariffCalculationRequest(BaseModel):
    tipo_plaza: str = "VERDE"
    minutos: int = 120
    tipo_vehiculo: str = "turismo"
    distintivo_dgt: str = "C"
    episodio_no2: str = "normal"
    start_time: Optional[datetime] = None

# --- Esquemas de Planificación de Ruta ---
class RoutePlanningRequest(BaseModel):
    origen: Any  # [lng, lat] o nombre de calle/punto
    destino: Any # [lng, lat] o nombre de calle/punto
    tipo_vehiculo: str = "turismo"
    distintivo_dgt: str = "C"
    duracion_minutos: int = 120
    episodio_no2: str = "normal"
    start_time: Optional[datetime] = None
