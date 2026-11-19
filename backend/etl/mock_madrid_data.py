import json
from sqlalchemy.orm import Session
from app.models import SERStreetSegment

# Semilla de datos con tramos reales de Madrid (Distritos Salamanca, Chamberí, Retiro, Centro)
MADRID_SER_SEED = [
    # --- SALAMANCA ---
    {
        "cod_via": 67300,
        "nombre_calle": "Calle de Serrano",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 45,
        "distrito": "Salamanca",
        "barrio": "Recoletos",
        "coordinates": [
            [-3.6888, 40.4208],
            [-3.6885, 40.4245],
            [-3.6882, 40.4285],
            [-3.6879, 40.4330]
        ]
    },
    {
        "cod_via": 67300,
        "nombre_calle": "Calle de Serrano (Tramo Residencial)",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 38,
        "distrito": "Salamanca",
        "barrio": "Castellana",
        "coordinates": [
            [-3.6878, 40.4335],
            [-3.6875, 40.4375],
            [-3.6872, 40.4410]
        ]
    },
    {
        "cod_via": 75600,
        "nombre_calle": "Calle de Velázquez",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 52,
        "distrito": "Salamanca",
        "barrio": "Recoletos",
        "coordinates": [
            [-3.6836, 40.4215],
            [-3.6833, 40.4260],
            [-3.6830, 40.4305],
            [-3.6828, 40.4350]
        ]
    },
    {
        "cod_via": 75600,
        "nombre_calle": "Calle de Velázquez (Tramo Verde)",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 34,
        "distrito": "Salamanca",
        "barrio": "Lista",
        "coordinates": [
            [-3.6828, 40.4350],
            [-3.6825, 40.4390]
        ]
    },
    {
        "cod_via": 34200,
        "nombre_calle": "Calle de Goya",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 60,
        "distrito": "Salamanca",
        "barrio": "Goya",
        "coordinates": [
            [-3.6905, 40.4251],
            [-3.6845, 40.4253],
            [-3.6780, 40.4255],
            [-3.6710, 40.4258]
        ]
    },
    {
        "cod_via": 19500,
        "nombre_calle": "Calle de Claudio Coello",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 42,
        "distrito": "Salamanca",
        "barrio": "Recoletos",
        "coordinates": [
            [-3.6865, 40.4210],
            [-3.6862, 40.4255],
            [-3.6859, 40.4300],
            [-3.6856, 40.4345]
        ]
    },
    {
        "cod_via": 42100,
        "nombre_calle": "Calle de Lagasca",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 40,
        "distrito": "Salamanca",
        "barrio": "Castellana",
        "coordinates": [
            [-3.6850, 40.4212],
            [-3.6848, 40.4258],
            [-3.6845, 40.4305]
        ]
    },

    # --- CHAMBERÍ ---
    {
        "cod_via": 31200,
        "nombre_calle": "Calle de Fuencarral",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 28,
        "distrito": "Chamberí",
        "barrio": "Trafalgar",
        "coordinates": [
            [-3.7025, 40.4285],
            [-3.7027, 40.4320],
            [-3.7030, 40.4345]
        ]
    },
    {
        "cod_via": 66200,
        "nombre_calle": "Calle de Santa Engracia",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 55,
        "distrito": "Chamberí",
        "barrio": "Almagro",
        "coordinates": [
            [-3.6965, 40.4300],
            [-3.6975, 40.4350],
            [-3.6990, 40.4400],
            [-3.7010, 40.4440]
        ]
    },
    {
        "cod_via": 58300,
        "nombre_calle": "Calle de Ponzano",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 36,
        "distrito": "Chamberí",
        "barrio": "Ríos Rosas",
        "coordinates": [
            [-3.6980, 40.4370],
            [-3.6995, 40.4410],
            [-3.7010, 40.4445]
        ]
    },
    {
        "cod_via": 39800,
        "nombre_calle": "Calle de José Abascal",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 70,
        "distrito": "Chamberí",
        "barrio": "Almagro",
        "coordinates": [
            [-3.7050, 40.4375],
            [-3.6980, 40.4385],
            [-3.6900, 40.4395]
        ]
    },
    {
        "cod_via": 45100,
        "nombre_calle": "Calle de Luchana",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 30,
        "distrito": "Chamberí",
        "barrio": "Trafalgar",
        "coordinates": [
            [-3.7020, 40.4305],
            [-3.6985, 40.4312],
            [-3.6960, 40.4318]
        ]
    },

    # --- RETIRO ---
    {
        "cod_via": 4200,
        "nombre_calle": "Calle de Alfonso XII",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 48,
        "distrito": "Retiro",
        "barrio": "Los Jerónimos",
        "coordinates": [
            [-3.6890, 40.4130],
            [-3.6885, 40.4165],
            [-3.6880, 40.4200]
        ]
    },
    {
        "cod_via": 51200,
        "nombre_calle": "Calle de Menéndez Pelayo",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 65,
        "distrito": "Retiro",
        "barrio": "Ibiza",
        "coordinates": [
            [-3.6780, 40.4110],
            [-3.6785, 40.4150],
            [-3.6790, 40.4190],
            [-3.6795, 40.4225]
        ]
    },
    {
        "cod_via": 38200,
        "nombre_calle": "Calle de Ibiza",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 44,
        "distrito": "Retiro",
        "barrio": "Ibiza",
        "coordinates": [
            [-3.6790, 40.4185],
            [-3.6740, 40.4187],
            [-3.6690, 40.4190]
        ]
    },
    {
        "cod_via": 53100,
        "nombre_calle": "Calle de Narváez",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 50,
        "distrito": "Retiro",
        "barrio": "Ibiza",
        "coordinates": [
            [-3.6760, 40.4140],
            [-3.6763, 40.4185],
            [-3.6767, 40.4230]
        ]
    },

    # --- CENTRO ---
    {
        "cod_via": 35400,
        "nombre_calle": "Gran Vía",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 22,
        "distrito": "Centro",
        "barrio": "Justicia",
        "coordinates": [
            [-3.7090, 40.4205],
            [-3.7040, 40.4198],
            [-3.6980, 40.4188]
        ]
    },
    {
        "cod_via": 11200,
        "nombre_calle": "Calle de Atocha",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 35,
        "distrito": "Centro",
        "barrio": "Cortes",
        "coordinates": [
            [-3.7035, 40.4140],
            [-3.6980, 40.4125],
            [-3.6920, 40.4100]
        ]
    },
    {
        "cod_via": 37100,
        "nombre_calle": "Calle de Hortaleza",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 26,
        "distrito": "Centro",
        "barrio": "Chueca",
        "coordinates": [
            [-3.7005, 40.4205],
            [-3.7000, 40.4240],
            [-3.6995, 40.4270]
        ]
    }
]

def seed_database_if_empty(db: Session):
    count = db.query(SERStreetSegment).count()
    if count > 0:
        return count

    print("[ETL] Insertando tramos SER de Madrid en la base de datos...")
    for item in MADRID_SER_SEED:
        segment = SERStreetSegment(
            cod_via=item.get("cod_via"),
            nombre_calle=item["nombre_calle"],
            tipo_reserva=item["tipo_reserva"],
            color=item["color"],
            num_plazas=item["num_plazas"],
            distrito=item["distrito"],
            barrio=item["barrio"],
            coordinates_json=json.dumps(item["coordinates"])
        )
        db.add(segment)
    db.commit()
    print(f"[ETL] Carga inicial completada: {len(MADRID_SER_SEED)} tramos insertados.")
    return len(MADRID_SER_SEED)
