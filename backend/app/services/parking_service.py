import json
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models import ActiveParking
from app.schemas import ParkingCreate, ParkingOut

def create_parking(db: Session, parking_in: ParkingCreate) -> ParkingOut:
    """
    Registra un estacionamiento y programa el aviso para 30 minutos antes del fin.
    """
    alert_time = parking_in.end_time - timedelta(minutes=30)
    
    push_sub_str = None
    if parking_in.push_subscription:
        push_sub_str = json.dumps(parking_in.push_subscription)

    db_parking = ActiveParking(
        user_id=parking_in.user_id,
        calle=parking_in.calle,
        tipo_plaza=parking_in.tipo_plaza.upper(),
        lat=parking_in.lat,
        lng=parking_in.lng,
        start_time=parking_in.start_time,
        end_time=parking_in.end_time,
        alert_time=alert_time,
        notification_sent=False,
        push_subscription=push_sub_str,
        created_at=datetime.utcnow()
    )
    db.add(db_parking)
    db.commit()
    db.refresh(db_parking)

    now = datetime.utcnow()
    minutos_restantes = max(0, int((db_parking.end_time - now).total_seconds() / 60))

    return ParkingOut(
        id=db_parking.id,
        user_id=db_parking.user_id,
        calle=db_parking.calle,
        tipo_plaza=db_parking.tipo_plaza,
        lat=db_parking.lat,
        lng=db_parking.lng,
        start_time=db_parking.start_time,
        end_time=db_parking.end_time,
        alert_time=db_parking.alert_time,
        notification_sent=db_parking.notification_sent,
        created_at=db_parking.created_at,
        minutos_restantes=minutos_restantes
    )

def get_active_parking(db: Session, user_id: str) -> Optional[ParkingOut]:
    """
    Obtiene el estacionamiento activo del usuario si aún no ha expirado.
    """
    now = datetime.utcnow()
    parking = db.query(ActiveParking).filter(
        ActiveParking.user_id == user_id,
        ActiveParking.end_time > now
    ).order_by(ActiveParking.id.desc()).first()

    if not parking:
        return None

    minutos_restantes = max(0, int((parking.end_time - now).total_seconds() / 60))

    return ParkingOut(
        id=parking.id,
        user_id=parking.user_id,
        calle=parking.calle,
        tipo_plaza=parking.tipo_plaza,
        lat=parking.lat,
        lng=parking.lng,
        start_time=parking.start_time,
        end_time=parking.end_time,
        alert_time=parking.alert_time,
        notification_sent=parking.notification_sent,
        created_at=parking.created_at,
        minutos_restantes=minutos_restantes
    )

def delete_parking(db: Session, parking_id: int) -> bool:
    parking = db.query(ActiveParking).filter(ActiveParking.id == parking_id).first()
    if parking:
        db.delete(parking)
        db.commit()
        return True
    return False
