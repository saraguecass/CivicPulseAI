from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ParkingCreate, ParkingOut
from app.services.parking_service import create_parking, get_active_parking, delete_parking
from app.config import settings

router = APIRouter(prefix="/estacionamientos", tags=["Estacionamientos"])

@router.get("/vapid-public-key")
def get_vapid_key():
    """
    Devuelve la clave pública VAPID para que el frontend pueda suscribirse a notificaciones Web Push.
    """
    return {"publicKey": settings.VAPID_PUBLIC_KEY}

@router.post("", response_model=ParkingOut, status_code=status.HTTP_201_CREATED)
def registrar_estacionamiento(
    parking_in: ParkingCreate,
    db: Session = Depends(get_db)
):
    """
    Registra el estacionamiento del coche del usuario (coordenadas, calle, hora inicio y fin).
    Calcula automáticamente la hora de alerta (30 minutos antes).
    """
    return create_parking(db=db, parking_in=parking_in)

@router.get("/activo", response_model=Optional[ParkingOut])
def obtener_estacionamiento_activo(
    user_id: str = Query("anon-user", description="Identificador anónimo del usuario/dispositivo"),
    db: Session = Depends(get_db)
):
    """
    Devuelve los datos del estacionamiento activo (si aún está vigente) con el cálculo de minutos restantes.
    """
    active = get_active_parking(db=db, user_id=user_id)
    return active

@router.delete("/{parking_id}", status_code=status.HTTP_204_NO_CONTENT)
def finalizar_estacionamiento(
    parking_id: int,
    db: Session = Depends(get_db)
):
    """
    Finaliza o cancela el estacionamiento activo.
    """
    success = delete_parking(db=db, parking_id=parking_id)
    if not success:
        raise HTTPException(status_code=404, detail="Estacionamiento no encontrado")
    return None
