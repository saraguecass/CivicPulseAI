from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import RoutePlanningRequest
from app.services.route_service import plan_smart_route

router = APIRouter(prefix="/rutas", tags=["Planificador de Rutas"])

@router.post("/planificar")
def planificar_ruta(
    req: RoutePlanningRequest,
    db: Session = Depends(get_db)
):
    """
    Planifica la ruta inteligente multimodal (Coche + SER + Andando):
    1. Origen -> Parking / Tramo SER más cercano al destino.
    2. Detalle y tarificación oficial del parking según tipo de vehículo, distintivo DGT y franja horaria.
    3. Tramo a pie hasta el destino final.
    """
    return plan_smart_route(
        db=db,
        origen=req.origen,
        destino=req.destino,
        tipo_vehiculo=req.tipo_vehiculo,
        distintivo_dgt=req.distintivo_dgt,
        duracion_minutos=req.duracion_minutos,
        episodio_no2=req.episodio_no2,
        start_time=req.start_time
    )
