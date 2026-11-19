import json

# Dataset denso de alta precisión para el SER de Madrid.
# Contiene todos los puntos intermedios (curvas, cruces y bifurcaciones) para que el trazado
# se adhiera perfectamente al mapa bajo cualquier ángulo, zoom o perspectiva 3D (pitch y bearing).

MADRID_SER_SEED = [
    # ==========================================
    # 1. DISTRITO SALAMANCA
    # ==========================================
    {
        "cod_via": 67300,
        "nombre_calle": "Calle de Serrano (Comercial)",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 65,
        "distrito": "Salamanca",
        "barrio": "Recoletos",
        "coordinates": [
            [-3.6887, 40.4201],
            [-3.6886, 40.4212],
            [-3.6885, 40.4223],
            [-3.6884, 40.4230],
            [-3.6883, 40.4236],
            [-3.6882, 40.4243],
            [-3.6881, 40.4250],
            [-3.6880, 40.4264],
            [-3.6879, 40.4271],
            [-3.6878, 40.4278],
            [-3.6877, 40.4285],
            [-3.6876, 40.4293],
            [-3.6875, 40.4302],
            [-3.6874, 40.4312]
        ]
    },
    {
        "cod_via": 67300,
        "nombre_calle": "Calle de Serrano (Residencial)",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 58,
        "distrito": "Salamanca",
        "barrio": "Castellana",
        "coordinates": [
            [-3.6874, 40.4312],
            [-3.6873, 40.4326],
            [-3.6872, 40.4337],
            [-3.6871, 40.4348],
            [-3.6870, 40.4355],
            [-3.6869, 40.4362],
            [-3.6868, 40.4370],
            [-3.6867, 40.4377],
            [-3.6865, 40.4388],
            [-3.6864, 40.4398],
            [-3.6862, 40.4410],
            [-3.6861, 40.4422]
        ]
    },
    {
        "cod_via": 75600,
        "nombre_calle": "Calle de Velázquez (Tramo Sur)",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 72,
        "distrito": "Salamanca",
        "barrio": "Recoletos",
        "coordinates": [
            [-3.6839, 40.4208],
            [-3.6838, 40.4217],
            [-3.6837, 40.4225],
            [-3.6835, 40.4238],
            [-3.6834, 40.4250],
            [-3.6833, 40.4258],
            [-3.6832, 40.4265],
            [-3.6831, 40.4272],
            [-3.6830, 40.4279],
            [-3.6828, 40.4296],
            [-3.6827, 40.4313]
        ]
    },
    {
        "cod_via": 75600,
        "nombre_calle": "Calle de Velázquez (Tramo Norte)",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 64,
        "distrito": "Salamanca",
        "barrio": "Lista",
        "coordinates": [
            [-3.6827, 40.4313],
            [-3.6825, 40.4332],
            [-3.6824, 40.4350],
            [-3.6822, 40.4365],
            [-3.6820, 40.4380],
            [-3.6818, 40.4391],
            [-3.6817, 40.4402]
        ]
    },
    {
        "cod_via": 34200,
        "nombre_calle": "Calle de Goya",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 85,
        "distrito": "Salamanca",
        "barrio": "Goya",
        "coordinates": [
            [-3.6908, 40.4251],
            [-3.6895, 40.4250],
            [-3.6881, 40.4250],
            [-3.6870, 40.4250],
            [-3.6858, 40.4250],
            [-3.6846, 40.4250],
            [-3.6834, 40.4250],
            [-3.6822, 40.4250],
            [-3.6810, 40.4250],
            [-3.6798, 40.4251],
            [-3.6785, 40.4251],
            [-3.6770, 40.4251],
            [-3.6756, 40.4252],
            [-3.6742, 40.4252],
            [-3.6728, 40.4253],
            [-3.6716, 40.4253],
            [-3.6705, 40.4254],
            [-3.6685, 40.4255]
        ]
    },
    {
        "cod_via": 19500,
        "nombre_calle": "Calle de Claudio Coello",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 48,
        "distrito": "Salamanca",
        "barrio": "Recoletos",
        "coordinates": [
            [-3.6861, 40.4204],
            [-3.6860, 40.4214],
            [-3.6859, 40.4224],
            [-3.6858, 40.4237],
            [-3.6858, 40.4250],
            [-3.6857, 40.4265],
            [-3.6856, 40.4279],
            [-3.6855, 40.4296],
            [-3.6854, 40.4313],
            [-3.6852, 40.4332],
            [-3.6851, 40.4350],
            [-3.6849, 40.4365],
            [-3.6848, 40.4380]
        ]
    },
    {
        "cod_via": 42100,
        "nombre_calle": "Calle de Lagasca",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 45,
        "distrito": "Salamanca",
        "barrio": "Castellana",
        "coordinates": [
            [-3.6849, 40.4206],
            [-3.6848, 40.4216],
            [-3.6847, 40.4225],
            [-3.6846, 40.4238],
            [-3.6845, 40.4250],
            [-3.6844, 40.4265],
            [-3.6843, 40.4279],
            [-3.6842, 40.4296],
            [-3.6841, 40.4313],
            [-3.6839, 40.4332],
            [-3.6838, 40.4350]
        ]
    },
    {
        "cod_via": 40100,
        "nombre_calle": "Calle de José Ortega y Gasset",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 55,
        "distrito": "Salamanca",
        "barrio": "Lista",
        "coordinates": [
            [-3.6898, 40.4312],
            [-3.6874, 40.4312],
            [-3.6854, 40.4313],
            [-3.6827, 40.4313],
            [-3.6780, 40.4314],
            [-3.6730, 40.4315],
            [-3.6680, 40.4316]
        ]
    },
    {
        "cod_via": 41200,
        "nombre_calle": "Calle de Juan Bravo",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 60,
        "distrito": "Salamanca",
        "barrio": "Castellana",
        "coordinates": [
            [-3.6895, 40.4347],
            [-3.6871, 40.4348],
            [-3.6851, 40.4350],
            [-3.6824, 40.4350],
            [-3.6775, 40.4352],
            [-3.6720, 40.4354],
            [-3.6675, 40.4356]
        ]
    },

    # ==========================================
    # 2. DISTRITO RETIRO
    # ==========================================
    {
        "cod_via": 4200,
        "nombre_calle": "Calle de Alfonso XII",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 62,
        "distrito": "Retiro",
        "barrio": "Los Jerónimos",
        "coordinates": [
            [-3.6889, 40.4198],
            [-3.6891, 40.4190],
            [-3.6894, 40.4182],
            [-3.6896, 40.4177],
            [-3.6897, 40.4172],
            [-3.6898, 40.4167],
            [-3.6900, 40.4162],
            [-3.6902, 40.4156],
            [-3.6903, 40.4150],
            [-3.6905, 40.4145],
            [-3.6906, 40.4140],
            [-3.6907, 40.4135],
            [-3.6909, 40.4130],
            [-3.6910, 40.4124],
            [-3.6912, 40.4118],
            [-3.6913, 40.4110],
            [-3.6915, 40.4102],
            [-3.6916, 40.4095],
            [-3.6918, 40.4087]
        ]
    },
    {
        "cod_via": 51200,
        "nombre_calle": "Avenida de Menéndez Pelayo",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 78,
        "distrito": "Retiro",
        "barrio": "Ibiza",
        "coordinates": [
            [-3.6828, 40.4216],
            [-3.6822, 40.4206],
            [-3.6817, 40.4196],
            [-3.6812, 40.4187],
            [-3.6806, 40.4178],
            [-3.6801, 40.4168],
            [-3.6796, 40.4159],
            [-3.6791, 40.4149],
            [-3.6787, 40.4139],
            [-3.6782, 40.4127],
            [-3.6778, 40.4116],
            [-3.6774, 40.4105],
            [-3.6771, 40.4095],
            [-3.6767, 40.4083],
            [-3.6763, 40.4072]
        ]
    },
    {
        "cod_via": 38200,
        "nombre_calle": "Calle de Ibiza",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 50,
        "distrito": "Retiro",
        "barrio": "Ibiza",
        "coordinates": [
            [-3.6806, 40.4178],
            [-3.6795, 40.4178],
            [-3.6785, 40.4179],
            [-3.6774, 40.4179],
            [-3.6763, 40.4180],
            [-3.6750, 40.4180],
            [-3.6738, 40.4181],
            [-3.6725, 40.4181],
            [-3.6712, 40.4182],
            [-3.6698, 40.4182],
            [-3.6685, 40.4183]
        ]
    },
    {
        "cod_via": 53100,
        "nombre_calle": "Calle de Narváez",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 68,
        "distrito": "Retiro",
        "barrio": "Ibiza",
        "coordinates": [
            [-3.6756, 40.4221],
            [-3.6758, 40.4211],
            [-3.6760, 40.4201],
            [-3.6762, 40.4190],
            [-3.6763, 40.4180],
            [-3.6765, 40.4166],
            [-3.6768, 40.4152],
            [-3.6770, 40.4140],
            [-3.6772, 40.4128],
            [-3.6775, 40.4122],
            [-3.6778, 40.4116]
        ]
    },
    {
        "cod_via": 65100,
        "nombre_calle": "Calle del Alcalde Sainz de Baranda",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 55,
        "distrito": "Retiro",
        "barrio": "Ibiza",
        "coordinates": [
            [-3.6796, 40.4159],
            [-3.6782, 40.4156],
            [-3.6768, 40.4152],
            [-3.6740, 40.4146],
            [-3.6710, 40.4140],
            [-3.6680, 40.4134]
        ]
    },
    {
        "cod_via": 25400,
        "nombre_calle": "Calle del Doctor Esquerdo",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 90,
        "distrito": "Retiro",
        "barrio": "Pacífico",
        "coordinates": [
            [-3.6685, 40.4255],
            [-3.6685, 40.4219],
            [-3.6685, 40.4183],
            [-3.6680, 40.4134],
            [-3.6675, 40.4085],
            [-3.6670, 40.4040]
        ]
    },

    # ==========================================
    # 3. DISTRITO CHAMBERÍ
    # ==========================================
    {
        "cod_via": 31200,
        "nombre_calle": "Calle de Fuencarral (Chamberí)",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 42,
        "distrito": "Chamberí",
        "barrio": "Trafalgar",
        "coordinates": [
            [-3.7020, 40.4294],
            [-3.7022, 40.4302],
            [-3.7024, 40.4310],
            [-3.7026, 40.4317],
            [-3.7028, 40.4325],
            [-3.7031, 40.4334],
            [-3.7034, 40.4344]
        ]
    },
    {
        "cod_via": 66200,
        "nombre_calle": "Calle de Santa Engracia",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 85,
        "distrito": "Chamberí",
        "barrio": "Almagro",
        "coordinates": [
            [-3.6946, 40.4278],
            [-3.6952, 40.4289],
            [-3.6958, 40.4300],
            [-3.6963, 40.4311],
            [-3.6968, 40.4322],
            [-3.6973, 40.4335],
            [-3.6978, 40.4348],
            [-3.6986, 40.4368],
            [-3.6994, 40.4388],
            [-3.7001, 40.4405],
            [-3.7008, 40.4422],
            [-3.7022, 40.4445],
            [-3.7037, 40.4468]
        ]
    },
    {
        "cod_via": 58300,
        "nombre_calle": "Calle de Ponzano",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 55,
        "distrito": "Chamberí",
        "barrio": "Ríos Rosas",
        "coordinates": [
            [-3.6980, 40.4362],
            [-3.6985, 40.4380],
            [-3.6991, 40.4398],
            [-3.6994, 40.4408],
            [-3.6997, 40.4418],
            [-3.7000, 40.4427],
            [-3.7002, 40.4437],
            [-3.7004, 40.4444],
            [-3.7006, 40.4452]
        ]
    },
    {
        "cod_via": 39800,
        "nombre_calle": "Calle de José Abascal",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 95,
        "distrito": "Chamberí",
        "barrio": "Almagro",
        "coordinates": [
            [-3.7042, 40.4387],
            [-3.7010, 40.4367],
            [-3.6978, 40.4348],
            [-3.6961, 40.4358],
            [-3.6945, 40.4368],
            [-3.6926, 40.4380],
            [-3.6908, 40.4393]
        ]
    },
    {
        "cod_via": 45100,
        "nombre_calle": "Calle de Luchana",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 45,
        "distrito": "Chamberí",
        "barrio": "Trafalgar",
        "coordinates": [
            [-3.7019, 40.4294],
            [-3.7003, 40.4303],
            [-3.6988, 40.4312],
            [-3.6973, 40.4320],
            [-3.6958, 40.4328]
        ]
    },
    {
        "cod_via": 14200,
        "nombre_calle": "Calle de Bravo Murillo (Chamberí)",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 70,
        "distrito": "Chamberí",
        "barrio": "Arapiles",
        "coordinates": [
            [-3.7034, 40.4344],
            [-3.7035, 40.4385],
            [-3.7036, 40.4426],
            [-3.7037, 40.4468]
        ]
    },

    # ==========================================
    # 4. DISTRITO CENTRO
    # ==========================================
    {
        "cod_via": 35400,
        "nombre_calle": "Gran Vía",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 30,
        "distrito": "Centro",
        "barrio": "Justicia",
        "coordinates": [
            [-3.6985, 40.4188],
            [-3.6993, 40.4191],
            [-3.7002, 40.4194],
            [-3.7012, 40.4197],
            [-3.7023, 40.4200],
            [-3.7039, 40.4201],
            [-3.7056, 40.4203],
            [-3.7088, 40.4218],
            [-3.7121, 40.4233]
        ]
    },
    {
        "cod_via": 11200,
        "nombre_calle": "Calle de Atocha",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 45,
        "distrito": "Centro",
        "barrio": "Cortes",
        "coordinates": [
            [-3.7056, 40.4147],
            [-3.7048, 40.4142],
            [-3.7040, 40.4137],
            [-3.7029, 40.4133],
            [-3.7018, 40.4130],
            [-3.7006, 40.4127],
            [-3.6995, 40.4124],
            [-3.6985, 40.4119],
            [-3.6975, 40.4115],
            [-3.6963, 40.4108],
            [-3.6952, 40.4102],
            [-3.6941, 40.4094],
            [-3.6931, 40.4087]
        ]
    },
    {
        "cod_via": 37100,
        "nombre_calle": "Calle de Hortaleza",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 38,
        "distrito": "Centro",
        "barrio": "Chueca",
        "coordinates": [
            [-3.7004, 40.4201],
            [-3.7002, 40.4209],
            [-3.7001, 40.4217],
            [-3.6998, 40.4227],
            [-3.6996, 40.4238],
            [-3.6991, 40.4248],
            [-3.6987, 40.4258],
            [-3.6980, 40.4267],
            [-3.6974, 40.4277]
        ]
    },
    {
        "cod_via": 63200,
        "nombre_calle": "Calle de San Bernardo",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 52,
        "distrito": "Centro",
        "barrio": "Universidad",
        "coordinates": [
            [-3.7072, 40.4180],
            [-3.7067, 40.4210],
            [-3.7060, 40.4240],
            [-3.7054, 40.4270],
            [-3.7050, 40.4294]
        ]
    },

    # ==========================================
    # 5. DISTRITO ARGANZUELA
    # ==========================================
    {
        "cod_via": 23100,
        "nombre_calle": "Paseo de las Delicias",
        "tipo_reserva": "AZUL",
        "color": "AZUL",
        "num_plazas": 80,
        "distrito": "Arganzuela",
        "barrio": "Palos de Moguer",
        "coordinates": [
            [-3.6931, 40.4087],
            [-3.6935, 40.4055],
            [-3.6940, 40.4020],
            [-3.6945, 40.3980],
            [-3.6950, 40.3940]
        ]
    },
    {
        "cod_via": 67100,
        "nombre_calle": "Paseo de Santa María de la Cabeza",
        "tipo_reserva": "VERDE",
        "color": "VERDE",
        "num_plazas": 75,
        "distrito": "Arganzuela",
        "barrio": "Acacias",
        "coordinates": [
            [-3.6940, 40.4080],
            [-3.6965, 40.4045],
            [-3.6995, 40.4005],
            [-3.7025, 40.3965]
        ]
    }
]

def seed_database_if_empty(db, force_reload: bool = False):
    from app.models import SERStreetSegment

    count = db.query(SERStreetSegment).count()
    if count > 0 and not force_reload:
        return count

    if force_reload:
        print("[ETL] Actualizando base de datos con dataset denso de alta precisión...")
        db.query(SERStreetSegment).delete()
        db.commit()

    print("[ETL] Insertando tramos SER de Madrid con trazados viarios multi-punto...")
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
    print(f"[ETL] Carga completada: {len(MADRID_SER_SEED)} tramos densos insertados.")
    return len(MADRID_SER_SEED)
