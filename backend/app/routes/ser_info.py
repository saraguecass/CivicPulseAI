from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from app.services.ser_calculator import (
    get_tariffs_data,
    get_ser_schedule_status,
    calculate_tariff,
    calculate_smart_parking_period
)
from app.schemas import TariffCalculationRequest

router = APIRouter(prefix="/ser", tags=["SER Madrid - Normativa y Tarifas"])

@router.get("/info")
def get_ser_info():
    """
    Retorna la información completa de la Ordenanza del SER de Madrid:
    - Tabla oficial de tarifas base (Zona Azul y Verde)
    - Horarios ordinarios, reducidos y días gratuitos
    - Tipología de vehículos DGT y exenciones
    - Distintivos ambientales DGT con sus bonificaciones y recargos
    - Escenarios del protocolo de contaminación por NO2
    - Estado en tiempo real del horario SER en Madrid
    """
    tariffs_data = get_tariffs_data()
    now_status = get_ser_schedule_status(datetime.now())
    return {
        **tariffs_data,
        "estado_actual": now_status
    }

@router.get("/estado-horario")
def get_current_schedule():
    """
    Retorna el estado actual del horario del SER en Madrid.
    """
    return get_ser_schedule_status(datetime.now())

@router.post("/calcular-tarifa")
def post_calculate_tariff(req: TariffCalculationRequest):
    """
    Calcula la tarifa oficial exacta de estacionamiento según la ordenanza municipal:
    - Modulación por etiqueta ambiental DGT (CERO, ECO, C, B, A)
    - Exenciones por vehículo (2/3 ruedas, PMR, taxi, 0 Emisiones)
    - Recargos por contaminación NO2
    - Comprobación de límites horarios y gratuidad fuera de horario
    """
    return calculate_tariff(
        tipo_plaza=req.tipo_plaza,
        minutos=req.minutos,
        tipo_vehiculo=req.tipo_vehiculo,
        distintivo_dgt=req.distintivo_dgt,
        episodio_no2=req.episodio_no2,
        start_time=req.start_time or datetime.now()
    )
