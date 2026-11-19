import json
import os
from datetime import datetime, time, timedelta
from typing import Dict, Any, Optional

TARIFFS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "ser_tariffs.json")

_tariffs_cache: Optional[Dict[str, Any]] = None

def get_tariffs_data() -> Dict[str, Any]:
    global _tariffs_cache
    if _tariffs_cache is None:
        if os.path.exists(TARIFFS_FILE):
            with open(TARIFFS_FILE, "r", encoding="utf-8") as f:
                _tariffs_cache = json.load(f)
        else:
            _tariffs_cache = {}
    return _tariffs_cache

def get_ser_schedule_status(dt: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Evalúa el estado del horario SER para un instante determinado según las ordenanzas de Madrid:
    - Lunes a viernes: 9:00 a 21:00 h
    - Sábados: 9:00 a 15:00 h
    - Agosto (L-S): 9:00 a 15:00 h
    - 24 y 31 de diciembre: 9:00 a 15:00 h
    - Domingos y festivos: Gratuito todo el día
    """
    data = get_tariffs_data()
    horarios = data.get("horarios", {})
    festivos = set(horarios.get("festivos_fijos_madrid", []))

    if dt is None:
        dt = datetime.now()

    date_str = dt.strftime("%m-%d")
    weekday = dt.weekday() # 0 = Lunes, 6 = Domingo
    is_sunday = (weekday == 6)
    is_festivo = date_str in festivos
    is_agosto = (dt.month == 8)
    is_navidad_fin_ano = date_str in ("12-24", "12-31")

    # 1. Domingo o Festivo
    if is_sunday or is_festivo:
        return {
            "is_active": False,
            "ser_start": None,
            "ser_end": None,
            "fin_horario_ser_today": None,
            "tipo_jornada": "DOMINGO_O_FESTIVO",
            "descripcion": "Estacionamiento gratuito todo el día (Domingo o festivo oficial de Madrid)",
            "minutos_restantes_ser_hoy": 0
        }

    # Determinación de horas de inicio y fin para hoy
    start_time_obj = time(9, 0)
    if is_agosto or is_navidad_fin_ano or weekday == 5:
        # Sábado, agosto o 24/31 dic -> 9:00 a 15:00
        end_time_obj = time(15, 0)
        tipo_jornada = "REDUCIDA_15H"
        desc = "Horario reducido de 9:00 a 15:00 h (Sábado, Agosto o Nochebuena/Nochevieja)"
    else:
        # Lunes a viernes ordinario -> 9:00 a 21:00
        end_time_obj = time(21, 0)
        tipo_jornada = "ORDINARIA_21H"
        desc = "Horario ordinario de 9:00 a 21:00 h ininterrumpido"

    ser_start_dt = datetime.combine(dt.date(), start_time_obj)
    ser_end_dt = datetime.combine(dt.date(), end_time_obj)

    is_active = (ser_start_dt <= dt < ser_end_dt)

    minutos_restantes = 0
    if dt < ser_start_dt:
        estado_desc = f"Fuera de horario SER (El servicio inicia hoy a las 09:00). Estacionamiento libre."
    elif dt >= ser_end_dt:
        estado_desc = f"Fuera de horario SER (El servicio finalizó a las {end_time_obj.strftime('%H:%M')}). Estacionamiento libre."
    else:
        minutos_restantes = max(0, int((ser_end_dt - dt).total_seconds() / 60))
        estado_desc = f"Horario SER activo hasta las {end_time_obj.strftime('%H:%M')} (quedan ~{minutos_restantes} min)."

    return {
        "is_active": is_active,
        "ser_start": start_time_obj.strftime("%H:%M"),
        "ser_end": end_time_obj.strftime("%H:%M"),
        "fin_horario_ser_today": ser_end_dt.isoformat(),
        "tipo_jornada": tipo_jornada,
        "descripcion": f"{desc}. {estado_desc}",
        "minutos_restantes_ser_hoy": minutos_restantes
    }

def calculate_smart_parking_period(
    start_time: datetime,
    requested_minutes: int
) -> Dict[str, Any]:
    """
    Ajusta finPago = min(ahora + minutos, finHorarioSER).
    Por ejemplo, si llegas a las 20:30 y pides 60 min, el fin de pago útil es a las 21:00
    y la alerta se programa a las 20:30 o al inicio.
    """
    schedule = get_ser_schedule_status(start_time)
    ideal_end = start_time + timedelta(minutes=requested_minutes)

    if not schedule["is_active"] or not schedule["fin_horario_ser_today"]:
        # Fuera de horario SER o día gratuito
        alert_time = ideal_end - timedelta(minutes=30)
        if alert_time < start_time:
            alert_time = start_time
        return {
            "start_time": start_time,
            "end_time": ideal_end,
            "alert_time": alert_time,
            "minutos_reales": requested_minutes,
            "limitado_por_ser": False,
            "explicacion": "Estacionamiento fuera de horario SER o día gratuito.",
            "ser_end_str": schedule["ser_end"]
        }

    fin_ser_dt = datetime.fromisoformat(schedule["fin_horario_ser_today"])

    if ideal_end > fin_ser_dt:
        actual_end = fin_ser_dt
        minutos_reales = max(1, int((fin_ser_dt - start_time).total_seconds() / 60))
        limitado = True
        explicacion = (
            f"Hora ajustada automáticamente a las {fin_ser_dt.strftime('%H:%M')} "
            f"por finalización del horario SER de Madrid."
        )
    else:
        actual_end = ideal_end
        minutos_reales = requested_minutes
        limitado = False
        explicacion = f"Estacionamiento por {requested_minutes} minutos dentro del horario SER."

    alert_time = actual_end - timedelta(minutes=30)
    if alert_time < start_time:
        alert_time = start_time

    return {
        "start_time": start_time,
        "end_time": actual_end,
        "alert_time": alert_time,
        "minutos_reales": minutos_reales,
        "limitado_por_ser": limitado,
        "explicacion": explicacion,
        "ser_end_str": schedule["ser_end"]
    }

def calculate_tariff(
    tipo_plaza: str,
    minutos: int,
    tipo_vehiculo: str = "turismo",
    distintivo_dgt: str = "C",
    episodio_no2: str = "normal",
    start_time: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Calcula la tarifa según la ordenanza fiscal de Madrid, teniendo en cuenta:
    - Exenciones por tipo de vehículo (2 y 3 ruedas, PMR, taxi)
    - Exenciones y bonificaciones por Distintivo Ambiental DGT (CERO, ECO, C, B, A)
    - Recargos por contaminación NO2
    - Estado de horario SER
    """
    data = get_tariffs_data()
    plaza = tipo_plaza.upper()
    if plaza not in ("VERDE", "AZUL"):
        plaza = "VERDE"

    if start_time is None:
        start_time = datetime.now()

    schedule = get_ser_schedule_status(start_time)

    # 1. Comprobación de horario SER inactivo
    if not schedule["is_active"]:
        return {
            "precio_total": 0.0,
            "precio_base": 0.0,
            "exento": True,
            "motivo_exencion": "Estacionamiento gratuito (fuera de horario SER o festivo)",
            "distintivo_dgt": distintivo_dgt,
            "tipo_vehiculo": tipo_vehiculo,
            "tipo_plaza": plaza,
            "minutos": minutos,
            "horario_info": schedule["descripcion"],
            "restringido": False
        }

    # 2. Comprobación de vehículo exento por categoría DGT
    vehiculos_exentos = {"motocicleta", "ciclomotor", "triciclo", "pmr", "taxi"}
    if tipo_vehiculo.lower() in vehiculos_exentos:
        desc_v = next((v["nombre"] for v in data.get("tipos_vehiculo_dgt", []) if v["id"] == tipo_vehiculo.lower()), tipo_vehiculo)
        return {
            "precio_total": 0.0,
            "precio_base": 0.0,
            "exento": True,
            "motivo_exencion": f"Vehículo no sujeto al pago del SER: {desc_v}",
            "distintivo_dgt": distintivo_dgt,
            "tipo_vehiculo": tipo_vehiculo,
            "tipo_plaza": plaza,
            "minutos": minutos,
            "horario_info": schedule["descripcion"],
            "restringido": False
        }

    # 3. Comprobación de distintivo CERO emisiones
    tag = distintivo_dgt.upper()
    if tag == "CERO":
        return {
            "precio_total": 0.0,
            "precio_base": 0.0,
            "exento": True,
            "motivo_exencion": "Distintivo CERO Emisiones DGT (100% de reducción, estacionamiento gratuito sin límite de tiempo)",
            "distintivo_dgt": "CERO",
            "tipo_vehiculo": tipo_vehiculo,
            "tipo_plaza": plaza,
            "minutos": minutos,
            "horario_info": schedule["descripcion"],
            "restringido": False
        }

    # 4. Comprobación de categoría A / Sin distintivo
    restringido = False
    if tag == "A":
        restringido = True

    # 5. Obtener precio base de la tabla oficial municipal
    tarifas_base_config = data.get("tarifas_base", {}).get(plaza, {})
    tramos = tarifas_base_config.get("tramos", [])
    max_minutos_zona = tarifas_base_config.get("max_minutos", 120 if plaza == "VERDE" else 240)

    # Ajuste al límite máximo de la zona
    minutos_ajustados = min(minutos, max_minutos_zona)

    # Búsqueda o interpolación del tramo más adecuado
    precio_base = 0.0
    if tramos:
        # Encuentra el tramo exacto o superior
        tramo_aplicable = tramos[0]
        for t in tramos:
            if t["minutos"] <= minutos_ajustados:
                tramo_aplicable = t
            else:
                break
        precio_base = tramo_aplicable["precio"]

    # 6. Modificador por Distintivo Ambiental DGT
    # ECO: -75% | C: 0% | B: +20% | A: +75%
    factor_dgt = 0.0
    if tag == "ECO":
        factor_dgt = -0.75
    elif tag == "B":
        factor_dgt = 0.20
    elif tag == "A":
        factor_dgt = 0.75

    # 7. Modificador por Episodio de Contaminación NO2
    factor_no2 = 0.0
    if episodio_no2 == "escenario_1":
        factor_no2 = 0.60
    elif episodio_no2 == "escenario_2":
        factor_no2 = 1.00
        if tag in ("B", "A"):
            restringido = True

    factor_total = max(-1.0, factor_dgt + factor_no2)
    precio_calculado = max(0.0, precio_base * (1.0 + factor_total))
    precio_final = round(precio_calculado, 2)

    return {
        "precio_total": precio_final,
        "precio_base": round(precio_base, 2),
        "exento": False,
        "motivo_exencion": None,
        "distintivo_dgt": tag,
        "factor_dgt_porcentaje": int(factor_dgt * 100),
        "factor_no2_porcentaje": int(factor_no2 * 100),
        "tipo_vehiculo": tipo_vehiculo,
        "tipo_plaza": plaza,
        "minutos": minutos_ajustados,
        "max_minutos_zona": max_minutos_zona,
        "restringido": restringido,
        "aviso_restriccion": "Acceso y estacionamiento SER restringido a no residentes" if restringido else None,
        "horario_info": schedule["descripcion"]
    }
