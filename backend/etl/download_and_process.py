"""
ETL Completo para Ingesta y Geocodificación del Dataset SER de Madrid.
Fuente oficial: https://datos.madrid.es/dataset/218228-0-ser-calles/resource/218228-1-ser-calles-csv
"""

import os
import sys
import json
import time
import requests
import pandas as pd
from typing import Dict, List, Optional

# Añadir ruta del backend para importar modelos
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import SessionLocal, Base, engine
from app.models import SERStreetSegment

SER_CSV_URL = "https://datos.madrid.es/egob/catalogo/218228-1-ser-calles.csv"
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CACHE_FILE = os.path.join(DATA_DIR, "osm_geometries_cache.json")

def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)

def download_ser_csv(dest_path: str) -> str:
    """Descarga el CSV oficial del Ayuntamiento de Madrid con timeout y streaming."""
    ensure_data_dir()
    print(f"[ETL] Descargando dataset SER desde {SER_CSV_URL}...")
    headers = {"User-Agent": "CivicPulseAI-ETL/1.0 (Hackathon Madrid)"}
    resp = requests.get(SER_CSV_URL, headers=headers, stream=True, timeout=30)
    resp.raise_for_status()
    with open(dest_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=16384):
            f.write(chunk)
    print(f"[ETL] Archivo guardado en {dest_path}")
    return dest_path

def get_osm_street_geometry(street_name: str, cache: Dict) -> Optional[List[List[float]]]:
    """
    Obtiene el trazado vectorial denso de una calle en Madrid mediante la API de OpenStreetMap.
    Guarda todos los puntos intermedios (curvas, cruces) para ajustarse a cualquier perspectiva 3D.
    """
    clean_name = street_name.split("(")[0].strip()
    if clean_name in cache:
        return cache[clean_name]

    # Query Nominatim de OpenStreetMap con polígono completo (polygon_geojson=1)
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": f"{clean_name}, Madrid, España",
        "format": "geojson",
        "polygon_geojson": 1,
        "limit": 1
    }
    headers = {"User-Agent": "CivicPulseAI-Madrid-ETL/1.0"}

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            features = data.get("features", [])
            if features:
                geom = features[0].get("geometry", {})
                gtype = geom.get("type")
                coords = geom.get("coordinates")

                # Normalizar LineString o MultiLineString a lista de puntos [lng, lat]
                dense_coords = []
                if gtype == "LineString":
                    dense_coords = coords
                elif gtype == "MultiLineString" and coords:
                    for part in coords:
                        dense_coords.extend(part)

                if dense_coords:
                    cache[clean_name] = dense_coords
                    time.sleep(1.0) # Respetar política de 1 petición/segundo de Nominatim
                    return dense_coords
    except Exception as e:
        print(f"[ETL] Error geocodificando {clean_name}: {e}")

    return None

def run_etl(csv_file_path: Optional[str] = None, limit_records: Optional[int] = None):
    """
    Ejecuta el pipeline completo:
    1. Carga el CSV oficial.
    2. Agrupa tramos por calle, distrito y color.
    3. Asocia la geometría vectorial densa de cada calle.
    4. Vuelca los resultados en la base de datos (PostGIS o SQLite).
    """
    ensure_data_dir()
    csv_path = csv_file_path or os.path.join(DATA_DIR, "ser_calles_2026.csv")

    if not os.path.exists(csv_path):
        try:
            download_ser_csv(csv_path)
        except Exception as e:
            print(f"[ETL Error] No se pudo descargar el CSV: {e}")
            print(f"[ETL] Por favor, coloca el archivo manualmente en: {csv_path}")
            return

    print(f"[ETL] Procesando dataset con Pandas: {csv_path}...")
    try:
        # Los CSV de Madrid se distribuyen en Latin-1 con separador ';'
        df = pd.read_csv(csv_path, sep=';', encoding='latin-1', dtype=str)
    except Exception:
        df = pd.read_csv(csv_path, sep=';', encoding='utf-8', dtype=str)

    print(f"[ETL] Total de filas encontradas en el dataset: {len(df)}")
    print(f"[ETL] Columnas: {list(df.columns)}")

    # Cargar caché de geometrías
    cache = {}
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                cache = json.load(f)
        except Exception:
            cache = {}

    db = SessionLocal()
    try:
        # Limpiar registros para carga limpia
        db.query(SERStreetSegment).delete()
        db.commit()

        # Agrupar por calle, color y distrito para calcular totales
        # Nombres típicos de columnas en datos.madrid.es: NOM_VIA, COLOR, NUM_PLAZAS, DISTRITO, BARRIO
        col_calle = next((c for c in df.columns if 'NOM' in c.upper() or 'CALLE' in c.upper()), 'NOM_VIA')
        col_color = next((c for c in df.columns if 'COLOR' in c.upper()), 'COLOR')
        col_plazas = next((c for c in df.columns if 'PLAZA' in c.upper() or 'NUM' in c.upper()), 'NUM_PLAZAS')
        col_distrito = next((c for c in df.columns if 'DISTRITO' in c.upper()), 'DISTRITO')

        grouped = df.groupby([col_calle, col_color, col_distrito], as_index=False)[col_plazas].count()
        if limit_records:
            grouped = grouped.head(limit_records)

        inserted_count = 0
        for _, row in grouped.iterrows():
            street_name = str(row[col_calle]).strip()
            color = str(row[col_color]).strip().upper()
            distrito = str(row[col_distrito]).strip()
            try:
                plazas = int(row[col_plazas])
            except Exception:
                plazas = 20

            # Obtener trazado denso
            coords = get_osm_street_geometry(street_name, cache)
            if not coords:
                continue

            segment = SERStreetSegment(
                nombre_calle=street_name,
                color=color,
                tipo_reserva=color,
                num_plazas=plazas,
                distrito=distrito,
                barrio="",
                coordinates_json=json.dumps(coords)
            )
            db.add(segment)
            inserted_count += 1

            if inserted_count % 50 == 0:
                db.commit()
                print(f"[ETL] {inserted_count} tramos insertados...")

        db.commit()
        print(f"[ETL] Carga finalizada con éxito: {inserted_count} tramos con geometrías completas.")

        # Guardar caché
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)

    finally:
        db.close()

if __name__ == "__main__":
    run_etl()
