from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from app.database import Base

class SERStreetSegment(Base):
    __tablename__ = "ser_street_segments"

    id = Column(Integer, primary_key=True, index=True)
    cod_via = Column(Integer, nullable=True, index=True)
    nombre_calle = Column(String(255), nullable=False, index=True)
    tipo_reserva = Column(String(50), default="VERDE")  # VERDE, AZUL, ALTA_ROTACION
    color = Column(String(20), index=True)               # VERDE, AZUL
    num_plazas = Column(Integer, default=0)
    distrito = Column(String(100), index=True)
    barrio = Column(String(100), index=True)
    # GeoJSON coordinates almacenadas como texto compatible tanto en PostGIS como SQLite
    coordinates_json = Column(Text, nullable=False)

class ActiveParking(Base):
    __tablename__ = "active_parkings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), index=True)
    calle = Column(String(255), nullable=True)
    tipo_plaza = Column(String(20), default="VERDE") # VERDE o AZUL
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    alert_time = Column(DateTime, nullable=False)     # 30 minutos antes del end_time
    notification_sent = Column(Boolean, default=False)
    push_subscription = Column(Text, nullable=True)   # JSON con endpoint y keys VAPID
    created_at = Column(DateTime, default=datetime.utcnow)
