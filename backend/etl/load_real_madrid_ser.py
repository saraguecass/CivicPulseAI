"""
Carga masiva de datos REALES del dataset oficial del Ayuntamiento de Madrid (34.511 filas).
Convierte coordenadas ETRS89 / UTM 30N (gis_x, gis_y) a WGS84 (lng, lat)
y genera trazados reales para todos los distritos de Madrid.
"""

import os
import sys
import math
import json
import sqlite3
import pandas as pd

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "ser_calles_real.csv")
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "civicpulse.db")

def utm30n_to_wgs84(easting: float, northing: float):
    """
    Conversión geodésica exacta de ETRS89 / UTM Huso 30N (EPSG:25830)
    a coordenadas geográficas WGS84 (EPSG:4326) [longitud, latitud].
    """
    a = 6378137.0
    f = 1 / 298.257223563
    k0 = 0.9996
    e = math.sqrt(2 * f - f * f)
    e1 = (1 - math.sqrt(1 - e * e)) / (1 + math.sqrt(1 - e * e))
    
    x = easting - 500000.0
    y = northing
    
    m = y / k0
    mu = m / (a * (1 - e * e / 4 - 3 * e**4 / 64 - 5 * e**6 / 256))
    
    phi1 = mu + (3 * e1 / 2 - 27 * e1**3 / 32) * math.sin(2 * mu) + \
           (21 * e1**2 / 16 - 55 * e1**4 / 32) * math.sin(4 * mu) + \
           (151 * e1**3 / 96) * math.sin(6 * mu) + \
           (1097 * e1**4 / 512) * math.sin(8 * mu)
           
    c1 = e * e / (1 - e * e) * (math.cos(phi1)**2)
    t1 = math.tan(phi1)**2
    n1 = a / math.sqrt(1 - e * e * (math.sin(phi1)**2))
    r1 = a * (1 - e * e) / ((1 - e * e * (math.sin(phi1)**2))**1.5)
    d = x / (n1 * k0)
    
    lat = phi1 - (n1 * math.tan(phi1) / r1) * (
        d * d / 2 -
        (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * e * e / (1 - e * e)) * d**4 / 24 +
        (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1) * d**6 / 720
    )
    
    lon = (d - (1 + 2 * t1 + c1) * d**3 / 6 +
           (5 - 2 * c1 + 28 * t1) * d**5 / 120) / math.cos(phi1)
           
    lon_deg = -3.0 + math.degrees(lon)
    lat_deg = math.degrees(lat)
    return round(lon_deg, 6), round(lat_deg, 6)

def format_street_name(raw_name: str) -> str:
    """Formatea 'AGUAS, CALLE, DE LAS' -> 'Calle de las Aguas'."""
    if not isinstance(raw_name, str):
        return "Calle"
    parts = [p.strip() for p in raw_name.split(',')]
    if len(parts) == 3:
        tipo = parts[1].capitalize()
        art = parts[2].lower()
        nom = parts[0].title()
        return f"{tipo} {art} {nom}".strip()
    elif len(parts) == 2:
        tipo = parts[1].capitalize()
        nom = parts[0].title()
        return f"{tipo} {nom}".strip()
    return raw_name.title()

def sort_points_along_street(pts):
    """Ordena los puntos a lo largo del eje de la calle para crear un LineString continuo."""
    if len(pts) <= 1:
        if len(pts) == 1:
            # Si solo hay 1 punto, crear un pequeño segmento de 15m para LineString válido
            p = pts[0]
            return [[round(p[0] - 0.0001, 6), p[1]], [round(p[0] + 0.0001, 6), p[1]]]
        return []
    
    # Empezar por el punto más extremo (menor X)
    pts = sorted(pts, key=lambda p: (p[0], p[1]))
    ordered = [pts.pop(0)]
    while pts:
        last = ordered[-1]
        # Buscar el punto más cercano restante
        pts.sort(key=lambda p: (p[0] - last[0])**2 + (p[1] - last[1])**2)
        ordered.append(pts.pop(0))
    return ordered

def load_real_dataset():
    if not os.path.exists(CSV_PATH):
        print(f"Error: No se encuentra {CSV_PATH}")
        return

    print(f"Cargando dataset real de Madrid desde {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH, sep=';', encoding='latin-1')
    print(f"Total registros cargados: {len(df)}")

    # Normalizar color: 'Verde' -> 'VERDE', 'Azul' -> 'AZUL'
    def parse_color(c):
        if not isinstance(c, str):
            return 'VERDE'
        c_upper = c.upper()
        if 'AZUL' in c_upper or 'ALTA ROTACIÓN' in c_upper:
            return 'AZUL'
        return 'VERDE'

    df['color_clean'] = df['color'].apply(parse_color)
    df['numero_plazas'] = pd.to_numeric(df['numero_plazas'], errors='coerce').fillna(1).astype(int)

    # Agrupar por calle, color, distrito y barrio
    grouped = df.groupby(['distrito', 'barrio', 'calle', 'color_clean'])
    print(f"Total tramos a generar: {len(grouped)}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Limpiar tabla para insertar los datos reales oficiales
    cursor.execute("DELETE FROM ser_street_segments")

    inserted = 0
    for (distrito, barrio, raw_calle, color), group in grouped:
        calle_formateada = format_street_name(raw_calle)
        total_plazas = int(group['numero_plazas'].sum())

        # Convertir puntos UTM a WGS84
        pts = []
        for _, row in group.iterrows():
            try:
                gx = float(str(row['gis_x']).replace(',', '.'))
                gy = float(str(row['gis_y']).replace(',', '.'))
                pt = utm30n_to_wgs84(gx, gy)
                pts.append(pt)
            except Exception:
                continue

        coords = sort_points_along_street(pts)
        if not coords:
            continue

        cursor.execute("""
            INSERT INTO ser_street_segments 
            (nombre_calle, tipo_reserva, color, num_plazas, distrito, barrio, coordinates_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            calle_formateada,
            color,
            color,
            total_plazas,
            str(distrito).strip(),
            str(barrio).strip(),
            json.dumps(coords)
        ))
        inserted += 1

    conn.commit()
    print(f"✅ ¡Carga completada con éxito! {inserted} tramos reales insertados en {DB_PATH}")

    # Estadísticas por distrito
    cursor.execute("SELECT distrito, COUNT(*), SUM(num_plazas) FROM ser_street_segments GROUP BY distrito")
    print("\n--- Desglose Oficial por Distritos ---")
    for r in cursor.fetchall():
        print(f"Distrito: {r[0]} | Tramos: {r[1]} | Plazas totales: {r[2]}")

    conn.close()

if __name__ == "__main__":
    load_real_dataset()
